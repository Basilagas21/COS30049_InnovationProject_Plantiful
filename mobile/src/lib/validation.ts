// Parses the height field. Returns null for an empty field, undefined when the
// input isn't a positive number (so the caller can show an error).
export function parseHeightCm(input: string): number | null | undefined {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}
