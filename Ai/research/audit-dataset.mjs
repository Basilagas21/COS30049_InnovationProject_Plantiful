// Metadata only. No images or observation locations are stored.
// node --env-file=web/.env.local Ai/research/audit-dataset.mjs [--all]
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';

const output = new URL('../datasets/catalogue-availability.json', import.meta.url);
const cache = new URL('../datasets/cache/inaturalist-availability.json', import.meta.url);
const licences = 'cc0,cc-by,cc-by-sa';
const filterVersion = 1;

export async function publicJson(path, parameters) {
  const url = new URL(path, 'https://api.inaturalist.org/v1/');
  url.search = new URLSearchParams(parameters).toString();
  for (let attempt = 0; attempt < 3; attempt++) {
    await delay(1200);
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (response.status === 429 || response.status >= 500) {
      await delay(10000 * (attempt + 1));
      continue;
    }
    if (!response.ok) throw new Error(`Public API HTTP ${response.status}`);
    return response.json();
  }
  throw new Error('Public API unavailable after retries');
}

async function catalogueNames() {
  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!origin || !key) throw new Error('Missing catalogue configuration');
  const names = [];
  for (let offset = 0; ; offset += 500) {
    const url = new URL('/rest/v1/species', origin);
    url.search = new URLSearchParams({ select: 'scientific_name', order: 'species_id', limit: '500', offset: String(offset) }).toString();
    const response = await fetch(url, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Catalogue HTTP ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error('Unexpected catalogue response');
    names.push(...rows.map(row => row.scientific_name).filter(name => typeof name === 'string' && name.trim()).map(name => name.trim()));
    if (rows.length < 500) break;
  }
  return [...new Set(names)].sort();
}

async function audit(name) {
  const taxa = await publicJson('taxa', { q: name, rank: 'species', is_active: 'true', per_page: '30' });
  if (!Array.isArray(taxa.results)) throw new Error('Unexpected taxa response');
  const exact = taxa.results.filter(taxon => taxon.is_active === true && taxon.rank === 'species' && taxon.name.toLowerCase() === name.toLowerCase());
  const checked_at = new Date().toISOString();
  if (exact.length !== 1) return { name, checked_at, status: 'needs_taxonomy_review', candidate_count: exact.length };
  const taxon = exact[0];
  const counts = await publicJson('observations', {
    taxon_id: String(taxon.id), quality_grade: 'research', photos: 'true',
    photo_license: licences, captive: 'false', per_page: '1',
  });
  if (!Number.isInteger(counts.total_results) || counts.total_results < 0) throw new Error('Unexpected observation count');
  return {
    name, checked_at, status: 'resolved', taxon_id: taxon.id,
    source: `https://www.inaturalist.org/taxa/${taxon.id}`,
    eligible_observations: counts.total_results,
  };
}

async function main() {
  if (process.argv.length > 3 || (process.argv[2] && process.argv[2] !== '--all')) throw new Error('Unexpected arguments');
  const names = await catalogueNames();
  const selected = process.argv[2] === '--all' ? names : names.slice(0, 20);
  let cached = {};
  try {
    const saved = JSON.parse(await readFile(cache, 'utf8'));
    if (saved.filter_version === filterVersion) cached = saved.rows;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('Invalid audit cache. Review or remove cache before retrying.');
  }
  await mkdir(new URL('../datasets/cache/', import.meta.url), { recursive: true });
  const rows = [];
  for (const name of selected) {
    const existing = cached[name];
    if (existing && Date.now() - Date.parse(existing.checked_at) < 7 * 86400000) {
      rows.push(existing);
      continue;
    }
    const row = await audit(name);
    rows.push(row);
    cached[name] = row;
    await writeFile(cache, JSON.stringify({ filter_version: filterVersion, rows: cached }, null, 2) + '\n');
    console.log(`${rows.length}/${selected.length} ${name}: ${row.eligible_observations ?? row.status}`);
  }
  const report = {
    generated_at: new Date().toISOString(), filter_version: filterVersion,
    catalogue_species: names.length, audited_species: rows.length,
    scope: 'Global iNaturalist observations, not restricted to Malaysia',
    filters: { quality_grade: 'research', photos: true, photo_license: licences, captive: false },
    method: 'Unique active exact scientific-name match. No fuzzy or synonym acceptance. Counts are observations with eligible photos, not reviewed images or independent specimens. Cached rows expire after seven days.',
    caveats: 'Research grade is community consensus, not independently verified training ground truth. Recheck individual photo licences and attribution before download. Deduplicate photographs and group observations before splitting.',
    summary: {
      resolved: rows.filter(row => row.status === 'resolved').length,
      needs_taxonomy_review: rows.filter(row => row.status !== 'resolved').length,
      at_least_100_observations: rows.filter(row => row.eligible_observations >= 100).length,
      at_least_300_observations: rows.filter(row => row.eligible_observations >= 300).length,
    },
    rows,
  };
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.summary));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => {
  console.error('Dataset audit stopped. Check configuration, connectivity and cache. Completed rows remain cached. No credentials are printed.');
  process.exitCode = 1;
});
