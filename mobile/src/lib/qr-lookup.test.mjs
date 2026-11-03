import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupRecord, withLookupTimeout } from './qr-lookup.ts';
import { isValidTag, normalizeTag } from './tags.ts';

test('cached tag opens without a network call', async () => {
  const result = await lookupRecord(async () => 'local-1', async () => { throw new Error('offline'); });
  assert.equal(result.recordId, 'local-1');
  assert.equal(result.outcome, 'local_found');
});
test('local miss can resolve to an accessible remote record', async () => {
  const result = await lookupRecord(async () => null, async () => ({ recordId: 'remote-1', message: 'Found' }));
  assert.equal(result.recordId, 'remote-1');
  assert.equal(result.outcome, 'remote_found');
});
test('unavailable and inaccessible tags stay unresolved, never new records', async () => {
  for (const message of ['Offline', 'Signed out', 'No accessible record']) {
    const result = await lookupRecord(async () => null, async () => ({ recordId: null, message }));
    assert.equal(result.outcome, 'unresolved');
    assert.equal(result.recordId, null);
    assert.equal(result.message, message);
  }
});
test('local storage failure does not fall through to creating or importing a record', async () => {
  let remoteCalled = false;
  await assert.rejects(lookupRecord(async () => { throw new Error('SQLite failure'); }, async () => {
    remoteCalled = true;
    return { recordId: 'remote', message: 'Found' };
  }));
  assert.equal(remoteCalled, false);
});
test('stalled lookup times out and successful lookup retains its result', async () => {
  assert.equal(await withLookupTimeout(new Promise(() => {}), 5), null);
  assert.deepEqual(await withLookupTimeout(Promise.resolve({ id: 'record' }), 50), { id: 'record' });
});
test('tag validation rejects websites and accepts existing short tag format', () => {
  assert.equal(isValidTag(normalizeTag('https://example.com')), false);
  assert.equal(isValidTag(normalizeTag(' plt-7f3k92 ')), true);
  assert.equal(isValidTag('A'), false);
});
