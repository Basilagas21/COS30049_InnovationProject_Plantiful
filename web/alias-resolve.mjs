// Resolve hook mapping the "@/..." path alias (web/tsconfig.json) to "src/..."
// so the plain Node test runner can import app modules without a bundler.
// Node requires explicit file extensions, so a .ts suffix is appended when
// the bare target does not exist. Next's subpath exports (next/server,
// next/headers) are plain files that Node cannot resolve without the package
// exports map, so they are mapped to their on-disk paths.
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = import.meta.dirname;
const require = createRequire(import.meta.url);

const NEXT_SUBPATHS = {
  'next/headers': path.join(root, 'test-stubs', 'next-headers.mjs'),
  'next/server': require.resolve('next/server.js'),
};

export async function resolve(specifier, context, next) {
  if (specifier in NEXT_SUBPATHS) {
    return next(pathToFileURL(NEXT_SUBPATHS[specifier]).href, context);
  }
  if (specifier.startsWith('@/')) {
    let target = path.join(root, 'src', specifier.slice(2));
    if (!existsSync(target)) {
      for (const ext of ['.ts', '.tsx']) {
        if (existsSync(`${target}${ext}`)) {
          target = `${target}${ext}`;
          break;
        }
      }
    }
    return next(pathToFileURL(target).href, context);
  }
  return next(specifier, context);
}
