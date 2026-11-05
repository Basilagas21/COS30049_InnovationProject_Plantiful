import { createHash } from 'node:crypto';
import { IdentificationError } from './field-assist-provider';

export function storagePhotoPath(photoUrl: string, supabaseUrl: string, allowedBucket = 'record-photos'): { bucket: string; path: string } {
  const url = new URL(photoUrl);
  const base = new URL(supabaseUrl);
  if (url.origin !== base.origin || url.username || url.password || url.search || url.hash) throw new IdentificationError('unsupported_photo_source', 400);
  const match = url.pathname.match(/^\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) throw new IdentificationError('unsupported_photo_source', 400);
  const bucket = decodeURIComponent(match[1]);
  const path = decodeURIComponent(match[2]);
  if (bucket !== allowedBucket || path.split('/').some(part => !part || part === '.' || part === '..') || path.includes('\\')) {
    throw new IdentificationError('unsupported_photo_source', 400);
  }
  return { bucket, path };
}
export function photoMime(bytes: Uint8Array): string {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if ([137,80,78,71,13,10,26,10].every((n, i) => bytes[i] === n)) return 'image/png';
  throw new IdentificationError('unsupported_image', 400);
}
export function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
export function hashBytes(value: Uint8Array): string { return createHash('sha256').update(value).digest('hex'); }

export type CatalogueSpecies = { species_id: string; scientific_name: string };
export type SpeciesAlias = { provider: string; provider_taxon_id: string | null; scientific_name: string; species_id: string };
export function matchSpecies(name: string, taxonId: string | null, provider: string, catalogue: CatalogueSpecies[], aliases: SpeciesAlias[]) {
  const normal = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const available = new Set(catalogue.map(s => s.species_id));
  const ids = aliases.filter(a => a.provider === provider && taxonId && a.provider_taxon_id === taxonId && available.has(a.species_id));
  const names = aliases.filter(a => a.provider === provider && normal(a.scientific_name) === normal(name) && available.has(a.species_id));
  const rows = ids.length ? ids : names;
  if (rows.length) {
    return new Set(rows.map(r => r.species_id)).size === 1
      ? { speciesId: rows[0].species_id, mapping: ids.length ? 'reviewed-id' as const : 'reviewed-name' as const }
      : { speciesId: null, mapping: 'unmapped' as const };
  }
  const exact = catalogue.filter(s => normal(s.scientific_name) === normal(name));
  return exact.length === 1 ? { speciesId: exact[0].species_id, mapping: 'exact-name' as const } : { speciesId: null, mapping: 'unmapped' as const };
}
