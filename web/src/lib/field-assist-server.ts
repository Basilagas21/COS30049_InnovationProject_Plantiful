import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { fingerprint, hashBytes, photoMime, storagePhotoPath } from './field-assist-evidence';
import { IdentificationError } from './field-assist-provider';
import type { PhotoEvidence, Provider } from './field-assist-types';

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function providerConfig() {
  const provider = process.env.AI_PROVIDER;
  if (provider !== 'plantnet' && provider !== 'kindwise') return null;
  const key = provider === 'plantnet' ? process.env.PLANTNET_API_KEY : process.env.KINDWISE_API_KEY;
  return key ? { provider: provider as Provider, key } : null;
}

export async function assistContext(request: Request, recordId: string) {
  if (!UUID.test(recordId)) throw new IdentificationError('invalid_record', 400);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) throw new IdentificationError('field_assist_not_configured', 503);
  const bearer = request.headers.get('authorization');
  if (request.method !== 'GET' && !bearer) {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin) throw new IdentificationError('invalid_origin', 403);
  }
  const auth = bearer
    ? createSupabaseClient(url, anon, { global: { headers: { Authorization: bearer } }, auth: { persistSession: false, autoRefreshToken: false } })
    : await createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) throw new IdentificationError('sign_in_required', 401);
  const db = createSupabaseClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const [profileResult, recordResult] = await Promise.all([
    db.from('user_profiles').select('role').eq('user_id', user.id).maybeSingle(),
    db.from('plant_records').select('record_id,botanist_id,version,species_id,provisional_name,gps_lat,gps_lng,gps_accuracy_m,morphology,notes').eq('record_id', recordId).maybeSingle(),
  ]);
  if (profileResult.error || recordResult.error) throw new IdentificationError('database_unavailable', 503);
  const reviewer = ['admin', 'conservation_officer'].includes(profileResult.data?.role ?? '');
  const record = recordResult.data;
  const owner = record?.botanist_id === user.id;
  if (!record || (!owner && !reviewer)) throw new IdentificationError('record_unavailable', 404);
  return { db, user, record, owner, reviewer, url, service };
}

// Read a bounded stream from the configured storage origin, never from arbitrary photo URLs.
async function imageBytes(url: string, service: string): Promise<Uint8Array> {
  const response = await fetch(url, { headers: { apikey: service, Authorization: `Bearer ${service}` },
    signal: AbortSignal.timeout(15000), redirect: 'error', cache: 'no-store' });
  if (!response.ok || !response.body) throw new IdentificationError('photo_unavailable', 409);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 5 * 1024 * 1024) throw new IdentificationError('photo_too_large', 413);
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks);
}

export async function evidenceSnapshot(context: Awaited<ReturnType<typeof assistContext>>) {
  const { db, record, url, service } = context;
  const { data, error } = await db.from('plant_record_photos').select('photo_id,photo_url,taken_at')
    .eq('record_id', record.record_id).order('photo_id').limit(101);
  if (error) throw new IdentificationError('photos_unavailable', 503);
  if (!data?.length) throw new IdentificationError('upload_photos_first', 409);
  if (data.length > 100) throw new IdentificationError('too_many_record_photos', 400);
  const images: { bytes: Uint8Array; mime: string }[] = [];
  const photos: PhotoEvidence[] = [];
  let total = 0;
  for (const photo of data.slice(0, 5)) {
    const { bucket, path } = storagePhotoPath(photo.photo_url, url, process.env.AI_PHOTO_BUCKET || 'record-photos');
    // Existing uploads are partitioned by uploader/record. Do not use a forged row to read another record's object.
    if (path.split('/')[1] !== record.record_id) throw new IdentificationError('photo_record_mismatch', 400);
    const endpoint = `${url}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
    const bytes = await imageBytes(endpoint, service);
    total += bytes.length;
    if (total > 15 * 1024 * 1024) throw new IdentificationError('photos_too_large', 413);
    images.push({ bytes, mime: photoMime(bytes) });
    const sha256 = hashBytes(bytes);
    photos.push({ ...photo, sha256, evidence_path: `${record.record_id}/${sha256}.${photoMime(bytes) === 'image/png' ? 'png' : 'jpg'}` });
  }
  const evidence = {
    photoCount: data.length, analysedPhotoCount: photos.length, locationRecorded: record.gps_lat !== null && record.gps_lng !== null,
    gpsAccuracyM: record.gps_accuracy_m, fieldNotesRecorded: Boolean(record.morphology?.trim() || record.notes?.split('\n').filter((line: string) => !line.startsWith('[Field evidence: ')).join('\n').trim()),
    catalogueSpeciesId: record.species_id, provisionalName: record.provisional_name,
  };
  return { photos, images, evidence, fingerprint: fingerprint({ record, inventory: data, photos }) };
}

export async function retainEvidence(context: Awaited<ReturnType<typeof assistContext>>, snapshot: Awaited<ReturnType<typeof evidenceSnapshot>>) {
  for (let index = 0; index < snapshot.photos.length; index++) {
    const { error } = await context.db.storage.from('ai-evidence').upload(snapshot.photos[index].evidence_path,
      snapshot.images[index].bytes, { contentType: snapshot.images[index].mime, upsert: false });
    if (error && !['409', '400'].includes(String(error.statusCode))) throw new IdentificationError('evidence_archive_failed', 503);
    // Verify an existing object is the expected content, rather than accepting arbitrary upload failures.
    if (error) {
      const { data, error: readError } = await context.db.storage.from('ai-evidence').download(snapshot.photos[index].evidence_path);
      if (readError || !data || hashBytes(new Uint8Array(await data.arrayBuffer())) !== snapshot.photos[index].sha256) throw new IdentificationError('evidence_archive_failed', 503);
    }
  }
}

export async function smallJson(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new IdentificationError('invalid_request', 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 8192) throw new IdentificationError('request_too_large', 413);
      chunks.push(value);
    }
    const result: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error();
    return result as Record<string, unknown>;
  } catch (error) {
    if (error instanceof IdentificationError) throw error;
    throw new IdentificationError('invalid_request', 400);
  } finally { await reader.cancel().catch(() => {}); }
}

export function assistError(error: unknown) {
  return Response.json({ error: error instanceof IdentificationError ? error.code : 'field_assist_unavailable' },
    { status: error instanceof IdentificationError ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
