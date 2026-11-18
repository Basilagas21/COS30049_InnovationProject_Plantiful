import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { getUsersPageSize } from "@/lib/admin-settings";
import { sanitizeUserSearch } from "@/lib/user-directory";
import { createClient } from "@/lib/supabase/server";
import { UserNameForm } from "@/components/user-name-form";
import { UserRoleSelect } from "@/components/user-role-select";
import { MANAGED_ROLES, type ManagedRole } from "./roles";

const SORT_OPTIONS = ["name", "email", "newest"] as const;
type UserSort = (typeof SORT_OPTIONS)[number];

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseRole(value: string | undefined): ManagedRole | "all" {
  return MANAGED_ROLES.includes(value as ManagedRole)
    ? (value as ManagedRole)
    : "all";
}

function parseSort(value: string | undefined): UserSort {
  return SORT_OPTIONS.includes(value as UserSort)
    ? (value as UserSort)
    : "name";
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildUsersHref({
  q,
  role,
  sort,
  page,
}: {
  q: string;
  role: ManagedRole | "all";
  sort: UserSort;
  page: number;
}): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (role !== "all") params.set("role", role);
  if (sort !== "name") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/users?${query}` : "/users";
}

function formatJoined(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "admin") redirect("/records");

  const params = await searchParams;
  const q = (firstValue(params.q) ?? "").trim().slice(0, 80);
  const searchTerm = sanitizeUserSearch(q);
  const roleFilter = parseRole(firstValue(params.role));
  const sort = parseSort(firstValue(params.sort));
  const requestedPage = parsePage(firstValue(params.page));
  const pageSize = await getUsersPageSize();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let countQuery = supabase
    .from("user_profiles")
    .select("user_id", { count: "exact", head: true });

  if (searchTerm) {
    countQuery = countQuery.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
    );
  }
  if (roleFilter !== "all") {
    countQuery = countQuery.eq("role", roleFilter);
  }

  const { count, error: countError } = await countQuery;
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("user_profiles")
    .select("user_id, name, email, role, created_at");

  if (searchTerm) {
    query = query.or(
      `name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
    );
  }
  if (roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }

  if (sort === "email") {
    query = query.order("email", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data: profiles, error } = await query.range(
    from,
    from + pageSize - 1,
  );

  const loadError = error?.message ?? countError?.message ?? null;
  const showingFrom = total === 0 ? 0 : from + 1;
  const showingTo = Math.min(from + pageSize, total);
  const filtersActive = Boolean(q) || roleFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Users
          </h1>
          <p className="mt-2 max-w-2xl text-moss">
            Search and filter registered accounts, edit display names and grant
            officer or admin access. New accounts start as botanists.
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="inline-flex h-11 items-center justify-center rounded-full border border-emerald px-5 text-sm font-semibold text-emerald transition-colors hover:bg-emerald hover:text-cream"
        >
          Admin settings
        </Link>
      </div>

      <form
        method="get"
        action="/users"
        className="mt-6 rounded-2xl border border-pine/10 bg-white p-4"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_170px_auto] md:items-end">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-moss">
            Search
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Name or email"
              className="field-input h-10"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-moss">
            Role
            <select
              name="role"
              defaultValue={roleFilter}
              className="field-input h-10"
            >
              <option value="all">All roles</option>
              <option value="botanist">Botanist</option>
              <option value="conservation_officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-moss">
            Sort by
            <select
              name="sort"
              defaultValue={sort}
              className="field-input h-10"
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="newest">Newest</option>
            </select>
          </label>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full bg-emerald px-5 text-sm font-semibold text-cream transition-colors hover:bg-pine"
            >
              Apply
            </button>
            <Link
              href="/users"
              className="inline-flex h-10 items-center justify-center rounded-full bg-sprout px-4 text-sm font-semibold text-emerald transition-colors hover:bg-chartreuse"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      {loadError && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load users: {loadError}
        </div>
      )}

      {!loadError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-moss">
          <p>
            Showing <strong className="text-pine">{showingFrom}</strong> to{" "}
            <strong className="text-pine">{showingTo}</strong> of{" "}
            <strong className="text-pine">{total}</strong>{" "}
            {total === 1 ? "user" : "users"}
            {filtersActive ? " after filters" : ""}
          </p>
          <Link
            href="/admin/settings"
            className="font-semibold text-emerald hover:underline"
          >
            {pageSize} per page
          </Link>
        </div>
      )}

      {!loadError && profiles && profiles.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="font-semibold text-pine">
            {filtersActive ? "No users match these filters." : "No registered users yet."}
          </p>
          <p className="mt-2 text-sm text-moss">
            {filtersActive
              ? "Try a different name, email or role, or reset the filters."
              : "New accounts will appear here after registration."}
          </p>
        </div>
      )}

      {!loadError && profiles && profiles.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-pine/10 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-moss">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr
                  key={profile.user_id}
                  className="border-t border-pine/10 text-pine"
                >
                  <td className="px-4 py-3">
                    <UserNameForm
                      userId={profile.user_id}
                      name={profile.name}
                    />
                  </td>
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
                  <td className="whitespace-nowrap px-4 py-3 text-moss">
                    {formatJoined(profile.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loadError && totalPages > 1 && (
        <nav
          aria-label="User pagination"
          className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-pine/10 bg-white px-4 py-3 text-sm"
        >
          {page > 1 ? (
            <Link
              href={buildUsersHref({ q, role: roleFilter, sort, page: page - 1 })}
              className="font-semibold text-emerald hover:underline"
            >
              <Arrow direction="left" size="1em" /> Previous
            </Link>
          ) : (
            <span className="text-moss/50"><Arrow direction="left" size="1em" /> Previous</span>
          )}

          <span className="text-moss">
            Page <strong className="text-pine">{page}</strong> of{" "}
            <strong className="text-pine">{totalPages}</strong>
          </span>

          {page < totalPages ? (
            <Link
              href={buildUsersHref({ q, role: roleFilter, sort, page: page + 1 })}
              className="font-semibold text-emerald hover:underline"
            >
              Next <Arrow direction="right" size="1em" />
            </Link>
          ) : (
            <span className="text-moss/50">Next <Arrow direction="right" size="1em" /></span>
          )}
        </nav>
      )}

      <p className="mt-4 text-xs text-moss">
        Roles are enforced by row-level security in the database. Officers can
        approve records, admins can also manage users. You cannot demote
        yourself.
      </p>
    </div>
  );
}
