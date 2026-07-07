import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "[viowise] Supabase is not configured. " +
      "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Replit Secrets " +
      "and restart the dev server. The app will continue to use mock data until " +
      "those secrets are present.",
  );
}

// createClient requires non-empty strings; fall back to placeholder values so
// the module loads safely even when the secrets are absent (the app stays on
// mock data via api.ts — no Supabase calls are made until you wire them up).
export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseKey ?? "placeholder-anon-key",
);
