export const USER_ROLES = [
  "visitor",
  "botanist",
  "conservation_officer",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const MANAGED_ROLES = USER_ROLES;

export type ManagedRole = UserRole;

export const STAFF_ROLES = [
  "botanist",
  "conservation_officer",
  "admin",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  visitor: "Visitor",
  botanist: "Botanist",
  conservation_officer: "Conservation Officer",
  admin: "Admin",
};
