export type LookupResult = { recordId: string | null; message: string };

// A failed lookup is unresolved, never proof that a physical plant/tag is new.
export async function lookupRecord(
  local: () => Promise<string | null>,
  remote: () => Promise<LookupResult>,
): Promise<LookupResult & { outcome: string }> {
  const recordId = await local();
  if (recordId) return { recordId, message: 'Record saved on this device.', outcome: 'local_found' };
  const result = await remote();
  return { ...result, outcome: result.recordId ? 'remote_found' : 'unresolved' };
}

export async function withLookupTimeout<T>(request: PromiseLike<T>, milliseconds = 4000): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), milliseconds); })]);
  } finally {
    clearTimeout(timer);
  }
}
