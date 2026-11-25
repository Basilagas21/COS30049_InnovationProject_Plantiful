"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeStaffAllowlistEntry,
  saveStaffAllowlistEntry,
  setStaffAllowlistRole,
} from "@/app/admin/staff/actions";
import { MANAGED_ROLES, type ManagedRole } from "@/app/users/roles";

type Entry = {
  email: string;
  role: ManagedRole;
  createdAt: string;
};

const ROLE_BUTTON_LABELS: Record<ManagedRole, string> = {
  botanist: "Botanist",
  conservation_officer: "Officer",
  admin: "Admin",
};

function formatAdded(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StaffAllowlistManager({
  entries,
  currentEmail,
}: {
  entries: Entry[];
  currentEmail: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ManagedRole>("conservation_officer");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("add");

    const result = await saveStaffAllowlistEntry(email, role);
    setBusy(null);

    if (!result.ok) {
      setError(result.error ?? "Could not save the allowlist entry.");
      return;
    }

    setEmail("");
    setNotice("Saved. Any existing account with this email was updated too.");
    router.refresh();
  }

  async function handleRoleChange(target: string, nextRole: ManagedRole) {
    setError(null);
    setNotice(null);
    setBusy(target);

    const result = await setStaffAllowlistRole(target, nextRole);
    setBusy(null);

    if (!result.ok) {
      setError(result.error ?? "Could not update the role.");
      router.refresh();
      return;
    }

    setNotice(`Updated the role for ${target}.`);
    router.refresh();
  }

  async function handleRemove(target: string) {
    if (!window.confirm(`Remove ${target} from the allowlist?`)) return;

    setError(null);
    setNotice(null);
    setBusy(target);

    const result = await removeStaffAllowlistEntry(target);
    setBusy(null);

    if (!result.ok) {
      setError(result.error ?? "Could not remove the allowlist entry.");
      router.refresh();
      return;
    }

    setNotice(`Removed ${target}. Existing accounts returned to botanist.`);
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form
        onSubmit={handleAdd}
        className="rounded-2xl border border-pine/10 bg-white p-5"
      >
        <h2 className="font-semibold text-pine">Add or update an email</h2>
        <p className="mt-1 text-sm text-moss">
          Use the exact staff email address. Letter case does not matter.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@sfc.gov.my"
              className="field-input h-11"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as ManagedRole)}
              className="field-input h-11"
            >
              {MANAGED_ROLES.map((candidate) => (
                <option key={candidate} value={candidate}>
                  {ROLE_BUTTON_LABELS[candidate]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy !== null}
            className="btn btn--primary h-11"
          >
            {busy === "add" ? "Saving…" : "Save entry"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-xl bg-sprout px-4 py-3 text-sm text-emerald">
          {notice}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="font-semibold text-pine">No allowlist entries yet.</p>
          <p className="mt-2 text-sm text-moss">
            Add an officer or admin email above. Everyone else stays a botanist.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-pine/10 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="bg-sand text-xs uppercase tracking-wide text-moss">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Added</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const isSelf =
                  currentEmail?.toLowerCase() === entry.email.toLowerCase();
                const rowBusy = busy === entry.email;

                return (
                  <tr
                    key={entry.email}
                    className="border-t border-pine/10 text-pine"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-moss">
                      {entry.email}
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-sprout px-2 py-0.5 text-xs font-semibold text-emerald">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex rounded-full border border-pine/15 bg-white p-1">
                        {MANAGED_ROLES.map((candidate) => (
                          <button
                            key={candidate}
                            type="button"
                            disabled={
                              rowBusy ||
                              busy !== null ||
                              isSelf ||
                              candidate === entry.role
                            }
                            onClick={() =>
                              handleRoleChange(entry.email, candidate)
                            }
                            className={`min-h-11 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed sm:min-h-0 ${
                              candidate === entry.role
                                ? "bg-emerald text-cream"
                                : "text-moss hover:text-pine"
                            }`}
                          >
                            {ROLE_BUTTON_LABELS[candidate]}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-moss">
                      {formatAdded(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={rowBusy || busy !== null || isSelf}
                        onClick={() => handleRemove(entry.email)}
                        className="text-sm font-semibold text-danger hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {rowBusy ? "Removing…" : "Remove"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-moss">
        Changing or removing an entry also updates the matching account by
        email. Admins cannot change their own role from this page.
      </p>
    </div>
  );
}
