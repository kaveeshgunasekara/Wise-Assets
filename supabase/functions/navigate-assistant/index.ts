import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const BEDROCK_MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

const VALID_PAGES = new Set(["matching", "wisdom", "profile", "requests", "help", "home"]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── SigV4 helpers (identical to generate-story-summary) ─────────────────────

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(data: string | Uint8Array): Promise<string> {
  const input = typeof data === "string" ? enc(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", input));
}

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  data: string,
): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, enc(data));
}

async function deriveSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(enc(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

// ─── Bedrock invocation (same pattern as generate-story-summary) ──────────────

async function callBedrockClaude(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  prompt: string,
): Promise<string> {
  const singleEncoded = encodeURIComponent(BEDROCK_MODEL_ID);
  const doubleEncoded = singleEncoded.replace(/%/g, "%25");
  const canonicalUri = `/model/${doubleEncoded}/invoke`;
  const host = `bedrock-runtime.${region}.amazonaws.com`;
  const endpoint = `https://${host}/model/${singleEncoded}/invoke`;

  const requestBody = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 120,
    messages: [{ role: "user", content: prompt }],
  });

  const now = new Date();
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256(requestBody);

  const canonicalHeaders =
    `content-type:application/json\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-date";

  const canonicalRequest = [
    "POST",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/bedrock/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256(canonicalRequest),
  ].join("\n");

  const signingKey = await deriveSigningKey(secretAccessKey, dateStamp, region, "bedrock");
  const signature = hex(await hmacSha256(signingKey, stringToSign));
  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope},` +
    `SignedHeaders=${signedHeaders},Signature=${signature}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Date": amzDate,
      "Authorization": authHeader,
    },
    body: requestBody,
  });

  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[navigate-assistant] Bedrock HTTP ${res.status}:`, errBody);
    return "";
  }

  const data = await res.json();
  return (data?.content?.[0]?.text ?? "").trim();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION") ?? "us-west-2";

  try {
    const { transcript } = await req.json() as { transcript: string };

    if (!transcript?.trim()) {
      return new Response(
        JSON.stringify({ page: "unknown" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!awsAccessKeyId || !awsSecretAccessKey) {
      console.error("[navigate-assistant] AWS credentials not set — returning unknown");
      return new Response(
        JSON.stringify({ page: "unknown" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const prompt =
      `You are a navigation assistant for Viowise, an app connecting younger people with older mentors to share life wisdom.\n\n` +
      `The user said: "${transcript}"\n\n` +
      `Based on their request, which page should they go to? Reply with ONLY valid JSON — no markdown, no extra text:\n` +
      `{"page":"<page>","reply":"<short friendly spoken confirmation, max 12 words>"}\n\n` +
      `Page must be EXACTLY one of: matching, wisdom, profile, requests, help, home\n` +
      `- matching: find a mentor or learner, AI matching, meet someone, connect with someone\n` +
      `- wisdom: wisdom wall, stories, posts, read wisdom, explore community content\n` +
      `- profile: my profile, settings, edit my details, my photo, my account\n` +
      `- requests: call requests, pending calls, invitations, schedule a call\n` +
      `- help: help, support, how does this work, tutorial, guide\n` +
      `- home: home, back to start, main page, go back to beginning\n\n` +
      `Reply examples:\n` +
      `{"page":"matching","reply":"Taking you to AI Matching to find a mentor."}\n` +
      `{"page":"wisdom","reply":"Opening the Wisdom Wall for you."}\n` +
      `{"page":"profile","reply":"Going to your profile now."}`;

    const raw = await callBedrockClaude(awsAccessKeyId, awsSecretAccessKey, awsRegion, prompt);

    let parsed: { page: string; reply?: string } = { page: "unknown" };
    try {
      const clean = raw.replace(/```(?:json)?/g, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error("[navigate-assistant] JSON parse failed. Raw:", raw);
    }

    if (!VALID_PAGES.has(parsed.page)) {
      console.error("[navigate-assistant] invalid page value:", parsed.page, "— raw:", raw);
      parsed = { page: "unknown" };
    }

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[navigate-assistant] unexpected:", err);
    return new Response(
      JSON.stringify({ page: "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
