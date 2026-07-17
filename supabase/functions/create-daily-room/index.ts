import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function createRoom(name: string, exp: number, apiKey: string) {
  return fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      properties: {
        exp,
        enable_prejoin_ui: false,
        enable_chat: true,
      },
    }),
  });
}

async function deleteRoom(name: string, apiKey: string) {
  return fetch(`https://api.daily.co/v1/rooms/${name}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` },
  });
}

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
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1-hour expiry from now

    // Try to create the room
    const createRes = await createRoom(roomName, exp, DAILY_API_KEY);

    if (createRes.ok) {
      const room = await createRes.json();
      console.log("[create-daily-room] Created new room:", roomName);
      return new Response(JSON.stringify({ url: room.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const createBody = await createRes.json();
    const alreadyExists =
      createRes.status === 400 &&
      (createBody?.error === "invalid-request-error" ||
        JSON.stringify(createBody).toLowerCase().includes("already exists"));

    if (alreadyExists) {
      // Fetch the existing room to check its expiry
      const getRes = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      });

      if (getRes.ok) {
        const existing = await getRes.json();
        const roomExp: number | undefined = existing?.config?.exp ?? existing?.properties?.exp;
        const nowSec = Math.floor(Date.now() / 1000);

        // If the room is still valid (expiry is in the future with ≥5 min remaining), reuse it.
        if (roomExp && roomExp > nowSec + 300) {
          console.log("[create-daily-room] Reusing existing room:", roomName, "exp:", new Date(roomExp * 1000).toISOString());
          return new Response(JSON.stringify({ url: existing.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Room is expired (or expiring soon) — delete it and recreate with a fresh expiry.
        console.log("[create-daily-room] Room expired, deleting and recreating:", roomName);
        await deleteRoom(roomName, DAILY_API_KEY);

        const retryRes = await createRoom(roomName, exp, DAILY_API_KEY);
        if (retryRes.ok) {
          const newRoom = await retryRes.json();
          console.log("[create-daily-room] Recreated room:", roomName);
          return new Response(JSON.stringify({ url: newRoom.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const retryBody = await retryRes.json();
        return new Response(
          JSON.stringify({ error: "Failed to recreate expired Daily room", detail: retryBody }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Failed to create or retrieve Daily room", detail: createBody }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
