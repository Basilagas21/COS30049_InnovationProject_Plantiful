export const MANAGED_ROLES = [
  "botanist",
  "conservation_officer",
  "admin",
] as const;

export type ManagedRole = (typeof MANAGED_ROLES)[number];
