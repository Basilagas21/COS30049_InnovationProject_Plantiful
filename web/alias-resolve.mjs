// Resolve hook mapping the "@/..." path alias (web/tsconfig.json) to "src/..."
// so the plain Node test runner can import app modules without a bundler.
// Node requires explicit file extensions, so a .ts suffix is appended when
// the bare target does not exist.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = import.meta.dirname;

export async function resolve(specifier, context, next) {
  if (specifier === 'next/headers') {
    return next(pathToFileURL(path.join(root, 'test-stubs', 'next-headers.mjs')).href, context);
  }
  if (specifier.startsWith('@/')) {
    let target = path.join(root, 'src', specifier.slice(2));
    if (!existsSync(target) && existsSync(`${target}.ts`)) target = `${target}.ts`;
    return next(pathToFileURL(target).href, context);
  }
  return next(specifier, context);
}
