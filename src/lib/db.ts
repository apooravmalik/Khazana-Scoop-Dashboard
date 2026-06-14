import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

declare global {
  var khazaScoopSupabase: SupabaseClient | undefined;
}

function assertSupabaseConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
}

export function getSupabase() {
  assertSupabaseConfig();

  if (!global.khazaScoopSupabase) {
    global.khazaScoopSupabase = createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return global.khazaScoopSupabase;
}

export const databaseProvider = "Supabase";
export const databaseProjectUrl = supabaseUrl;
