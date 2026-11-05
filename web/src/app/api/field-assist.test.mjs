import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';

const owner = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const reviewer = '10000000-0000-0000-0000-000000000003';
const record = '20000000-0000-0000-0000-000000000001';
const photoId = '30000000-0000-0000-0000-000000000001';
let attempts = []; let decisions = []; let providerCalls = 0; let pixels = 1;
let sourceOverride = null;
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const url = new URL(req.url, 'http://localhost');
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length && req.headers['content-type']?.includes('application/json') ? JSON.parse(Buffer.concat(chunks).toString()) : {};
  const send = (value, status = 200) => { res.statusCode = status; res.end(JSON.stringify(value)); };
  if (url.pathname === '/auth/v1/user') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!['owner','other','reviewer'].includes(token)) return send({ message: 'invalid token' }, 401);
    return send({ id: token === 'owner' ? owner : token === 'other' ? other : reviewer, aud: 'authenticated', role: 'authenticated', email: 'test@example.invalid' });
  }
  const table = url.pathname.split('/').pop();
  if (table === 'user_profiles') return send([{ role: url.searchParams.get('user_id')?.includes(reviewer) ? 'conservation_officer' : 'botanist' }]);
  if (table === 'plant_records') return send([{ record_id: record, botanist_id: owner, version: 1, gps_lat: 0, gps_lng: 0, gps_accuracy_m: 7, morphology: 'Observed leaves', notes: null, species_id: null, provisional_name: null }]);
  if (table === 'plant_record_photos') return send([{ photo_id: photoId, photo_url: sourceOverride ?? `${origin}/storage/v1/object/public/record-photos/${owner}/${record}/p.jpg`, taken_at: '2026-01-01T00:00:00Z' }]);
  if (url.pathname.startsWith('/storage/v1/object/authenticated/')) { res.setHeader('Content-Type', 'image/jpeg'); return res.end(Buffer.from([255,216,255,pixels])); }
  if (url.pathname.startsWith('/storage/v1/object/ai-evidence/')) return send({ Key: url.pathname, Id: 'archive-fixture' });
  if (url.pathname === '/storage/v1/object/sign/ai-evidence') return send(body.paths.map(path => ({ path, signedURL: `/object/sign/ai-evidence/${path}?token=fixture` })));
  if (table === 'species') return send([{ species_id: '40000000-0000-0000-0000-000000000001', scientific_name: 'Test plant' }]);
  if (['ai_species_aliases','ai_species_guidance'].includes(table)) return send([]);
  if (table === 'ai_identification_attempts') {
    if (req.method === 'PATCH') { Object.assign(attempts.find(a => `eq.${a.attempt_id}` === url.searchParams.get('attempt_id')), body); return send(null); }
    return send(attempts);
  }
  if (table === 'ai_identification_decisions') return send(decisions);
  if (table === 'ai_reserve_attempt') {
    const existing = attempts.find(a => a.fingerprint === body.p_fingerprint && a.status !== 'failed');
    if (existing) return send({ created: false, attempt: existing });
    const attempt = { attempt_id: '50000000-0000-0000-0000-000000000001', record_id: record, requested_by: owner,
      provider: body.p_provider, record_version: body.p_version, fingerprint: body.p_fingerprint,
      photos: body.p_photos, evidence: body.p_evidence, status: 'processing', candidates: [], created_at: new Date().toISOString() };
    attempts.push(attempt); return send({ created: true, attempt });
  }
  if (table === 'ai_record_decision') { decisions.push(body); return send('60000000-0000-0000-0000-000000000001'); }
  return send({ error: `Unhandled fixture ${url.pathname}` }, 500);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
process.env.NEXT_PUBLIC_SUPABASE_URL = origin;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-service';
process.env.AI_PROVIDER = 'plantnet';
process.env.PLANTNET_API_KEY = 'fixture-provider';
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (String(input).startsWith('https://my-api.plantnet.org/')) {
    providerCalls++;
    return Response.json({ version: 'fixture', results: [{ score: .8, species: { scientificNameWithoutAuthor: 'Test plant', commonNames: [] } }] });
  }
  return originalFetch(input, init);
};
const route = await import('./field-assist/[id]/route.ts');
const ctx = { params: Promise.resolve({ id: record }) };
const request = (method, token = 'owner', body) => new Request(`${origin}/api/field-assist/${record}`, {
  method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
});
test.beforeEach(() => { attempts = []; decisions = []; providerCalls = 0; pixels = 1; sourceOverride = null; });
test.after(() => { globalThis.fetch = originalFetch; server.close(); });

test('unauthenticated and unrelated users cannot read or initiate AI', async () => {
  assert.equal((await route.GET(request('GET','invalid'),ctx)).status, 401);
  assert.equal((await route.POST(request('POST','other'),ctx)).status, 404);
  assert.equal(providerCalls, 0);
});
test('reviewers can read evidence but cannot spend identification quota for another owner', async () => {
  assert.equal((await route.GET(request('GET','reviewer'),ctx)).status, 200);
  assert.equal((await route.POST(request('POST','reviewer'),ctx)).status, 403);
  assert.equal(providerCalls, 0);
});
test('repeated owner requests reuse the stored result and map exact catalogue names', async () => {
  assert.equal((await route.POST(request('POST'),ctx)).status, 200);
  assert.equal((await route.POST(request('POST'),ctx)).status, 200);
  assert.equal(providerCalls, 1);
  assert.equal(attempts[0].status, 'succeeded');
  assert.equal(attempts[0].candidates[0].mapping, 'exact-name');
  const result = await (await route.GET(request('GET'),ctx)).json();
  assert.equal(result.attempts[0].stale, false);
});
test('same-path photo replacement is detected and blocks a stale decision', async () => {
  await route.POST(request('POST'),ctx);
  pixels = 2;
  const result = await (await route.GET(request('GET'),ctx)).json();
  assert.equal(result.attempts[0].stale, true);
  const response = await route.PATCH(request('PATCH','owner',{ attemptId: attempts[0].attempt_id, role: 'collector', outcome: 'selected', candidateIndex: 0 }),ctx);
  assert.equal(response.status,409); assert.equal(decisions.length,0);
});
test('decision roles are enforced and fresh collector decisions are stored separately', async () => {
  await route.POST(request('POST'),ctx);
  const body = { attemptId: attempts[0].attempt_id, role: 'officer', outcome: 'selected', candidateIndex: 0 };
  assert.equal((await route.PATCH(request('PATCH','owner',body),ctx)).status,403);
  assert.equal((await route.PATCH(request('PATCH','owner',{ ...body, role: 'collector' }),ctx)).status,200);
  assert.equal(decisions[0].p_name,'Test plant');
  assert.equal(decisions[0].p_actor,owner);
});
test('a stored arbitrary photo URL cannot turn identification into an external fetch', async () => {
  sourceOverride = 'https://attacker.invalid/private';
  assert.equal((await route.POST(request('POST'),ctx)).status,400);
  assert.equal(providerCalls,0);
});
test('cookie mutation without same-origin evidence is rejected before accessing data', async () => {
  const req = new Request(`${origin}/api/field-assist/${record}`, { method: 'POST', headers: { Origin: 'https://attacker.invalid' } });
  assert.equal((await route.POST(req,ctx)).status,403);
});
