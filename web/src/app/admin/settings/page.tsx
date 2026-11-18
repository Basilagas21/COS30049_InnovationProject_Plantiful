import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { getUsersPageSize } from "@/lib/admin-settings";
import { USERS_PAGE_SIZES } from "@/lib/user-directory";
import { setUsersPageSize } from "./actions";

export default async function AdminSettingsPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "admin") redirect("/records");

  const pageSize = await getUsersPageSize();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Admin settings
          </h1>
          <p className="mt-2 max-w-2xl text-moss">
            Configure the admin workspace separately from personal profile
            settings. These options apply to your account in this browser.
          </p>
        </div>
        <Link
          href="/users"
          className="inline-flex h-11 items-center justify-center rounded-full border border-emerald px-5 text-sm font-semibold text-emerald transition-colors hover:bg-emerald hover:text-cream"
        >
          Back to users
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="rounded-3xl border border-pine/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-pine">User directory</h2>
          <p className="mt-2 text-sm leading-6 text-moss">
            Choose how many accounts appear on each page of the users table.
            Pagination stays server-side, so the setting does not load every
            account into the browser.
          </p>

          <form
            action={setUsersPageSize}
            className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end"
          >
            <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium text-pine">
              Users per page
              <select
                name="pageSize"
                defaultValue={pageSize}
                className="field-input h-11"
              >
                {USERS_PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-emerald px-6 text-sm font-semibold text-cream transition-colors hover:bg-pine"
            >
              Save settings
            </button>
          </form>

          <p className="mt-4 text-xs text-moss">
            Current setting: {pageSize} users per page.
          </p>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl border border-pine/10 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-pine">Admin tools</h2>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link
                href="/users"
                className="rounded-2xl border border-pine/10 px-4 py-3 font-semibold text-emerald transition-colors hover:border-emerald"
              >
                User directory
              </Link>
              <Link
                href="/profile"
                className="rounded-2xl border border-pine/10 px-4 py-3 font-semibold text-emerald transition-colors hover:border-emerald"
              >
                Personal profile
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-sprout p-6 shadow-sm">
            <h2 className="font-semibold text-pine">Keep settings separate</h2>
            <p className="mt-2 text-sm leading-6 text-emerald">
              Password, theme and sign-out belong on the profile page. This page
              is only for admin defaults such as directory page size.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
