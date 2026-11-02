// Node test hook chain. Registration order matters: the last-registered
// resolve hook runs first, so alias-resolve (which maps "@/..." to src/...
// and stubs next subpath imports) is registered last and intercepts those
// specifiers before tsx's resolver sees them; everything that falls through
// reaches tsx, which transpiles TypeScript and TSX on the fly, and then the
// default resolver.
import { register } from 'node:module';
import './test-stubs/cjs-hook.cjs';

register('./alias-resolve.mjs', import.meta.url);
