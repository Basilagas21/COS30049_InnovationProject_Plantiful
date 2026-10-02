"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ApproveRejectButtons } from "@/components/approve-reject";
import type { RecordListItem } from "@/lib/records";

type Props = {
  records: RecordListItem[];
  officer: boolean;
};

export function RecordsBrowser({ records, officer }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const speciesOptions = useMemo(() => {
    const seen = new Map<string, { label: string; match: string }>();
    for (const record of records) {
      const key = record.scientificName;
      if (!seen.has(key)) {
        seen.set(key, {
          label: record.commonName
            ? `${record.scientificName} (${record.commonName})`
            : record.scientificName,
          match: `${record.scientificName} ${record.commonName ?? ""}`.toLowerCase(),
        });
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [records]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || selected === query.trim()) return [];
    return speciesOptions
      .filter((option) => option.match.includes(q))
      .slice(0, 8);
  }, [query, selected, speciesOptions]);

  const visibleRecords = useMemo(() => {
    if (!selected) return records;
    return records.filter((record) => record.scientificName === selected);
  }, [records, selected]);

  function pick(label: string) {
    setSelected(label);
    setQuery(label);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    }
    if (e.key === "Enter" && suggestions.length > 0) {
      pick(suggestions[0].label);
    }
  }

  function clearSearch() {
    setQuery("");
    setSelected(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search species…"
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length === 0) setSelected(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            className="h-10 w-full rounded-full border border-pine/15 bg-white pr-9 pl-4 text-sm outline-none transition-colors focus:border-emerald"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-moss transition-colors hover:text-pine"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {open && suggestions.length > 0 && (
            <ul className="absolute top-12 left-0 z-10 w-full overflow-hidden rounded-2xl border border-pine/10 bg-white shadow-lg">
              {suggestions.map((option) => (
                <li key={option.label}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(option.label)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-sprout"
                  >
                    <span className="font-medium text-pine">{option.label}</span>
                    <span className="text-xs text-moss">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-sprout px-4 text-sm font-semibold text-emerald transition-colors hover:bg-chartreuse"
          >
            {selected.split(" (")[0]}
            <span aria-hidden="true">✕</span>
          </button>
        )}

        <span className="ml-auto text-sm text-moss">
          {visibleRecords.length} {visibleRecords.length === 1 ? "record" : "records"}
          {selected ? " filtered" : ""}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRecords.map((record) => (
          <div
            key={record.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-pine/10 bg-white transition-shadow hover:shadow-lg"
          >
            <Link
              href={`/records/${record.id}`}
              className="flex flex-1 flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-sprout/70 transition-colors group-hover:bg-sprout">
                {record.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.photoUrl}
                    alt={record.scientificName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                {(record.approvalStatus === "pending" ||
                  record.approvalStatus === "rejected") && (
                  <span className="absolute top-3 left-3 inline-block rounded-full bg-chartreuse px-3 py-1 text-xs font-bold text-pine">
                    {record.approvalStatus === "pending" ? "Review" : "Rejected"}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald">
                  {record.commonName ?? record.scientificName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-pine">
                  {record.scientificName}
                </h3>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-moss">
                    {record.gpsLat?.toFixed(4)}, {record.gpsLng?.toFixed(4)} ·{" "}
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      record.approvalStatus === "approved"
                        ? record.isPublished
                          ? "bg-sprout text-emerald"
                          : "bg-chartreuse/60 text-pine"
                        : "bg-sand text-moss"
                    }`}
                  >
                    {record.isPublished
                      ? "Published"
                      : record.approvalStatus === "approved"
                        ? "Approved"
                        : record.approvalStatus === "pending"
                          ? "Pending"
                          : "Rejected"}
                  </span>
                </div>
              </div>
            </Link>
            {officer && record.approvalStatus === "pending" && (
              <div className="border-t border-pine/10 p-4 pt-3">
                <ApproveRejectButtons recordId={record.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}