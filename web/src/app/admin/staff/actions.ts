"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole } from "@/lib/auth";
import { MANAGED_ROLES, type ManagedRole } from "@/app/users/roles";

type ActionResult = { ok: boolean; error?: string };

function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function normalizeRole(value: string): ManagedRole | null {
  return MANAGED_ROLES.includes(value as ManagedRole)
    ? (value as ManagedRole)
    : null;
}

async function getAdminContext() {
  const role = await getCurrentRole();
  if (role !== "admin") return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return { supabase, user };
}

function revalidateStaffPaths() {
  revalidatePath("/admin/staff");
  revalidatePath("/users");
}

export async function saveStaffAllowlistEntry(
  emailInput: string,
  roleInput: string,
): Promise<ActionResult> {
  const context = await getAdminContext();
  if (!context) return { ok: false, error: "Admin access required." };

  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, error: "Enter a valid email address." };

  const role = normalizeRole(roleInput);
  if (!role) return { ok: false, error: "Choose a valid role." };

  if (context.user.email?.toLowerCase() === email) {
    return {
      ok: false,
      error: "You cannot change your own role through the allowlist.",
    };
  }

  const { data, error } = await context.supabase
    .from("staff_allowlist")
    .upsert({ email, role, added_by: context.user.id }, { onConflict: "email" })
    .select("email");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "The allowlist entry was not saved." };
  }

  revalidateStaffPaths();
  return { ok: true };
}

export async function setStaffAllowlistRole(
  emailInput: string,
  roleInput: string,
): Promise<ActionResult> {
  const context = await getAdminContext();
  if (!context) return { ok: false, error: "Admin access required." };

  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, error: "Invalid allowlist email." };

  const role = normalizeRole(roleInput);
  if (!role) return { ok: false, error: "Choose a valid role." };

  if (context.user.email?.toLowerCase() === email) {
    return {
      ok: false,
      error: "You cannot change your own role through the allowlist.",
    };
  }

  const { data, error } = await context.supabase
    .from("staff_allowlist")
    .update({ role })
    .eq("email", email)
    .select("email");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Allowlist entry not found or not permitted." };
  }

  revalidateStaffPaths();
  return { ok: true };
}

export async function removeStaffAllowlistEntry(
  emailInput: string,
): Promise<ActionResult> {
  const context = await getAdminContext();
  if (!context) return { ok: false, error: "Admin access required." };

  const email = normalizeEmail(emailInput);
  if (!email) return { ok: false, error: "Invalid allowlist email." };

  if (context.user.email?.toLowerCase() === email) {
    return {
      ok: false,
      error: "You cannot change your own role through the allowlist.",
    };
  }

  const { data, error } = await context.supabase
    .from("staff_allowlist")
    .delete()
    .eq("email", email)
    .select("email");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Allowlist entry not found or not permitted." };
  }

  revalidateStaffPaths();
  return { ok: true };
}
