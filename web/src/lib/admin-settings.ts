import { cookies } from "next/headers";
import {
  USERS_PAGE_SIZE_COOKIE,
  normalizeUsersPageSize,
} from "@/lib/user-directory";

export async function getUsersPageSize() {
  const cookieStore = await cookies();
  return normalizeUsersPageSize(cookieStore.get(USERS_PAGE_SIZE_COOKIE)?.value);
}
