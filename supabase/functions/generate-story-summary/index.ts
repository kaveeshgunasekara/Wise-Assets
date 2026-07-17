import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Editable model constant ───────────────────────────────────────────────────
// If you get an inference-profile error, try the cross-region prefix variant:
//   "us.anthropic.claude-haiku-4-5-20251001-v1:0"
const BEDROCK_MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface UserProfile {
  id: string;
  name: string;
  role: "mentor" | "learner";
  topics: string[];
}

// ─── AWS Signature v4 helpers (Deno Web Crypto — no Node deps) ────────────────

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

// ─── Bedrock invocation ────────────────────────────────────────────────────────

async function callBedrockClaude(
  accessKeyId: string,
  secretAccessKey: string,
  region: string,
  prompt: string,
  fallback: string,
): Promise<{ text: string; usedClaude: boolean }> {
  try {
    // SigV4 requires DOUBLE-encoding in the canonical URI used for signing,
    // but the actual fetch URL uses single-encoding.
    //   singleEncoded: "...v1%3A0"   → used in the real request URL
    //   doubleEncoded: "...v1%253A0" → used only inside canonicalRequest for signing
    const singleEncoded = encodeURIComponent(BEDROCK_MODEL_ID); // colon → %3A
    const doubleEncoded = singleEncoded.replace(/%/g, "%25");   // %3A  → %253A
    const canonicalUri = `/model/${doubleEncoded}/invoke`; // signing only
    const host = `bedrock-runtime.${region}.amazonaws.com`;
    const endpoint = `https://${host}/model/${singleEncoded}/invoke`; // actual request

    // Request body — model ID goes in the URL, NOT here
    const requestBody = JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 120,
      messages: [{ role: "user", content: prompt }],
    });

    // Timestamp: YYYYMMDDTHHMMSSZ
    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = await sha256(requestBody);

    // Canonical headers — lowercase, sorted alphabetically, trailing newline on each
    const canonicalHeaders =
      `content-type:application/json\n` +
      `host:${host}\n` +
      `x-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-date";

    const canonicalRequest = [
      "POST",
      canonicalUri,
      "", // empty query string
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
      `SignedHeaders=${signedHeaders},` +
      `Signature=${signature}`;

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
      console.error(`[story-summary] Bedrock HTTP ${res.status} for model ${BEDROCK_MODEL_ID}:`, errBody);
      return { text: fallback, usedClaude: false };
    }

    const data = await res.json();
    const text = (data?.content?.[0]?.text ?? "").trim();

    if (!text) {
      console.error("[story-summary] Bedrock returned empty content. Full response:", JSON.stringify(data));
      return { text: fallback, usedClaude: false };
    }

    return { text, usedClaude: true };
  } catch (err) {
    console.error("[story-summary] Bedrock call threw:", err);
    return { text: fallback, usedClaude: false };
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const awsAccessKeyId = Deno.env.get("AWS_ACCESS_KEY_ID");
  const awsSecretAccessKey = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const awsRegion = Deno.env.get("AWS_REGION") ?? "us-west-2";

  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { userA, userB, transcript } = body as {
      userA: string;
      userB: string;
      transcript?: string;
    };

    if (!userA || !userB) {
      return new Response(
        JSON.stringify({ error: "userA and userB are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── 1. Fetch both user profiles ──────────────────────────────────────────
    const { data: profiles, error: profilesErr } = await sb
      .from("users")
      .select("id, name, role, topics")
      .in("id", [userA, userB]);

    if (profilesErr || !profiles || profiles.length < 2) {
      console.error("[story-summary] profiles fetch:", profilesErr);
      return new Response(
        JSON.stringify({ error: "Could not fetch user profiles" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Determine elder (mentor) and younger (learner).
    // Fall back gracefully if both happen to have the same role.
    const elder: UserProfile =
      profiles.find((p: UserProfile) => p.role === "mentor") ?? profiles[0];
    const younger: UserProfile =
      profiles.find((p: UserProfile) => p.role === "learner") ?? profiles[1];

    // ── 2. Find the most-recent completed request between them ───────────────
    const { data: reqs } = await sb
      .from("requests")
      .select("id")
      .or(
        `and(from_id.eq.${userA},to_id.eq.${userB}),and(from_id.eq.${userB},to_id.eq.${userA})`,
      )
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(1);

    const requestId: string | null = reqs?.[0]?.id ?? null;

    // ── 3. Create a call_sessions record ─────────────────────────────────────
    const { data: sessionRow } = await sb
      .from("call_sessions")
      .insert({
        request_id: requestId,
        transcript: transcript ?? null,
        language: "en",
        ended_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    const callSessionId: string | null = sessionRow?.id ?? null;

    // ── 4. Build topic context ────────────────────────────────────────────────
    const elderTopics: string[] = elder.topics ?? [];
    const youngerTopics: string[] = younger.topics ?? [];
    const shared = elderTopics.filter((t) => youngerTopics.includes(t));
    const topicLabel =
      shared.length > 0
        ? shared.join(", ")
        : (elderTopics[0] ?? youngerTopics[0] ?? "life and experience");
    const primaryTopic =
      shared[0] ?? elderTopics[0] ?? youngerTopics[0] ?? "Life & Experience";

    // ── 5. Build hardcoded fallbacks (used when Bedrock is absent or fails) ──
    const elderFallback =
      `${elder.name} shared their wisdom about ${topicLabel} — ` +
      `a conversation that honoured years of lived experience and the insight that only time can bring.`;

    const youngerFallback =
      `A meaningful conversation with ${elder.name} about ${topicLabel} ` +
      `offered new perspective and guidance for the journey ahead.`;

    // ── 6. Generate summaries via Bedrock (parallel, with fallback) ───────────
    let elderSummary = elderFallback;
    let youngerSummary = youngerFallback;
    let usedClaude = false; // only true if Bedrock actually returned text

    if (awsAccessKeyId && awsSecretAccessKey) {
      const transcriptSection = transcript
        ? `\n\nTranscript excerpt:\n${transcript.slice(0, 3000)}`
        : "";

      const elderPrompt =
        `${elder.name} (mentor, 60+) just shared wisdom with ${younger.name} about: ${topicLabel}.${transcriptSection}\n\n` +
        `Write ONLY 1-2 short sentences (max 40 words) for ${elder.name}'s post on a wisdom-sharing platform. ` +
        `Frame it as wisdom THEY shared, honouring their experience. First-person or warm reflective tone. ` +
        `Plain text only — no title, no markdown, no headers, no # symbols, no quotation marks, no prefix. Just the summary itself.`;

      const youngerPrompt =
        `${younger.name} just received guidance from ${elder.name} (mentor, 60+) about: ${topicLabel}.${transcriptSection}\n\n` +
        `Write ONLY 1-2 short sentences (max 40 words) for ${younger.name}'s post on a wisdom-sharing platform. ` +
        `Frame it as guidance THEY received — a lesson for their journey. Genuine and personal tone. ` +
        `Plain text only — no title, no markdown, no headers, no # symbols, no quotation marks, no prefix. Just the summary itself.`;

      const [elderResult, youngerResult] = await Promise.all([
        callBedrockClaude(awsAccessKeyId, awsSecretAccessKey, awsRegion, elderPrompt, elderFallback),
        callBedrockClaude(awsAccessKeyId, awsSecretAccessKey, awsRegion, youngerPrompt, youngerFallback),
      ]);

      elderSummary = elderResult.text;
      youngerSummary = youngerResult.text;
      // usedClaude is true only if at least one call returned real generated text
      usedClaude = elderResult.usedClaude || youngerResult.usedClaude;
    } else {
      console.error("[story-summary] AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY not set — using fallback.");
    }

    // ── 7. Insert two pending_approval posts ──────────────────────────────────
    const { error: insertErr } = await sb.from("posts").insert([
      {
        author_id: elder.id,
        type: "call_summary",
        quote: elderSummary,
        topic: primaryTopic,
        source: "call",
        status: "pending_approval",
        is_new: true,
        call_session_id: callSessionId,
      },
      {
        author_id: younger.id,
        type: "call_summary",
        quote: youngerSummary,
        topic: primaryTopic,
        source: "call",
        status: "pending_approval",
        is_new: true,
        call_session_id: callSessionId,
      },
    ]);

    if (insertErr) {
      console.error("[story-summary] posts insert:", insertErr);
      return new Response(
        JSON.stringify({ error: "Failed to insert posts", detail: insertErr }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, callSessionId, usedClaude }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[story-summary] unexpected:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
