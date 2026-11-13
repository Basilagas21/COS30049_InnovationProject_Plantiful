// Build a metadata manifest only. Does not download images or assign training labels/splits.
// node Ai/research/collect-candidates.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { publicJson } from './audit-dataset.mjs';

const allowed = new Set(['cc0', 'cc-by', 'cc-by-sa']);

export function candidatePhoto(observation, taxonId) {
  if (observation.quality_grade !== 'research' || observation.taxon?.id !== taxonId || observation.captive === true) return null;
  return observation.photos?.find(photo => {
    if (!allowed.has(photo.license_code) || !Number.isInteger(photo.id) || !photo.attribution) return false;
    try {
      const url = new URL(photo.url);
      return url.protocol === 'https:' && ['inaturalist-open-data.s3.amazonaws.com', 'static.inaturalist.org'].includes(url.hostname)
        && /^\/photos\/\d+\/square\.(jpg|jpeg|png)$/i.test(url.pathname) && !url.search;
    } catch { return false; }
  }) ?? null;
}

async function main() {
  const plan = JSON.parse(await readFile(new URL('../datasets/pilot-species.json', import.meta.url), 'utf8'));
  const audit = JSON.parse(await readFile(new URL('../datasets/catalogue-availability.json', import.meta.url), 'utf8'));
  const manifest = [];
  const seen = new Set();
  const summary = [];
  for (const name of plan.species) {
    const entry = audit.rows.find(row => row.name === name && row.status === 'resolved');
    if (!entry) throw new Error('Pilot species requires taxonomy review');
    const result = await publicJson('observations', {
      taxon_id: String(entry.taxon_id), quality_grade: 'research', photos: 'true',
      photo_license: [...allowed].join(','), captive: 'false',
      per_page: '100', order_by: 'id', order: 'asc',
    });
    if (!Array.isArray(result.results)) throw new Error('Unexpected observations response');
    let accepted = 0;
    for (const observation of result.results) {
      const photo = candidatePhoto(observation, entry.taxon_id);
      if (!photo || seen.has(photo.id)) continue;
      seen.add(photo.id);
      accepted++;
      manifest.push({
        catalogue_name: name, source_taxon_id: entry.taxon_id,
        observation_id: observation.id,
        observation_url: `https://www.inaturalist.org/observations/${observation.id}`,
        photo_id: photo.id, image_url: photo.url.replace('/square.', '/medium.'),
        licence: photo.license_code, attribution: photo.attribution,
        retrieved_at: new Date().toISOString(),
        review_status: 'pending', split: null, sha256: null,
      });
    }
    summary.push({ name, fetched_observations: result.results.length, candidate_photos: accepted });
    console.log(`${name}: ${accepted} candidates`);
  }
  await writeFile(new URL('../datasets/pilot-candidates.jsonl', import.meta.url), manifest.map(row => JSON.stringify(row)).join('\n') + '\n');
  await writeFile(new URL('../datasets/pilot-summary.json', import.meta.url), JSON.stringify({
    generated_at: new Date().toISOString(), species: summary.length, candidate_photos: manifest.length,
    sampling: 'First 100 eligible observations ordered by ID per species. At most one photo per observation. This is a convenience sample, not a random or geographically balanced training dataset.',
    status: 'Metadata only. Images not downloaded, labels not independently reviewed, splits not assigned.',
    rows: summary,
  }, null, 2) + '\n');
  console.log(`Total: ${manifest.length} candidate photos across ${summary.length} species`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(() => {
  console.error('Candidate collection stopped. Check availability audit and public API connectivity.');
  process.exitCode = 1;
});
