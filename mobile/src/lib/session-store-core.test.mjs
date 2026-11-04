import assert from 'node:assert/strict';
import test from 'node:test';
import { createChunkedStorage, shortKey, splitChunks } from './session-store-core.ts';

// A backend that enforces the Android SecureStore constraints: keys up to 31
// characters of [\w.-], values up to 2048 bytes. A chunking bug that would
// crash the first real-device login fails here instead.
function androidLikeBackend() {
  const data = new Map();
  const enforce = (key, value) => {
    if (!/^[\w.-]{1,31}$/.test(key)) throw new Error(`key violates device limit: ${key}`);
    if (value !== undefined && new TextEncoder().encode(value).length > 2048) {
      throw new Error(`value violates 2048-byte device limit (${value.length} chars)`);
    }
  };
  return {
    data,
    async get(key) {
      enforce(key);
      return data.has(key) ? data.get(key) : null;
    },
    async set(key, value) {
      enforce(key, value);
      data.set(key, value);
    },
    async del(key) {
      data.delete(key);
    },
  };
}

const REAL_KEY = 'sb-vmiytfciwvinulupobkm-auth-token'; // 34 chars, over the 31 limit
const SESSION = JSON.stringify({
  access_token: 'x'.repeat(950),
  refresh_token: 'r'.repeat(50),
  user: { metadata: 'm'.repeat(1100) },
  token_type: 'bearer',
  expires_in: 3600,
}); // ~2.2 KB, like the live measurement

function legacyStore(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    map,
    read: async (k) => (map.has(k) ? map.get(k) : null),
    drop: async (k) => {
      map.delete(k);
    },
  };
}

test('the measured live session size round-trips through the chunker', async () => {
  assert.ok(new TextEncoder().encode(SESSION).length > 2048, 'fixture must exceed the device limit');
  const store = createChunkedStorage(androidLikeBackend(), {});
  await store.setItem(REAL_KEY, SESSION);
  assert.equal(await store.getItem(REAL_KEY), SESSION);
});

test('small values round-trip and the real supabase key never reaches the backend raw', async () => {
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, {});
  await store.setItem(REAL_KEY, 'tiny');
  assert.equal(await store.getItem(REAL_KEY), 'tiny');
  for (const key of backend.data.keys()) {
    assert.ok(key.length <= 31, `backend key too long for the device: ${key}`);
  }
});

test('empty storage reads null with no migration source', async () => {
  const store = createChunkedStorage(androidLikeBackend(), {});
  assert.equal(await store.getItem(REAL_KEY), null);
});

test('legacy session migrates on first read and is dropped from the old store', async () => {
  const legacy = legacyStore({ [REAL_KEY]: SESSION });
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, { migration: legacy });
  assert.equal(await store.getItem(REAL_KEY), SESSION); // served from legacy
  assert.equal(legacy.map.has(REAL_KEY), false); // cleared after promotion
  assert.ok(backend.data.size > 0); // and now lives in secure chunks
  assert.equal(await store.getItem(REAL_KEY), SESSION); // served from secure store
});

test('sign-out removes every chunk and the meta', async () => {
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, {});
  await store.setItem(REAL_KEY, SESSION);
  await store.removeItem(REAL_KEY);
  assert.equal(backend.data.size, 0, 'no residue behind after removeItem');
  assert.equal(await store.getItem(REAL_KEY), null);
});

test('rewrite with a shorter value removes the old extra chunks', async () => {
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, { maxChunkBytes: 100 });
  const long = 'a'.repeat(550); // 6 chunks
  await store.setItem('k', long);
  const before = [...backend.data.keys()].filter((k) => k.startsWith(shortKey('k', 'c'))).length;
  await store.setItem('k', 'a'.repeat(50)); // 1 chunk now
  const after = [...backend.data.keys()].filter((k) => k.startsWith(shortKey('k', 'c'))).length;
  assert.equal(before, 6);
  assert.equal(after, 1, 'stale chunks from the longer value must be deleted');
  assert.equal(await store.getItem('k'), 'a'.repeat(50));
});

test('multibyte content respects byte limits and reassembles exactly', async () => {
  const legacy = legacyStore({
    'k': '🌱'.repeat(1200), // 4 bytes per char, 4800 bytes
  });
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, { migration: legacy });
  const value = await store.getItem('k');
  assert.equal(value, '🌱'.repeat(1200));
  for (const v of backend.data.values()) {
    assert.ok(new TextEncoder().encode(v).length <= 2048, 'every stored item within device limit');
  }
});

test('a torn write (meta without a chunk) reads null instead of corrupting', async () => {
  const backend = androidLikeBackend();
  const store = createChunkedStorage(backend, {});
  await store.setItem('k', 'some value');
  // Simulate a crash deleting one chunk while the meta survived.
  for (const key of [...backend.data.keys()]) {
    if (key.endsWith('.c0')) backend.data.delete(key);
  }
  assert.equal(await store.getItem('k'), null);
});

test('splitChunks never exceeds the byte budget and reassembles losslessly', () => {
  const value = 'ab'.repeat(5000) + 'éöü'.repeat(100);
  const chunks = splitChunks(value, 1500);
  assert.equal(chunks.join(''), value);
  for (const c of chunks) {
    assert.ok(new TextEncoder().encode(c).length <= 1500);
  }
});
