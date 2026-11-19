import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// This standalone site has no sign-in and never writes to the database — it
// only ever reads PUBLIC data (published species, approved field records)
// using the project's anon key, the same way the main Plantiful app's own
// public pages (/explore, /species) do for signed-out visitors. Row Level
// Security on the real database only lets the anon role see published /
// approved rows in the first place, so this key can't expose anything
// unpublished even if someone reads it out of the page source.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

let cachedClient: SupabaseClient<Database> | null = null;

/** Returns null when NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *  aren't set, so callers can show an honest "not connected" state instead
 *  of a misleading empty list. */
export function getPublicSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured) return null;
  if (!cachedClient) {
    cachedClient = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false },
    });
  }
  return cachedClient;
}
