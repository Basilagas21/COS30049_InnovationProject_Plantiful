export const MANAGED_ROLES = [
  "botanist",
  "conservation_officer",
  "admin",
] as const;

export type ManagedRole = (typeof MANAGED_ROLES)[number];

export const ROLE_LABELS: Record<ManagedRole, string> = {
  botanist: "Botanist",
  conservation_officer: "Conservation Officer",
  admin: "Admin",
};
