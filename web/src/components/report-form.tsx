"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateReport } from "@/app/reports/actions";
import {
  REPORT_TYPES,
  REPORT_FORMATS,
  type ReportType,
  type ReportFormat,
} from "@/lib/report-types";

const RANGE_PRESETS = [
  { label: "All time", value: "all" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
];

export function ReportForm() {
  const router = useRouter();
  const [type, setType] = useState<ReportType>("observations");
  const [format, setFormat] = useState<ReportFormat>("csv");
  const [range, setRange] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await generateReport(
        type,
        range.trim() || "all",
        format,
      );
      if (!result.ok) {
        setMessage({ ok: false, text: result.error ?? "Could not generate report." });
        return;
      }
      setMessage({ ok: true, text: "Report generated. It is ready in the report library below." });
      router.refresh();
    });
  }

  return (
    <form
      id="generate-report"
      onSubmit={handleSubmit}
      className="rounded-3xl border border-pine/10 bg-white p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-emerald">New export</p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-pine">
            Generate a report
          </h2>
          <p className="mt-1 text-sm text-moss">
            Choose a dataset and format. Each file is saved to the private
            reports area and listed below.
          </p>
        </div>
        <span className="rounded-full bg-sprout px-3 py-1 text-xs font-semibold text-emerald">
          Officer only
        </span>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-semibold text-pine">Report type</legend>
        <div
          role="radiogroup"
          aria-label="Report type"
          className="grid gap-2 sm:grid-cols-3"
        >
          {REPORT_TYPES.map((option) => {
            const selected = type === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setType(option.value);
                  setMessage(null);
                }}
                className={`flex min-h-[7rem] flex-col rounded-2xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-emerald bg-sprout/60"
                    : "border-pine/10 bg-cream/40 hover:border-emerald/40 hover:bg-sprout/30"
                }`}
              >
                <span className="font-semibold text-pine">{option.label}</span>
                <span className="mt-1 text-xs leading-5 text-moss">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-pine">Format</legend>
        <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-pine/5 p-1.5">
          {REPORT_FORMATS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={format === option.value}
              onClick={() => setFormat(option.value)}
              className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition-colors ${
                format === option.value
                  ? "bg-white text-emerald shadow-sm"
                  : "text-moss hover:text-pine"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="report-range" className="mb-1.5 block text-sm font-semibold text-pine">
          Data range
        </label>
        <input
          id="report-range"
          value={range}
          onChange={(event) => {
            setRange(event.target.value);
            setMessage(null);
          }}
          placeholder='all, 30, or 2026-09-01..2026-09-30'
          className="field-input"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              aria-pressed={range === preset.value}
              onClick={() => {
                setRange(preset.value);
                setMessage(null);
              }}
              className={`min-h-10 rounded-full px-3 text-xs font-semibold transition-colors ${
                range === preset.value
                  ? "bg-pine text-cream"
                  : "bg-sand text-moss hover:bg-sprout hover:text-emerald"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-moss">
          Species and conservation reports ignore the range because they export
          the current catalogue. Field observations apply the range to record
          creation dates.
        </p>
      </div>

      {message && (
        <p
          role="status"
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
        className="btn btn--primary mt-5"
      >
        {isPending ? "Generating…" : "Generate report"}
      </button>
    </form>
  );
}
