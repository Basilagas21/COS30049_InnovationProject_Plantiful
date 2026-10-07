import { redirect } from "next/navigation";
import { fetchReports } from "@/lib/reports";
import { isOfficer } from "@/lib/auth";
import { ReportForm } from "@/components/report-form";

export default async function ReportsPage() {
  if (!(await isOfficer())) redirect("/records");

  const reports = await fetchReports();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
          Reports
        </h1>
        <p className="mt-2 text-moss">
          Generate and download biodiversity reports for conservation planning
          and public education.
        </p>
      </div>

      <div className="mt-8 max-w-2xl">
        <ReportForm />
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold tracking-tight text-pine">
          Generated reports
        </h2>
        {reports.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
            <p className="text-sm text-moss">
              No reports generated yet — create your first one above.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reports.map((report) => (
              <li
                key={report.id}
                className="flex flex-col gap-3 rounded-2xl border border-pine/10 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-pine">
                      {report.reportType}
                    </p>
                    <p className="mt-1 text-sm text-moss">
                      {report.dataRange ?? "all data"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      report.isPublished
                        ? "bg-sprout text-emerald"
                        : "bg-sand text-moss"
                    }`}
                  >
                    {report.isPublished ? "Published" : "Private"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-pine/10 pt-3 text-sm">
                  <span className="text-moss">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                  {report.fileUrl ? (
                    <a
                      href={report.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-emerald hover:underline"
                    >
                      Download CSV
                    </a>
                  ) : (
                    <span className="text-moss">No file</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}