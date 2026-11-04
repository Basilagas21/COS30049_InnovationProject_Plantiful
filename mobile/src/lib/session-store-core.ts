// Pure chunked write-through storage, no React Native imports so the logic is
// unit-testable on desktop Node. Android SecureStore limits an item to 2048
// bytes and a key to 31 characters; a real Supabase session measured 2220
// bytes under a 34-character key, so naive swap would fail on every login on
// the physical device. Values split into byte-bounded chunks under opaque
// short keys, with one-time migration from a legacy store (AsyncStorage).

export type LimitBackend = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  del(key: string): Promise<void>;
};

export type MigrationSource = {
  read(key: string): Promise<string | null>;
  drop(key: string): Promise<void>;
};

export type ChunkedStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const DEFAULT_MAX_CHUNK_BYTES = 1500;

function byteLen(value: string): number {
  return new TextEncoder().encode(value).length;
}

// Stable djb2 mapping so every backend key fits the 31-character limit.
export function shortKey(key: string, part: string): string {
  let h = 5381;
  for (let i = 0; i < key.length; i += 1) {
    h = ((h * 33) ^ key.charCodeAt(i)) >>> 0;
  }
  return `pfs.${h.toString(36)}.${part}`;
}

export function splitChunks(value: string, maxChunkBytes: number): string[] {
  const chunks: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const char of value) {
    const charBytes = byteLen(char);
    if (currentBytes + charBytes > maxChunkBytes) {
      chunks.push(current);
      current = '';
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  chunks.push(current);
  return chunks;
}

type Meta = { k: string; n: number };

export function createChunkedStorage(
  backend: LimitBackend,
  options: { maxChunkBytes?: number; migration?: MigrationSource },
): ChunkedStorage {
  const max = options.maxChunkBytes ?? DEFAULT_MAX_CHUNK_BYTES;

  async function readMeta(key: string): Promise<Meta | null> {
    const raw = await backend.get(shortKey(key, 'm'));
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Meta;
      // A hash collision surfaces as a mismatched original key; treat as absent.
      return parsed && parsed.k === key ? parsed : null;
    } catch {
      return null;
    }
  }

  async function dropChunks(key: string, count: number): Promise<void> {
    for (let i = 0; i < count; i += 1) {
      await backend.del(shortKey(key, `c${i}`));
    }
  }

  async function setItem(key: string, value: string): Promise<void> {
    const chunks = splitChunks(value, max);
    const previous = await readMeta(key);
    if (previous) await dropChunks(key, previous.n);
    for (let i = 0; i < chunks.length; i += 1) {
      await backend.set(shortKey(key, `c${i}`), chunks[i]);
    }
    // Meta written last: a crash before it leaves the item unreadable, and
    // the migration path or a fresh sign-in recovers rather than a torn read.
    await backend.set(shortKey(key, 'm'), JSON.stringify({ k: key, n: chunks.length }));
  }

  // Free functions, not methods using `this`: the supabase client may hold
  // detached references (storage.getItem passed around), and a `this`-bound
  // implementation would then throw only on device, far from any test.
  async function getItem(key: string): Promise<string | null> {
    const meta = await readMeta(key);
    if (meta) {
      let value = '';
      for (let i = 0; i < meta.n; i += 1) {
        const chunk = await backend.get(shortKey(key, `c${i}`));
        if (chunk === null) return null; // torn write; treat as signed out
        value += chunk;
      }
      return value;
    }
    if (options.migration) {
      const legacy = await options.migration.read(key);
      if (legacy !== null) {
        await setItem(key, legacy);
        await options.migration.drop(key);
        return legacy;
      }
    }
    return null;
  }

  async function removeItem(key: string): Promise<void> {
    const meta = await readMeta(key);
    if (meta) {
      await dropChunks(key, meta.n);
      await backend.del(shortKey(key, 'm'));
    }
    if (options.migration) await options.migration.drop(key);
  }

  return { getItem, setItem, removeItem };
}
