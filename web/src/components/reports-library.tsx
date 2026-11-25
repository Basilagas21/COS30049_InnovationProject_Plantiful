"use client";

import { useMemo, useState } from "react";
import { REPORT_TYPES } from "@/lib/report-types";
import type { ReportListItem } from "@/lib/reports";

const PAGE_SIZE = 6;

type StatusFilter = "all" | "published" | "private";

function reportLabel(value: string | null): string {
  if (!value) return "Unclassified report";
  return REPORT_TYPES.find((type) => type.value === value)?.label ?? value;
}

function downloadLabel(fileUrl: string): string {
  const clean = fileUrl.split("?")[0];
  const extension = clean.slice(clean.lastIndexOf(".") + 1).toLowerCase();
  if (extension === "pdf") return "Download PDF";
  if (extension === "csv") return "Download CSV";
  return "Download report";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportsLibrary({
  reports,
  error,
}: {
  reports: ReportListItem[];
  error: string | null;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reports.filter((report) => {
      if (status === "published" && !report.isPublished) return false;
      if (status === "private" && report.isPublished) return false;
      if (!term) return true;
      return [report.reportType, report.dataRange]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [reports, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(from, from + PAGE_SIZE);
  const published = reports.filter((report) => report.isPublished).length;
  const privateCount = reports.length - published;

  return (
    <section
      id="report-library"
      className="rounded-3xl border border-pine/10 bg-white p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald">Report library</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-pine">
            Generated files
          </h2>
          <p className="mt-1 text-sm text-moss">
            Search past exports and download a fresh signed link. Private
            reports stay out of the public visitor view.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-sand px-3 py-1 text-moss">
            {reports.length} total
          </span>
          <span className="rounded-full bg-sprout px-3 py-1 text-emerald">
            {published} published
          </span>
          <span className="rounded-full bg-pine/5 px-3 py-1 text-pine">
            {privateCount} private
          </span>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-danger/30 bg-sand/60 px-6 py-10 text-center"
        >
          <p className="text-sm font-semibold text-danger">Could not load reports</p>
          <p className="mt-2 text-sm text-moss">{error}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <label className="min-w-[14rem] flex-1">
              <span className="sr-only">Search reports</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by report type or data range"
                className="field-input"
              />
            </label>
            <div className="flex flex-wrap gap-1 rounded-2xl bg-pine/5 p-1">
              {(["all", "published", "private"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={status === option}
                  onClick={() => setStatus(option)}
                  className={`min-h-10 rounded-xl px-3 text-xs font-semibold capitalize transition-colors ${
                    status === option
                      ? "bg-white text-emerald shadow-sm"
                      : "text-moss hover:text-pine"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-3 text-xs text-moss">
            Showing {filtered.length ? from + 1 : 0} to {Math.min(from + PAGE_SIZE, filtered.length)} of {filtered.length} matching reports
          </p>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-pine/15 bg-sand/50 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-pine">No matching reports</p>
              <p className="mt-1 text-sm text-moss">
                Generate a report above or change the search and status filter.
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {visible.map((report) => (
                <li
                  key={report.id}
                  className="flex flex-col gap-3 rounded-2xl border border-pine/10 bg-cream/40 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-pine">
                        {reportLabel(report.reportType)}
                      </p>
                      <p className="mt-1 text-xs text-moss">
                        {report.dataRange ?? "all data"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        report.isPublished
                          ? "bg-sprout text-emerald"
                          : "bg-sand text-moss"
                      }`}
                    >
                      {report.isPublished ? "Published" : "Private"}
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-pine/10 pt-3 text-sm">
                    <span className="text-xs text-moss">
                      {formatDate(report.createdAt)}
                    </span>
                    {report.fileUrl ? (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald hover:underline"
                      >
                        {downloadLabel(report.fileUrl)}
                      </a>
                    ) : (
                      <span className="text-xs text-danger">File unavailable</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav
              aria-label="Report pagination"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-pine/10 pt-4 text-sm"
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="btn btn--quiet min-h-11 disabled:opacity-40"
              >
                Previous
              </button>
              <p className="font-mono text-xs text-moss">
                Page {currentPage} of {totalPages}
              </p>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="btn btn--quiet min-h-11 disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
