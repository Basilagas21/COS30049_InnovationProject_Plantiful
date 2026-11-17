"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { MANAGED_ROLES, type ManagedRole } from "./roles";

export async function updateUserName(
  userId: string,
  name: string,
): Promise<{ ok: boolean; error?: string; name?: string }> {
  const callerRole = await getCurrentRole();
  if (callerRole !== "admin") {
    return { ok: false, error: "Admin access required." };
  }

  const nextName = name.trim().replace(/\s+/g, " ");
  if (nextName.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters." };
  }
  if (nextName.length > 80) {
    return { ok: false, error: "Name must be 80 characters or fewer." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ name: nextName })
    .eq("user_id", userId)
    .select("user_id");

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "User not found or you don't have permission to edit this profile.",
    };
  }

  revalidatePath("/users");
  return { ok: true, name: nextName };
}

export async function setUserRole(
  userId: string,
  role: string,
): Promise<{ ok: boolean; error?: string }> {
  const callerRole = await getCurrentRole();
  if (callerRole !== "admin") {
    return { ok: false, error: "Admin access required." };
  }
  if (!MANAGED_ROLES.includes(role as ManagedRole)) {
    return { ok: false, error: "Unknown role." };
  }
  const nextRole = role as ManagedRole;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === userId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({ role: nextRole })
    .eq("user_id", userId)
    .select("user_id");

  if (error) {
    return { ok: false, error: error.message };
  }
  // RLS filters rows silently, so an update it blocks returns no error and no rows.
  if (!data || data.length === 0) {
    return {
      ok: false,
      error: "User not found or you don't have permission to change roles.",
    };
  }

  revalidatePath("/users");
  return { ok: true };
}
