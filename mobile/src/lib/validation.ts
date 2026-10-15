// Parses the height field. Returns null for an empty field, undefined when the
// input isn't a positive number (so the caller can show an error).
export function parseHeightCm(input: string): number | null | undefined {
  const text = input.trim().replace(',', '.');
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

// Stem diameter at breast height. Same positive-number rules as height, kept as
// its own name so validation messages can name the right field.
export function parseDbhCm(input: string): number | null | undefined {
  return parseHeightCm(input);
}
