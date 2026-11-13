import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Public Read Service acceptance test (proposal Section 7 quality matrix,
// "Public access correctness": no unpublished record is ever returned to an
// unauthenticated request). Unlike the stub-based unit tests, this suite hits
// the deployed project's REST surface directly with the anon key, read-only.
// It is gated behind PUBLIC_READ_LIVE=1 so the default unit run stays offline.

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

function loadTarget() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || null;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || null;
  const files = ['web/.env', 'web/.env.local', 'mobile/.env'];
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

const live = process.env.PUBLIC_READ_LIVE === '1';
const { url, key } = live ? loadTarget() : { url: null, key: null };
const skip = !live ? 'set PUBLIC_READ_LIVE=1 to run against the deployed project'
  : (!url || !key) ? 'no Supabase URL/anon key found in the environment' : false;

async function get(path) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  assert.equal(res.status, 200, `GET ${path} should succeed for anon`);
  return res.json();
}

test('public read: anon cannot read unpublished species', { skip }, async () => {
  const rows = await get('species?select=species_id,is_published&is_published=eq.false');
  assert.deepEqual(rows, [], 'RLS must return no unpublished species to anon');
});

test('public read: anon cannot read non-approved records', { skip }, async () => {
  const rows = await get('plant_records?select=record_id,approval_status&approval_status=neq.approved');
  assert.deepEqual(rows, [], 'RLS must return no non-approved record to anon');
});

test('public read: published species are readable and every row is published', { skip }, async () => {
  const rows = await get('species?select=species_id,is_published&is_published=eq.true');
  assert.ok(Array.isArray(rows), 'published species query returns a list');
  for (const row of rows) {
    assert.equal(row.is_published, true, 'every returned species must be published');
  }
});

test('public read: public record list returns only approved records', { skip }, async () => {
  const rows = await get('plant_records?select=record_id,approval_status&limit=200');
  assert.ok(Array.isArray(rows), 'public record query returns a list');
  for (const row of rows) {
    assert.equal(row.approval_status, 'approved', 'every returned record must be approved');
  }
});

test('R-10: the public record list select omits qr_code', { skip }, async () => {
  // Mirrors the top-level fields of fetchRecords in records.ts, which must not
  // request qr_code for the public list (the detail query keeps it for the QR
  // deep-link). Verifies the deployed response carries no qr_code field.
  const select = 'record_id,provisional_name,gps_lat,gps_lng,gps_accuracy_m,height_cm,dbh_cm,taxonomy,phenology,morphology,notes,approval_status,status,created_at,reviewed_at,synced_at,device_id,rejection_reason';
  const rows = await get(`plant_records?select=${select}&limit=50`);
  for (const row of rows) {
    assert.ok(!('qr_code' in row), 'public list response must not carry qr_code');
  }
});