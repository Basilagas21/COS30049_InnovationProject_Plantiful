// Test-only stand-in for next/headers. The unconfigured fallback path never
// calls cookies(); importing the module graph is all that is required.
export async function cookies() {
  throw new Error('cookies() is not available in unit tests');
}
