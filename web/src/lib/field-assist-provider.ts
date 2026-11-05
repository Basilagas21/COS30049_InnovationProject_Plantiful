import type { Candidate, Provider } from './field-assist-types';

export class IdentificationError extends Error {
  constructor(public code: string, public status = 502) { super(code); }
}
type JsonObject = Record<string, unknown>;
function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new IdentificationError('invalid_provider_response');
  return value as JsonObject;
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 300) throw new IdentificationError('invalid_provider_response');
  return value.trim();
}
function score(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new IdentificationError('invalid_provider_response');
  return value;
}
export function parseIdentification(provider: Provider, payload: unknown): { candidates: Candidate[]; version: string | null } {
  const body = object(payload);
  const result = provider === 'kindwise' ? object(body.result) : body;
  if (provider === 'kindwise' && object(result.is_plant).binary === false) return { candidates: [], version: typeof body.model_version === 'string' ? body.model_version : null };
  const rows = provider === 'plantnet' ? result.results : object(result.classification).suggestions;
  if (!Array.isArray(rows)) throw new IdentificationError('invalid_provider_response');
  const candidates = rows.slice(0, 20).map(value => {
    const row = object(value);
    const species = provider === 'plantnet' ? object(row.species) : row;
    const details = provider === 'kindwise' && row.details ? object(row.details) : {};
    const names = provider === 'plantnet' ? species.commonNames : details.common_names;
    const id = provider === 'plantnet' ? (row.gbif ? object(row.gbif).id : null) : row.id;
    return {
      scientificName: text(provider === 'plantnet' ? species.scientificNameWithoutAuthor : row.name),
      commonNames: Array.isArray(names) ? names.filter((name): name is string => typeof name === 'string').map(name => name.slice(0, 200)).slice(0, 5) : [],
      score: score(provider === 'plantnet' ? row.score : row.probability),
      taxonId: typeof id === 'string' || typeof id === 'number' ? String(id).slice(0, 200) : null,
    };
  }).sort((a, b) => b.score - a.score);
  const unique = candidates.filter((c, index) => candidates.findIndex(other => other.scientificName === c.scientificName) === index).slice(0, 3);
  const version = provider === 'plantnet' ? body.version : body.model_version;
  return { candidates: unique, version: typeof version === 'string' ? version.slice(0, 200) : null };
}

export async function identifyPlant(provider: Provider, key: string, images: { bytes: Uint8Array; mime: string }[], fetcher: typeof fetch = fetch) {
  if (!key || images.length < 1 || images.length > 5) throw new IdentificationError('invalid_identification_request', 400);
  let url: URL;
  let init: RequestInit;
  if (provider === 'plantnet') {
    url = new URL('https://my-api.plantnet.org/v2/identify/all');
    url.searchParams.set('api-key', key);
    url.searchParams.set('nb-results', '3');
    url.searchParams.set('lang', 'en');
    const form = new FormData();
    images.forEach((image, index) => {
      form.append('images', new Blob([new Uint8Array(image.bytes)], { type: image.mime }), `plant-${index}.${image.mime === 'image/png' ? 'png' : 'jpg'}`);
      form.append('organs', 'auto');
    });
    init = { method: 'POST', body: form };
  } else {
    url = new URL('https://plant.id/api/v3/identification');
    init = { method: 'POST', headers: { 'Api-Key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ images: images.map(image => Buffer.from(image.bytes).toString('base64')), similar_images: false }) };
  }
  try {
    const response = await fetcher(url, { ...init, signal: AbortSignal.timeout(45000), redirect: 'error', cache: 'no-store' });
    if (provider === 'plantnet' && response.status === 404) return { candidates: [], version: null };
    if (!response.ok) throw new IdentificationError(response.status === 429 ? 'provider_quota' : 'provider_unavailable');
    return parseIdentification(provider, await response.json());
  } catch (error) {
    if (error instanceof IdentificationError) throw error;
    // Never return provider URLs (Pl@ntNet puts the secret in the query string).
    throw new IdentificationError(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'provider_timeout' : 'provider_unavailable');
  }
}
