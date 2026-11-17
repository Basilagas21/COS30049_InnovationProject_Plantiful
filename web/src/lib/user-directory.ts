export const USERS_PAGE_SIZES = [10, 25, 50, 100] as const;

export type UsersPageSize = (typeof USERS_PAGE_SIZES)[number];

export const DEFAULT_USERS_PAGE_SIZE: UsersPageSize = 25;

export const USERS_PAGE_SIZE_COOKIE = "plantiful.admin.users.pageSize";

export function normalizeUsersPageSize(value: unknown): UsersPageSize {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  return USERS_PAGE_SIZES.includes(parsed as UsersPageSize)
    ? (parsed as UsersPageSize)
    : DEFAULT_USERS_PAGE_SIZE;
}

export function sanitizeUserSearch(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9@._\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
