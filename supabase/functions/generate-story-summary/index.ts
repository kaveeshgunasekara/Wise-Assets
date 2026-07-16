import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Call Claude and return the generated text, or the fallback if anything goes wrong.
async function callClaude(
  apiKey: string,
  prompt: string,
  fallback: string,
): Promise<string> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[story-summary] Claude ${res.status}:`, body);
      return fallback;
    }

    const data = await res.json();
    const text = (data?.content?.[0]?.text ?? "").trim();
    return text || fallback;
  } catch (err) {
    console.error("[story-summary] Claude fetch threw:", err);
    return fallback;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY"); // may be absent — fallback handles it

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

    // ── 5. Build hardcoded fallbacks (also used when Claude is absent) ────────
    const elderFallback =
      `${elder.name} shared their wisdom about ${topicLabel} — ` +
      `a conversation that honoured years of lived experience and the insight that only time can bring.`;

    const youngerFallback =
      `A meaningful conversation with ${elder.name} about ${topicLabel} ` +
      `offered new perspective and guidance for the journey ahead.`;

    // ── 6. Generate summaries with Claude (parallel, with fallback) ───────────
    let elderSummary = elderFallback;
    let youngerSummary = youngerFallback;
    let usedClaude = false;

    if (anthropicKey) {
      const transcriptSection = transcript
        ? `\n\nTranscript excerpt:\n${transcript.slice(0, 3000)}`
        : "";

      const elderPrompt =
        `${elder.name} is a mentor (60+ years old) who just had a video call with ${younger.name}, ` +
        `a younger person seeking guidance. Topic: ${topicLabel}.${transcriptSection}\n\n` +
        `Write 2–3 warm, dignified sentences for ${elder.name}'s post on a wisdom-sharing platform. ` +
        `Frame it as wisdom THEY shared — honouring their experience. ` +
        `Write in first-person or warm reflective style. ` +
        `Be specific to the topic. Do not add quotation marks or a prefix like "Here is...".`;

      const youngerPrompt =
        `${younger.name} just had a video call with ${elder.name}, an experienced mentor. ` +
        `Topic: ${topicLabel}.${transcriptSection}\n\n` +
        `Write 2–3 sentences for ${younger.name}'s post on a wisdom-sharing platform. ` +
        `Frame it as guidance THEY received — a lesson for their journey. ` +
        `Be genuine and specific to the topic. Do not add quotation marks or a prefix like "Here is...".`;

      [elderSummary, youngerSummary] = await Promise.all([
        callClaude(anthropicKey, elderPrompt, elderFallback),
        callClaude(anthropicKey, youngerPrompt, youngerFallback),
      ]);
      usedClaude = true;
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
