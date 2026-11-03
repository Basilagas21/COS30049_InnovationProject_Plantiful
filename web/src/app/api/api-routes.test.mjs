import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';

// Route-level tests for the web API surface. A local stub stands in for the
// Supabase backend; with no session cookie the auth helper resolves to null,
// so the officer gate is exercised for real.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:4598';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  res.statusCode = 401;
  res.end(JSON.stringify({ message: 'no session in tests' }));
});
await new Promise((resolve) => server.listen(4598, '127.0.0.1', resolve));

const telemetry = await import('@/app/api/telemetry/route');
const interactionLog = await import('@/app/api/interaction-log/route');

test('telemetry route rejects anonymous callers with 403', async () => {
  const response = await telemetry.GET(new Request('http://127.0.0.1:4598/api/telemetry?range=1d'));
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.match(body.error, /sign in as an officer/i);
});

test('interaction-log route accepts a target payload', async () => {
  const response = await interactionLog.POST(
    new Request('http://127.0.0.1:4598/api/interaction-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target: 'records.tab' }),
    })
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test('interaction-log route tolerates a malformed payload', async () => {
  const response = await interactionLog.POST(
    new Request('http://127.0.0.1:4598/api/interaction-log', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    })
  );
  assert.equal(response.status, 200);
});

test.after(() => server.close());
