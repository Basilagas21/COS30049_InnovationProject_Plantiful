// Read-only public-catalogue audit. Does not access private records or provider APIs.
import { createClient } from '@supabase/supabase-js';
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Configure the public Supabase URL and anon key locally.');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from('species').select('species_id,scientific_name').eq('is_published', true).order('scientific_name').limit(1000);
  if (error) throw new Error('Public catalogue query failed. No provider coverage claim can be made.');
  console.log(JSON.stringify({ scope: 'Anonymous published-catalogue visibility only, maximum 1000 rows', recordedAt: new Date().toISOString(), species: data }, null, 2));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
