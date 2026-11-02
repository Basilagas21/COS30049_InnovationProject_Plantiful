import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';

// Live-query branch tests: a local PostgREST-shaped stub server stands in for
// Supabase so the real client code paths in records.ts and species.ts run in
// unit tests without touching the deployed project. The env must be set
// before the data-layer modules are imported, hence the dedicated file.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:4599';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

const speciesRow = {
  species_id: 'aaaaaaaa-0000-0000-0000-000000000001',
  scientific_name: 'Stubus testus',
  common_name: 'Stub test',
  taxonomy: 'Stubaceae',
  conservation_status: 'endangered',
  description: 'A stub species.',
  ecology: null,
  cultural_significance: null,
  is_published: true,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};

const recordRow = {
  record_id: 'bbbbbbbb-0000-0000-0000-000000000001',
  qr_code: 'PLT-STUB01',
  provisional_name: 'Stub record',
  gps_lat: null,
  gps_lng: null,
  gps_accuracy_m: null,
  height_cm: 120,
  dbh_cm: null,
  taxonomy: null,
  phenology: null,
  morphology: null,
  notes: null,
  approval_status: 'pending',
  status: 'submitted',
  created_at: '2026-11-01T00:00:00Z',
  reviewed_at: null,
  synced_at: null,
  device_id: 'dev-stub',
  rejection_reason: null,
  species: speciesRow,
  plant_record_photos: [{ photo_url: 'https://example.invalid/p.jpg' }],
};

let failNext = false;
let failSpeciesPhotos = false;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:4599');
  res.setHeader('content-type', 'application/json');
  if (failNext) {
    res.statusCode = 400;
    res.end(JSON.stringify({ message: 'stub failure' }));
    return;
  }
  if (url.pathname === '/rest/v1/species') {
    // PostgREST embeds the requested species_photos relation as an array.
    res.end(JSON.stringify([{ ...speciesRow, species_photos: [{ photo_url: 'https://example.invalid/s1.jpg' }] }]));
  } else if (url.pathname === '/rest/v1/species_photos') {
    if (failSpeciesPhotos) {
      res.statusCode = 400;
      res.end(JSON.stringify({ message: 'photos unavailable' }));
      return;
    }
    res.end(JSON.stringify([
      { photo_id: 'p1', photo_url: 'https://example.invalid/s1.jpg', uploaded_at: '2026-11-01T00:00:00Z' },
    ]));
  } else if (url.pathname === '/rest/v1/plant_records') {
    res.end(JSON.stringify([recordRow]));
  } else if (url.pathname === '/rest/v1/sync_conflicts') {
    res.end(JSON.stringify([
      { conflict_id: 'c1', message: 'stub conflict', created_at: '2026-11-01T00:00:00Z' },
    ]));
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'not found' }));
  }
});

await new Promise((resolve) => server.listen(4599, '127.0.0.1', resolve));

const species = await import('@/lib/species');
const records = await import('@/lib/records');

test('fetchSpecies maps live rows through the real client path', async () => {
  const list = await species.fetchSpecies();
  assert.equal(list.length, 1);
  assert.equal(list[0].scientificName, 'Stubus testus');
  assert.equal(list[0].photoCount, 1);
});

test('fetchSpeciesById merges live photos', async () => {
  const detail = await species.fetchSpeciesById(speciesRow.species_id);
  assert.ok(detail);
  assert.equal(detail.photos.length, 1);
  assert.equal(detail.photoUrl, 'https://example.invalid/s1.jpg');
});

test('fetchSpecies falls back to sample data when the backend errors', async () => {
  failNext = true;
  const list = await species.fetchSpecies({ publishedOnly: true });
  assert.ok(list.length > 0, 'sample rows returned');
  failNext = false;
});

test('fetchRecords maps live rows and reports no error', async () => {
  const result = await records.fetchRecords();
  assert.equal(result.error, null);
  assert.equal(result.usingSampleData, false);
  assert.equal(result.records[0].qrCode, 'PLT-STUB01');
});

test('fetchRecords surfaces a backend error', async () => {
  failNext = true;
  const result = await records.fetchRecords();
  assert.ok(result.error, 'error message present');
  assert.equal(result.records.length, 0);
  failNext = false;
});

test('fetchRecordById returns a mapped live row', async () => {
  const row = await records.fetchRecordById(recordRow.record_id);
  assert.ok(row);
  assert.equal(row.id, recordRow.record_id);
});

test('fetchRecordById throws on backend error', async () => {
  failNext = true;
  await assert.rejects(() => records.fetchRecordById(recordRow.record_id), /Could not load record/);
  failNext = false;
});

test('fetchConflictReports maps live reports', async () => {
  const reports = await records.fetchConflictReports(recordRow.record_id);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].message, 'stub conflict');
});

test('fetchConflictReports returns empty on backend error', async () => {
  failNext = true;
  assert.deepEqual(await records.fetchConflictReports('any'), []);
  failNext = false;
});

test('fetchSpeciesById falls back to sample data when the species query fails', async () => {
  const mockId = 'SP-0001';
  failNext = true;
  const found = await species.fetchSpeciesById(mockId);
  assert.ok(found, 'sample row returned for a known mock id');
  const missing = await species.fetchSpeciesById(speciesRow.species_id);
  assert.equal(missing, null, 'unknown id still resolves to null after failure');
  failNext = false;
});

test('fetchSpeciesById tolerates a photos lookup failure', async () => {
  failSpeciesPhotos = true;
  const detail = await species.fetchSpeciesById(speciesRow.species_id);
  failSpeciesPhotos = false;
  assert.ok(detail);
  assert.deepEqual(detail.photos, []);
  assert.equal(detail.photoUrl, null);
  assert.equal(detail.photoCount, 0);
});

test.after(() => server.close());
