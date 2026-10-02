import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function clientFromEnv() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof clientFromEnv> | null = null;

export function getBrowserSupabase() {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) browserClient = clientFromEnv();
  return browserClient;
}

export async function getServerSupabase() {
  if (!isSupabaseConfigured) return null;
  return clientFromEnv();
}