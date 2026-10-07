"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateReport } from "@/app/reports/actions";
import { REPORT_TYPES, type ReportType } from "@/lib/report-types";

export function ReportForm() {
  const router = useRouter();
  const [type, setType] = useState<ReportType>("observations");
  const [range, setRange] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await generateReport(
        type,
        range.trim() || "all",
      );
      if (!result.ok) {
        setMessage({ ok: false, text: result.error ?? "Could not generate report." });
        return;
      }
      setMessage({ ok: true, text: "Report generated — it is ready to download below." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-pine/10 bg-white p-6">
      <h2 className="font-semibold text-pine">Generate a report</h2>
      <p className="mt-1 text-sm text-moss">
        Export the latest catalogue, conservation status, or field observations
        as a CSV file.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-pine">Report type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="field-input"
          >
            {REPORT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-pine">Data range</span>
          <input
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder='e.g. 2026-09-01..2026-09-30 (default "all")'
            className="field-input"
          />
        </label>
      </div>

      {message && (
        <p
          className={`mt-4 text-sm font-semibold ${
            message.ok ? "text-emerald" : "text-danger"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 rounded-full bg-emerald px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50"
      >
        {isPending ? "Generating…" : "Generate report"}
      </button>
    </form>
  );
}