import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

/**
 * Get the server-side Supabase client (uses service role key).
 * Lazy singleton — similar to getRedis().
 */
export function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn("Supabase not configured — missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }

  supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabase;
}
