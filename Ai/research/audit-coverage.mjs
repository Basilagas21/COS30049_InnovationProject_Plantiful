// Read-only network audit. Run from the repository root with Node 22 or newer:
// node --env-file=web/.env.local Ai/research/audit-coverage.mjs
// Prints scientific names and coverage only. Never prints environment values.
import { createHash } from 'node:crypto';

const sources = {
  plantnet: 'https://huggingface.co/cpoisson/plantnet300k-mobilenetv3-small/resolve/main/plantnet300K_species_id_2_name.json',
  inaturalist: 'https://github.com/inaturalist/model-files/releases/download/v25.01.15/taxonomy.json',
};
async function main() {
  const source = process.argv[2] ?? 'plantnet';
  if (!Object.hasOwn(sources, source) || process.argv.length > 3) {
    throw new Error('Unexpected arguments. Use plantnet or inaturalist.');
  }
  const labelUrl = sources[source];
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
  const bytes = Buffer.from(await response.arrayBuffer());
  const metadata = JSON.parse(bytes.toString('utf8'));
  if (source === 'inaturalist' && (!Array.isArray(metadata) || !metadata.every(row => row && typeof row === 'object'))) {
    throw new Error('Unexpected taxonomy structure');
  }
  // Ancestors are taxonomy nodes, not necessarily trained classifier outputs.
  const labels = source === 'inaturalist'
    ? metadata.filter(row => Number.isInteger(row.leaf_class_id) && row.leaf_class_id >= 0).map(row => row.name)
    : Object.values(metadata);
  if (!labels.length) throw new Error('Unexpected empty label list');
  if (!labels.every(label => typeof label === 'string')) throw new Error('Unexpected label structure');
  const results = [...new Set(names)].map(name => ({
    name,
    matches: labels.filter(label => label.toLowerCase() === name.toLowerCase() || label.toLowerCase().startsWith(`${name.toLowerCase()} `)),
  }));
  console.log(JSON.stringify({
    checked_at: new Date().toISOString(), source: labelUrl,
    metadata_sha256: createHash('sha256').update(bytes).digest('hex'),
    label_selection: source === 'inaturalist' ? 'Taxonomy rows with nonnegative integer leaf_class_id only' : 'All label JSON values',
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
