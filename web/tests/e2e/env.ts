import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Shared env loader for the e2e specs. Playwright's Node process does not
// load Next's env files, so the specs read them directly. Canonical location
// is web/.env (gitignored); the legacy name web/.env.local, which older
// instructions and checkouts may still use, is honoured when .env is absent.

const dir = path.resolve(__dirname, "../..");
const file = existsSync(path.join(dir, ".env")) ? ".env" : ".env.local";
const envFile = readFileSync(path.join(dir, file), "utf8");

export function envValue(key: string): string {
  return envFile.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1].trim() ?? "";
}

export const SUPABASE_URL = envValue("NEXT_PUBLIC_SUPABASE_URL");
export const ANON_KEY = envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
export const TEST_PASSWORD = envValue("E2E_TEST_PASSWORD");
