"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { SpeciesListItem } from "@/lib/species";

type Props = {
  species: SpeciesListItem[];
  officer: boolean;
};

export function SpeciesBrowser({ species, officer }: Props) {
  const [query, setQuery] = useState("");
  const [threatenedOnly, setThreatenedOnly] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return species.filter((entry) => {
      if (threatenedOnly && !entry.conservationStatus) return false;
      if (!q) return true;
      const haystack =
        `${entry.scientificName} ${entry.commonName ?? ""} ${entry.taxonomy ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [species, query, threatenedOnly]);

  const threatenedCount = useMemo(
    () => species.filter((s) => s.conservationStatus).length,
    [species],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          placeholder="Search by scientific or common name…"
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-full border border-pine/15 bg-white px-4 text-sm outline-none transition-colors focus:border-emerald sm:w-80"
        />
        <button
          type="button"
          onClick={() => setThreatenedOnly((v) => !v)}
          className={`inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
            threatenedOnly
              ? "bg-emerald text-cream"
              : "bg-sprout text-emerald hover:bg-chartreuse"
          }`}
        >
          {threatenedOnly ? "All statuses" : "Threatened only"}
          <span className="text-xs">
            {threatenedCount}
          </span>
        </button>
        <span className="ml-auto text-sm text-moss">
          {visible.length} {visible.length === 1 ? "species" : "species"}
          {query || threatenedOnly ? " filtered" : ""}
        </span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((entry) => (
          <div
            key={entry.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-pine/10 bg-white transition-shadow hover:shadow-lg"
          >
            <Link href={`/species/${entry.id}`} className="flex flex-1 flex-col">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-sprout/70">
                {entry.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.photoUrl}
                    alt={entry.scientificName}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl">
                    🌿
                  </div>
                )}
                {!entry.isPublished && (
                  <span className="absolute top-3 left-3 inline-block rounded-full bg-chartreuse px-3 py-1 text-xs font-bold text-pine">
                    Unpublished
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald">
                  {entry.commonName ?? "Plant species"}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-pine italic">
                  {entry.scientificName}
                </h3>
                {entry.conservationStatus && (
                  <p className="mt-2 inline-block rounded-full bg-sprout px-2.5 py-0.5 text-xs font-semibold text-emerald">
                    {entry.conservationStatus}
                  </p>
                )}
                {entry.taxonomy && (
                  <p className="mt-3 text-sm text-moss">{entry.taxonomy}</p>
                )}
              </div>
            </Link>
            {officer && (
              <div className="border-t border-pine/10 p-4 pt-3">
                <Link
                  href={`/species/${entry.id}/edit`}
                  className="inline-flex h-9 items-center rounded-full border border-emerald px-4 text-sm font-semibold text-emerald transition-colors hover:bg-emerald hover:text-cream"
                >
                  Manage
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}