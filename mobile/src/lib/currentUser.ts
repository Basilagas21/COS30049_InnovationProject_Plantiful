import { supabase } from '@/lib/supabase';

// The signed-in account's id, used to stamp local captures with their owner
// so a shared device never pushes one botanist's data under another's name.
// Returns null when Supabase is unconfigured or nobody is signed in.
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
