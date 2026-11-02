// Node test hook: register the "@/..." alias resolver before tests run.
import { register } from 'node:module';

register('./alias-resolve.mjs', import.meta.url);
