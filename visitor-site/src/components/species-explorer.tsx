"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PublicSpecies } from "@/lib/species";

function statusBadgeClass(status: string | null): string {
  if (!status) return "bg-sand text-moss";
  const s = status.toLowerCase();
  if (s.includes("critically") || s.includes("endangered")) return "bg-danger/15 text-danger";
  if (s.includes("vulnerable")) return "bg-danger/10 text-danger";
  if (s.includes("least concern")) return "bg-sprout text-emerald";
  if (s.includes("near threatened")) return "bg-chartreuse/30 text-pine";
  return "bg-sand text-moss";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function SpeciesExplorer({ species }: { species: PublicSpecies[] }) {
  const [activeStatus, setActiveStatus] = useState<string>("all");

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of species) {
      if (item.conservationStatus) {
        counts.set(item.conservationStatus, (counts.get(item.conservationStatus) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [species]);

  const filtered =
    activeStatus === "all"
      ? species
      : species.filter((item) => item.conservationStatus === activeStatus);

  return (
    <div>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveStatus("all")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeStatus === "all" ? "bg-emerald text-cream" : "bg-white text-pine hover:bg-sprout/60"
          }`}
        >
          All species ({species.length})
        </button>
        {statusCounts.map(([status, count]) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveStatus(status)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeStatus === status ? "bg-emerald text-cream" : "bg-white text-pine hover:bg-sprout/60"
            }`}
          >
            {status} ({count})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-pine/10 bg-white p-5 text-sm text-moss">
          No published species currently have this status.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={`/plants/${item.id}`}
              className="flex flex-col rounded-2xl border border-pine/10 bg-white p-5 transition-colors hover:border-emerald/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-pine">
                  {item.commonName || item.scientificName}
                </h3>
                {item.conservationStatus && (
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.conservationStatus)}`}
                  >
                    {item.conservationStatus}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm italic text-moss">{item.scientificName}</p>
              {item.description && (
                <p className="mt-3 text-sm leading-6 text-moss">{truncate(item.description, 140)}</p>
              )}
              <span className="mt-4 text-sm font-semibold text-emerald">View plant →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
