import { redirect } from "next/navigation";
import {
  fetchReportCoverage,
  fetchReports,
} from "@/lib/reports";
import { getCurrentRole } from "@/lib/auth";
import { ReportForm } from "@/components/report-form";
import { ReportsLibrary } from "@/components/reports-library";
import { REPORT_TYPES } from "@/lib/report-types";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-pine/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-moss">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-pine">
        {value}
      </p>
      <p className="mt-2 text-xs text-moss">{hint}</p>
    </div>
  );
}

export default async function ReportsPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "conservation_officer" && role !== "admin") redirect("/records");

  const [{ reports, error: reportsError }, { coverage, error: coverageError }] =
    await Promise.all([fetchReports(), fetchReportCoverage()]);

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow text-emerald">Conservation planning</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Reports
          </h1>
          <p className="mt-2 max-w-2xl text-moss">
            Turn verified records into downloadable evidence for review,
            partner reporting and public education.
          </p>
        </div>
        <a href="#generate-report" className="btn btn--primary h-11">
          New export
        </a>
      </div>

      {coverageError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger"
        >
          Coverage counts are unavailable: {coverageError}
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Species"
          value={coverage?.species ?? "—"}
          hint={coverage ? `${coverage.publishedSpecies} published` : "Not loaded"}
        />
        <StatCard
          label="Observations"
          value={coverage?.observations ?? "—"}
          hint="Records in the central catalogue"
        />
        <StatCard
          label="Approved"
          value={coverage?.approved ?? "—"}
          hint="Ready for publication review"
        />
        <StatCard
          label="Awaiting review"
          value={coverage?.pending ?? "—"}
          hint="Observations pending officer decision"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
        <ReportForm />

        <section className="rounded-3xl border border-pine/10 bg-sand/50 p-6">
          <p className="eyebrow text-emerald">Choose the right export</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-pine">
            What each report contains
          </h2>
          <div className="mt-5 space-y-3">
            {REPORT_TYPES.map((type) => (
              <div
                key={type.value}
                className="rounded-2xl border border-pine/10 bg-white p-4"
              >
                <p className="font-semibold text-pine">{type.label}</p>
                <p className="mt-1 text-xs leading-5 text-moss">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-pine px-5 py-4 text-sm text-cream">
            <p className="font-semibold">Private by default</p>
            <p className="mt-1 text-xs leading-5 text-cream/80">
              Generated files are stored in the private reports bucket. A signed
              download link is created only for officers and admins.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10">
        <ReportsLibrary reports={reports} error={reportsError} />
      </div>
    </div>
  );
}
