"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentRole } from "@/lib/auth";
import {
  USERS_PAGE_SIZE_COOKIE,
  normalizeUsersPageSize,
} from "@/lib/user-directory";

export async function setUsersPageSize(formData: FormData) {
  const role = await getCurrentRole();
  if (role !== "admin") {
    throw new Error("Admin access required.");
  }

  const pageSize = normalizeUsersPageSize(formData.get("pageSize"));
  const cookieStore = await cookies();

  cookieStore.set(USERS_PAGE_SIZE_COOKIE, String(pageSize), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/users");
  revalidatePath("/admin/settings");
}
