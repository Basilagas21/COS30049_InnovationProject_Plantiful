// Test-only stand-in for next/headers: an in-memory cookie store so the
// server client can be constructed in unit tests. The data-layer tests never
// authenticate, the store simply satisfies the createServerClient contract.
const store = new Map();

export async function cookies() {
  return {
    getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
    get: (name) => (store.has(name) ? { name, value: store.get(name) } : undefined),
    set: (name, value) => {
      store.set(name, value);
    },
    delete: (name) => {
      store.delete(name);
    },
  };
}
