import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Anonymous mutation regression (register R-06). Verifies the deployed RLS
// denies every anonymous write path: INSERT is rejected, UPDATE and DELETE
// affect zero rows. Read-only acceptance lives in public-read-api.test.mjs;
// this suite is the write-side counterpart. Every probe is denied by RLS, so
// no residue is created. Gated behind ANON_MUTATION_LIVE=1 so the default unit
// run stays offline.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

function loadTarget() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || null;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null;
  const files = ['web/.env.local', 'mobile/.env'];
  for (const rel of files) {
    if (url && key) break;
    let txt;
    try { txt = readFileSync(resolve(repoRoot, rel), 'utf8'); } catch { continue; }
    if (!url) {
      const m = txt.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
      if (m) url = m[0];
    }
    if (!key) {
      const m = txt.match(/SUPABASE_ANON_KEY\s*=\s*["']?([A-Za-z0-9_\-.]+)/);
      if (m) key = m[1];
    }
  }
  return { url, key };
}

const live = process.env.ANON_MUTATION_LIVE === '1';
const { url, key } = live ? loadTarget() : { url: null, key: null };
const skip = !live ? 'set ANON_MUTATION_LIVE=1 to run against the deployed project'
  : (!url || !key) ? 'no Supabase URL/anon key found in the environment' : false;

// A probe id that matches no real row, so even a misconfigured policy could
// not touch existing data.
const probeId = '00000000-0000-0000-0000-011111100000';

async function mutate(method, path, body) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res;
}

test('anon mutation: INSERT into plant_records is denied', { skip }, async () => {
  const res = await mutate('POST', 'plant_records', { record_id: probeId, provisional_name: 'Field verification record' });
  assert.ok(res.status === 401 || res.status === 403, `anon INSERT must be denied, got ${res.status}`);
});

test('anon mutation: UPDATE of plant_records affects zero rows', { skip }, async () => {
  const res = await mutate('PATCH', `plant_records?record_id=eq.${probeId}`, { provisional_name: 'Field verification record' });
  assert.equal(res.status, 200, 'PATCH returns 200 with an empty body under silent RLS denial');
  assert.deepEqual(await res.json(), [], 'anon UPDATE must affect zero rows');
});

test('anon mutation: DELETE of plant_records affects zero rows', { skip }, async () => {
  const res = await mutate('DELETE', `plant_records?record_id=eq.${probeId}`);
  assert.equal(res.status, 200, 'DELETE returns 200 with an empty body under silent RLS denial');
  assert.deepEqual(await res.json(), [], 'anon DELETE must affect zero rows');
});

test('anon mutation: INSERT into species is denied', { skip }, async () => {
  const res = await mutate('POST', 'species', { scientific_name: 'Field verification species' });
  assert.ok(res.status === 401 || res.status === 403, `anon INSERT must be denied, got ${res.status}`);
});

test('anon mutation: UPDATE of species affects zero rows', { skip }, async () => {
  const res = await mutate('PATCH', `species?species_id=eq.${probeId}`, { scientific_name: 'Field verification species' });
  assert.equal(res.status, 200, 'PATCH returns 200 with an empty body under silent RLS denial');
  assert.deepEqual(await res.json(), [], 'anon UPDATE must affect zero rows');
});
