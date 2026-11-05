// Read-only network audit. Run from the repository root with Node 22 or newer:
// node --env-file=web/.env.local Ai/research/audit-coverage.mjs
// Prints scientific names and coverage only. Never prints environment values.
const labelUrl = 'https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small/resolve/main/plantnet300K_species_id_2_name.json';
async function main() {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!origin || !key) throw new Error('Missing backend configuration');
  const names = [];
  for (let offset = 0; ; offset += 500) {
    const url = new URL('/rest/v1/species', origin);
    url.search = new URLSearchParams({ select: 'scientific_name', order: 'species_id', limit: '500', offset: String(offset) }).toString();
    const response = await fetch(url, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Catalogue HTTP ${response.status}`);
    const rows = await response.json();
    names.push(...rows.map(row => row.scientific_name).filter(name => typeof name === 'string'));
    if (rows.length < 500) break;
  }
  const response = await fetch(labelUrl, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Label source HTTP ${response.status}`);
  const labels = Object.values(await response.json());
  if (!labels.every(label => typeof label === 'string')) throw new Error('Unexpected label structure');
  const results = [...new Set(names)].map(name => ({
    name,
    matches: labels.filter(label => label.toLowerCase() === name.toLowerCase() || label.toLowerCase().startsWith(`${name.toLowerCase()} `)),
  }));
  console.log(JSON.stringify({
    checked_at: new Date().toISOString(), source: labelUrl,
    catalogue_species: results.length, model_label_entries: labels.length,
    matched_catalogue_species: results.filter(row => row.matches.length).length,
    method: 'Case-insensitive exact name or name followed by a space. No synonym resolution. Label presence is not accuracy or verified output-index mapping.',
    matched: results.filter(row => row.matches.length),
    unmatched: results.filter(row => !row.matches.length).map(row => row.name),
  }, null, 2));
}
main().catch(error => {
  console.error(error instanceof Error && /^(Missing|Catalogue HTTP|Label source HTTP|Unexpected)/.test(error.message) ? error.message : 'Coverage audit failed. Check connectivity and configuration.');
  process.exitCode = 1;
});
