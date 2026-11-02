// tsx transpiles TypeScript to CommonJS, so require() calls inside app code
// bypass the ESM resolve hooks entirely. This hook answers the next/*
// subpath requires with test stubs, mirroring alias-resolve.mjs on the ESM
// side. Without it, real next/link throws "app router not mounted".
const Module = require('node:module');

const STUBS = {
  'next/link': require.resolve('./next-link.cjs'),
  'next/navigation': require.resolve('./next-navigation.cjs'),
  'next/cache': require.resolve('./next-cache.cjs'),
  'next/headers': require.resolve('./next-headers.cjs'),
};

const original = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (STUBS[request]) return STUBS[request];
  return original.call(this, request, ...rest);
};
