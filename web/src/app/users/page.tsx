import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { UserRoleSelect } from "@/components/user-role-select";
import type { ManagedRole } from "./actions";

export default async function UsersPage() {
  if ((await getCurrentRole()) !== "admin") redirect("/records");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("user_id, name, email, role")
    .order("email", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
          Users
        </h1>
        <p className="mt-2 text-moss">
          Everyone who has registered. New accounts start as botanists — grant
          officer or admin access from here.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load users: {error.message}
        </div>
      )}

      {!error && (!profiles || profiles.length === 0) && (
        <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm text-moss">No registered users yet.</p>
        </div>
      )}

      {profiles && profiles.length > 0 && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-pine/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-moss">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.user_id}
                  className="border-t border-pine/10 text-pine"
                >
                  <td className="px-4 py-3 font-medium">{profile.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-moss">
                    {profile.email}
                    {profile.user_id === user?.id && (
                      <span className="ml-2 rounded-full bg-sprout px-2 py-0.5 text-xs font-semibold text-emerald">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <UserRoleSelect
                      userId={profile.user_id}
                      role={profile.role as ManagedRole}
                      isSelf={profile.user_id === user?.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-moss">
        Roles are enforced by row-level security in the database — officers can
        approve records, admins can also manage users. You cannot demote
        yourself.
      </p>
    </div>
  );
}
