import Link from "next/link";
import { redirect } from "next/navigation";
import { isOfficer, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ApproveRejectButtons } from "@/components/approve-reject";

type PendingRow = {
  record_id: string;
  botanist_id: string | null;
  qr_code: string | null;
  provisional_name: string | null;
  height_cm: number | null;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
  species: {
    scientific_name: string;
    common_name: string | null;
  } | null;
};

export default async function ApprovalsPage() {
  if (!(await isOfficer())) redirect("/records");

  const supabase = await createClient();
  const admin = await isAdmin();

  const { data: rows, error } = await supabase
    .from("plant_records")
    .select(
      `record_id, botanist_id, qr_code, provisional_name, height_cm, gps_lat, gps_lng, created_at,
       species ( scientific_name, common_name )`,
    )
    .eq("approval_status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  const pending: PendingRow[] = rows ?? [];

  const botanistIds = [
    ...new Set(
      pending
        .map((row) => row.botanist_id)
        .filter((id): id is string => id !== null),
    ),
  ];

  const namesById = new Map<string, { name: string; email: string }>();
  if (botanistIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("user_id, name, email")
      .in("user_id", botanistIds);
    for (const profile of profiles ?? []) {
      namesById.set(profile.user_id, {
        name: profile.name,
        email: profile.email,
      });
    }
  }

  const quickLinks = [
    { href: "/records", label: "All records", desc: "Browse, search, revisit decisions" },
    { href: "/species/new", label: "Add species", desc: "Grow the catalogue" },
    { href: "/reports", label: "Reports", desc: "Generate biodiversity reports" },
    { href: "/alerts", label: "Threat alerts", desc: "IoT sensor feed" },
    { href: "/map", label: "Map", desc: "Approved observations in 3D" },
    ...(admin ? [{ href: "/users", label: "Users", desc: "Grant or revoke roles" }] : []),
  ];

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Approvals
          </h1>
          <p className="mt-2 text-moss">
            Submissions from botanists waiting for review. Approving publishes
            the record to the map and species pages.
          </p>
        </div>
        <span className="rounded-full bg-sprout px-4 py-1.5 text-sm font-semibold text-emerald">
          {pending.length} pending
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load pending records: {error.message}
        </div>
      )}

      {!error && pending.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-pine">All caught up</p>
          <p className="mt-1 text-sm text-moss">
            No submissions are waiting for review.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <ul className="mt-8 space-y-4">
          {pending.map((row) => {
            const botanist = row.botanist_id
              ? namesById.get(row.botanist_id)
              : undefined;
            const title =
              row.species?.scientific_name ??
              row.provisional_name ??
              "Unknown species";
            return (
              <li
                key={row.record_id}
                className="rounded-2xl border border-pine/10 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-pine">
                      <Link
                        href={`/records/${row.record_id}`}
                        className="hover:text-emerald"
                      >
                        {title}
                      </Link>
                    </p>
                    {row.species?.common_name && (
                      <p className="text-sm text-moss">
                        {row.species.common_name}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-moss">
                      {row.qr_code ? `Tag ${row.qr_code}` : "No tag"} ·{" "}
                      {botanist ? botanist.name : "Unknown botanist"} ·{" "}
                      {new Date(row.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <dl className="flex gap-6 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-moss">
                        Height
                      </dt>
                      <dd className="font-semibold text-pine">
                        {row.height_cm != null ? `${row.height_cm} cm` : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-moss">
                        GPS
                      </dt>
                      <dd className="font-semibold text-pine">
                        {row.gps_lat != null && row.gps_lng != null
                          ? `${row.gps_lat.toFixed(4)}, ${row.gps_lng.toFixed(4)}`
                          : "—"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-4 border-t border-pine/10 pt-4">
                  <ApproveRejectButtons recordId={row.record_id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-pine">
          Quick links
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded-2xl border border-pine/10 bg-white p-5 transition-colors hover:border-emerald/40"
              >
                <p className="font-semibold text-pine">{link.label}</p>
                <p className="mt-1 text-sm text-moss">{link.desc}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
