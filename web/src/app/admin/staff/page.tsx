import Link from "next/link";
import { redirect } from "next/navigation";
import { Arrow } from "@/components/arrow";
import { StaffAllowlistManager } from "@/components/staff-allowlist-manager";
import { getCurrentRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/app/users/roles";

export default async function StaffAllowlistPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "admin") redirect("/records");

  const supabase = await createClient();
  const [{ data: userData }, { data, error }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("staff_allowlist")
      .select("email, role, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const entries = (data ?? []).map((entry) => ({
    email: entry.email,
    role: entry.role as StaffRole,
    createdAt: entry.created_at,
  }));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link
        href="/users"
        className="inline-flex min-h-11 items-center text-sm font-medium text-emerald hover:underline sm:min-h-0"
      >
        <Arrow direction="left" size="1em" /> Back to users
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Staff allowlist
          </h1>
          <p className="mt-2 max-w-2xl text-moss">
            Give an email address its role once. New signups receive that role
            automatically, and existing accounts are updated when an entry
            changes. Emails not on this list remain visitors.
          </p>
        </div>
        <Link href="/admin/settings" className="btn btn--ghost h-11">
          Admin settings
        </Link>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          <p className="font-semibold">Could not load the allowlist: {error.message}</p>
          {/schema cache|staff_allowlist|relation/i.test(error.message) && (
            <div className="mt-3 rounded-xl bg-sand/70 px-4 py-3 text-xs leading-5 text-moss">
              <p className="font-semibold text-pine">Migration required</p>
              <p className="mt-1">
                Open Supabase SQL Editor and run{" "}
                <code>backend/supabase/migrations/015_staff_allowlist.sql</code>
                {" and then "}
                <code>backend/supabase/migrations/016_visitor_role.sql</code>,
                then refresh this page. The table exists in the repository but
                has not been applied to this Supabase project yet.
              </p>
            </div>
          )}
        </div>
      )}

      <StaffAllowlistManager
        entries={entries}
        currentEmail={userData.user?.email ?? null}
      />

      <div className="mt-6 rounded-2xl border border-pine/10 bg-sprout/60 p-5 text-sm leading-6 text-moss">
        <p className="font-semibold text-pine">How it behaves</p>
        <p className="mt-1">
          Adding an entry updates that account immediately. Changing the role
          updates it immediately. Removing the entry returns an existing account
to visitor. The email must match exactly, ignoring letter case. 
        </p>
      </div>
    </div>
  );
}
