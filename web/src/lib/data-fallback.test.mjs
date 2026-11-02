import assert from 'node:assert/strict';
import test from 'node:test';

// These modules read the Supabase configuration at import time; with no
// environment configured they fall back to the bundled sample data, which is
// the offline demo mode the pages render. The tests pin that contract: the
// fetch helpers always resolve to well-formed shapes, published filtering
// holds, and conflict reports are empty until the backend is reachable.
process.env.NEXT_PUBLIC_SUPABASE_URL = '';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

const species = await import('@/lib/species');
const records = await import('@/lib/records');

test('fetchSpecies returns sample rows and honours publishedOnly', async () => {
  const all = await species.fetchSpecies();
  assert.ok(all.length > 0, 'sample catalogue is not empty');
  const published = await species.fetchSpecies({ publishedOnly: true });
  assert.ok(published.every((s) => s.isPublished));
  assert.ok(published.length <= all.length);
  for (const s of all) {
    assert.ok(s.id && s.scientificName, 'each row carries an id and scientific name');
  }
});

test('fetchSpeciesById returns a detail shape or null', async () => {
  const all = await species.fetchSpecies();
  const detail = await species.fetchSpeciesById(all[0].id);
  assert.ok(detail);
  assert.equal(detail.id, all[0].id);
  assert.ok(Array.isArray(detail.photos));
  assert.equal(await species.fetchSpeciesById('missing-id'), null);
});

test('fetchRecords falls back to sample data with the usingSampleData flag', async () => {
  const result = await records.fetchRecords();
  assert.equal(result.error, null);
  assert.equal(result.usingSampleData, true);
  assert.ok(result.records.length > 0);
  for (const r of result.records) {
    assert.ok(['pending', 'approved', 'rejected'].includes(r.approvalStatus), 'approval status is a known state');
  }
});

test('fetchRecordById resolves sample rows and misses', async () => {
  const { records: rows } = await records.fetchRecords();
  const found = await records.fetchRecordById(rows[0].id);
  assert.ok(found);
  assert.equal(found.id, rows[0].id);
  assert.equal(await records.fetchRecordById('missing-id'), null);
});

test('fetchConflictReports is empty in sample mode', async () => {
  assert.deepEqual(await records.fetchConflictReports('any-id'), []);
});
