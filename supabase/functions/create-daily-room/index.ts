import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    if (!DAILY_API_KEY) {
      return new Response(JSON.stringify({ error: "DAILY_API_KEY secret is not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userA, userB } = await req.json();
    if (!userA || !userB) {
      return new Response(JSON.stringify({ error: "userA and userB are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deterministic room name — sort so both users compute the same name
    const roomName = `viowise-${[userA, userB].sort().join("-").slice(0, 40)}`;

    const exp = Math.floor(Date.now() / 1000) + 3600; // 1-hour expiry

    const createRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp,
          enable_prejoin_ui: false,
          enable_chat: true,
        },
      }),
    });

    if (createRes.ok) {
      const room = await createRes.json();
      return new Response(JSON.stringify({ url: room.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If the room already exists, fetch and return it
    const createBody = await createRes.json();
    const alreadyExists =
      createRes.status === 400 &&
      (createBody?.error === "invalid-request-error" ||
        JSON.stringify(createBody).toLowerCase().includes("already exists"));

    if (alreadyExists) {
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });
      if (getRes.ok) {
        const existing = await getRes.json();
        return new Response(JSON.stringify({ url: existing.url }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Failed to create or retrieve Daily room", detail: createBody }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
