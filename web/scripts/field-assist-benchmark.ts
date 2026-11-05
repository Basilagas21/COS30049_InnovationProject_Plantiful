// Run with Node + tsx. Validation does not call a provider. --live makes real requests.
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { identifyPlant } from '../src/lib/field-assist-provider';
import { hashBytes, photoMime } from '../src/lib/field-assist-evidence';
import { summariseEvaluation, type EvaluationRow } from '../src/lib/field-assist-evaluation';
import type { Provider } from '../src/lib/field-assist-types';

type Observation = {
  id: string; scientificName: string; acceptableNames: string[]; verifier: string; provenance: string;
  individualId: string; split: 'pilot' | 'evaluation'; supported: boolean; images: string[];
};
async function main() {
  const args = process.argv.slice(2);
  const manifestPath = args[0];
  if (!manifestPath) throw new Error('Usage: node --import tsx scripts/field-assist-benchmark.ts manifest.json [--live] [--output=results.json]');
  const manifest: unknown = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest) || !manifest.length) throw new Error('Supply at least one independently confirmed observation. The template contains no test data.');
  const observations = manifest as Observation[];
  const seen = new Set<string>();
  const individuals = new Map<string, string>();
  const prepared = [];
  for (const item of observations) {
    for (const key of ['id','scientificName','verifier','provenance','individualId'] as const) {
      if (typeof item[key] !== 'string' || !item[key].trim() || /TBD|REPLACE_ME/i.test(item[key])) throw new Error(`Missing confirmed ${key}`);
    }
    if (seen.has(item.id)) throw new Error(`Duplicate observation ${item.id}`);
    seen.add(item.id);
    if (!['pilot','evaluation'].includes(item.split) || typeof item.supported !== 'boolean') throw new Error('Specify split and supported status');
    if (individuals.has(item.individualId) && individuals.get(item.individualId) !== item.split) throw new Error('The same plant individual appears in pilot and evaluation splits');
    individuals.set(item.individualId, item.split);
    if (!Array.isArray(item.acceptableNames) || item.acceptableNames.some(n => typeof n !== 'string' || !n.trim())) throw new Error('Invalid reviewed synonyms');
    if (!Array.isArray(item.images) || item.images.length < 1 || item.images.length > 5) throw new Error('Each observation needs one to five photos of the same individual');
    const images = [];
    let total = 0;
    for (const image of item.images) {
      const filename = path.resolve(path.dirname(manifestPath), image);
      const info = await stat(filename);
      if (!info.isFile() || info.size > 5 * 1024 * 1024) throw new Error('Photo exceeds 5 MB');
      const bytes = await readFile(filename); total += bytes.length;
      images.push({ bytes, mime: photoMime(bytes), sha256: hashBytes(bytes) });
    }
    if (total > 15 * 1024 * 1024) throw new Error('Observation exceeds 15 MB');
    prepared.push({ item, images });
  }
  console.log(`Validated ${prepared.length} observations. Labels are supplied by the manifest author, not independently verified by this script.`);
  if (!args.includes('--live')) { console.log('Validation only. No identification calls made.'); return; }
  const output = args.find(arg => arg.startsWith('--output='))?.slice(9);
  if (!output) throw new Error('--output is required for a live run to retain evidence');
  await stat(path.dirname(path.resolve(output)));
  const providers = (process.env.AI_BENCHMARK_PROVIDERS || 'plantnet').split(',') as Provider[];
  for (const provider of providers) {
    if (!['plantnet','kindwise'].includes(provider)) throw new Error('Unknown provider');
    if (!(provider === 'plantnet' ? process.env.PLANTNET_API_KEY : process.env.KINDWISE_API_KEY)) throw new Error(`Missing ${provider} key`);
  }
  const runs: Record<string, unknown> = {};
  for (const provider of providers) {
    const rows: (EvaluationRow & Record<string, unknown>)[] = [];
    for (const { item, images } of prepared) {
      const started = Date.now();
      const base = { observationId: item.id, species: item.scientificName, supported: item.supported,
        acceptableNames: [item.scientificName, ...item.acceptableNames], cost: null,
        split: item.split, individualId: item.individualId, verifier: item.verifier, provenance: item.provenance,
        hashes: images.map(i => i.sha256), timestamp: new Date().toISOString() };
      try {
        const result = await identifyPlant(provider, (provider === 'plantnet' ? process.env.PLANTNET_API_KEY : process.env.KINDWISE_API_KEY)!, images);
        rows.push({ ...base, status: result.candidates.length ? 'success' : 'no_match', candidates: result.candidates.map(c => c.scientificName),
          rawCandidates: result.candidates, modelVersion: result.version, durationMs: Date.now() - started });
      } catch (error) {
        rows.push({ ...base, status: 'failed', candidates: [], durationMs: Date.now() - started, error: error instanceof Error ? error.message : 'request_failed' });
      }
      runs[provider] = { rows, pilot: summariseEvaluation(rows.filter(r => r.split === 'pilot')), evaluation: summariseEvaluation(rows.filter(r => r.split === 'evaluation')) };
      await writeFile(output, JSON.stringify({ recordedAt: new Date().toISOString(), runs }, null, 2));
    }
  }
  console.log(`Results saved to ${output}. No accuracy claim applies beyond this labelled sample.`);
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Benchmark failed'); process.exitCode = 1; });
