const store = new Map();

async function cookies() {
  return {
    getAll: () => [...store.entries()].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => store.set(name, value)),
    get: (name) => (store.has(name) ? { name, value: store.get(name) } : undefined),
    set: (name, value) => { store.set(name, value); },
    delete: (name) => { store.delete(name); },
  };
}

module.exports = { cookies };
