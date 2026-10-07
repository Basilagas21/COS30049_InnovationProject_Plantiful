"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ApproveRejectButtons } from "@/components/approve-reject";
import type { RecordListItem } from "@/lib/records";

type Props = {
  records: RecordListItem[];
  officer: boolean;
};

type SortKey = "newest" | "oldest";
type StatusKey = "all" | "pending" | "approved" | "rejected";
type RangeKey = "all" | "7d" | "30d" | "year";

const STATUS_OPTIONS: { key: StatusKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "all", label: "Any date" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "year", label: "This year" },
];

function rangeCutoff(range: RangeKey): number | null {
  const now = Date.now();
  if (range === "7d") return now - 7 * 86_400_000;
  if (range === "30d") return now - 30 * 86_400_000;
  if (range === "year") return new Date(new Date().getFullYear(), 0, 1).getTime();
  return null;
}

export function RecordsBrowser({ records, officer }: Props) {
  const [query, setQuery] = useState("");
  // Scientific name of the picked species; the input shows the longer label.
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [status, setStatus] = useState<StatusKey>("all");
  const [conservation, setConservation] = useState<string>("all");
  const [range, setRange] = useState<RangeKey>("all");
  const [photoOnly, setPhotoOnly] = useState(false);

  const speciesOptions = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; match: string }>();
    for (const record of records) {
      const key = record.scientificName;
      if (!seen.has(key)) {
        seen.set(key, {
          key,
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
    if (!q || selected) return [];
    return speciesOptions
      .filter((option) => option.match.includes(q))
      .slice(0, 8);
  }, [query, selected, speciesOptions]);

  const conservationOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const record of records) {
      if (record.conservationStatus) seen.add(record.conservationStatus);
    }
    return [...seen].sort();
  }, [records]);

  const filtersActive =
    status !== "all" ||
    conservation !== "all" ||
    range !== "all" ||
    photoOnly ||
    sort !== "newest";

  const visibleRecords = useMemo(() => {
    const cutoff = rangeCutoff(range);
    const list = records.filter((record) => {
      if (selected && record.scientificName !== selected) return false;
      if (status !== "all" && record.approvalStatus !== status) return false;
      if (conservation !== "all" && record.conservationStatus !== conservation) return false;
      if (cutoff != null && new Date(record.createdAt).getTime() < cutoff) return false;
      if (photoOnly && !record.photoUrl) return false;
      return true;
    });
    list.sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );
    return list;
  }, [records, selected, status, conservation, range, photoOnly, sort]);

  function pick(option: { key: string; label: string }) {
    setSelected(option.key);
    setQuery(option.label);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    }
    if (e.key === "Enter" && suggestions.length > 0) {
      pick(suggestions[0]);
    }
  }

  function clearSearch() {
    setQuery("");
    setSelected(null);
    setOpen(false);
    inputRef.current?.focus();
  }

  function clearFilters() {
    setSort("newest");
    setStatus("all");
    setConservation("all");
    setRange("all");
    setPhotoOnly(false);
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            aria-label="Search species"
            value={query}
            placeholder="Search species…"
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
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
                    onClick={() => pick(option)}
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
            {selected}
            <span aria-hidden="true">✕</span>
          </button>
        )}

        <span className="ml-auto text-sm text-moss">
          {visibleRecords.length} {visibleRecords.length === 1 ? "record" : "records"}
          {selected || filtersActive ? " filtered" : ""}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex h-10 items-center gap-2 rounded-full border border-pine/15 bg-white pl-4 pr-2 text-sm text-pine">
          <span className="text-moss">Sort</span>
          <select
            aria-label="Sort records"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-full rounded-full bg-transparent pr-2 font-semibold outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

        <div className="inline-flex h-10 items-center rounded-full border border-pine/15 bg-white p-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setStatus(option.key)}
              className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                status === option.key
                  ? "bg-emerald text-cream"
                  : "text-moss hover:text-pine"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {conservationOptions.length > 0 && (
          <label className="inline-flex h-10 items-center gap-2 rounded-full border border-pine/15 bg-white pl-4 pr-2 text-sm text-pine">
            <span className="text-moss">Status</span>
            <select
              aria-label="Filter by conservation status"
              value={conservation}
              onChange={(e) => setConservation(e.target.value)}
              className="h-full rounded-full bg-transparent pr-2 font-semibold outline-none"
            >
              <option value="all">Any</option>
              {conservationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="inline-flex h-10 items-center gap-2 rounded-full border border-pine/15 bg-white pl-4 pr-2 text-sm text-pine">
          <span className="text-moss">Date</span>
          <select
            aria-label="Filter by date range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="h-full rounded-full bg-transparent pr-2 font-semibold outline-none"
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setPhotoOnly((value) => !value)}
          aria-pressed={photoOnly}
          className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
            photoOnly
              ? "border-emerald bg-emerald text-cream"
              : "border-pine/15 bg-white text-moss hover:text-pine"
          }`}
        >
          With photo
        </button>

        {filtersActive && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-sprout px-4 text-sm font-semibold text-emerald transition-colors hover:bg-chartreuse"
          >
            Reset filters
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleRecords.length === 0 && (
          <div className="col-span-full rounded-2xl border border-pine/10 bg-white px-5 py-10 text-center text-sm text-moss">
            No records match the current filters.
          </div>
        )}
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
                    {record.gpsLat != null && record.gpsLng != null
                      ? `${record.gpsLat.toFixed(4)}, ${record.gpsLng.toFixed(4)} · `
                      : "No GPS · "}
                    {new Date(record.createdAt).toLocaleDateString("en-GB")}
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