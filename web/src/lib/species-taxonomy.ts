export const THREATENED_STATUSES = new Set([
  "vulnerable",
  "endangered",
  "critically endangered",
]);

export function isThreatenedStatus(status: string | null): boolean {
  return status ? THREATENED_STATUSES.has(status.trim().toLowerCase()) : false;
}

export function familyFromTaxonomy(taxonomy: string | null): string | null {
  if (!taxonomy) return null;

  const parts = taxonomy
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts[parts.length - 1] : null;
}
