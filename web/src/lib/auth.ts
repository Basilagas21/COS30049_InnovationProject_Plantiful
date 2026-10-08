import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type UserRole = "botanist" | "conservation_officer" | "admin";

export async function getCurrentRole(): Promise<UserRole | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return (data?.role as UserRole | undefined) ?? null;
}

export async function isOfficer(): Promise<boolean> {
  const role = await getCurrentRole();
  return role === "conservation_officer" || role === "admin";
}

export async function isAdmin(): Promise<boolean> {
  return (await getCurrentRole()) === "admin";
}