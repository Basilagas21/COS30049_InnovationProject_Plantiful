"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Arrow } from "@/components/arrow";
import type { SpeciesListItem } from "@/lib/species";
import {
  familyFromTaxonomy,
  isThreatenedStatus,
} from "@/lib/species-taxonomy";

type Props = {
  species: SpeciesListItem[];
  officer: boolean;
  visitor?: boolean;
};

function VisitorSpeciesRow({ entry }: { entry: SpeciesListItem }) {
  return (
    <Link href={`/species/${entry.id}`} className="explore-species-row group">
      <div className="explore-species-row-media">
        {entry.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.photoUrl} alt={entry.scientificName} />
        ) : (
          <div className="explore-species-row-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
        )}
        {!entry.isPublished && (
          <span className="explore-species-row-unpublished">Unpublished</span>
        )}
      </div>
      <div className="explore-species-row-body">
        <div className="explore-species-row-main">
          <p className="explore-species-row-eyebrow">
            {entry.commonName ?? "Plant species"}
          </p>
          <h3 className="explore-species-row-name">{entry.scientificName}</h3>
          {entry.conservationStatus && (
            <span className="explore-species-row-status">
              {entry.conservationStatus}
            </span>
          )}
        </div>
        <div className="explore-species-row-side">
          {entry.description && (
            <p className="explore-species-row-desc">{entry.description}</p>
          )}
          {entry.taxonomy && (
            <p className="explore-species-row-taxonomy">{entry.taxonomy}</p>
          )}
          <span className="explore-species-row-link">
            Read the species profile <Arrow direction="right" size="1em" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export function SpeciesBrowser({ species, officer, visitor = false }: Props) {
  const [query, setQuery] = useState("");
  const [threatenedOnly, setThreatenedOnly] = useState(false);
  const [family, setFamily] = useState("all");

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of species) {
      const name = familyFromTaxonomy(entry.taxonomy) ?? "Unclassified";
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [species]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return species.filter((entry) => {
      if (threatenedOnly && !isThreatenedStatus(entry.conservationStatus)) {
        return false;
      }
      if (
        family !== "all" &&
        (familyFromTaxonomy(entry.taxonomy) ?? "Unclassified") !== family
      ) {
        return false;
      }
      if (!q) return true;
      const haystack =
        `${entry.scientificName} ${entry.commonName ?? ""} ${entry.taxonomy ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [species, query, threatenedOnly, family]);

  const threatenedCount = useMemo(
    () => species.filter((s) => isThreatenedStatus(s.conservationStatus)).length,
    [species],
  );

  const filtersActive =
    Boolean(query.trim()) || threatenedOnly || family !== "all";

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
          <span className="text-xs">{threatenedCount}</span>
        </button>

        <label htmlFor="species-family" className="sr-only">
          Plant family
        </label>
        <select
          id="species-family"
          value={family}
          onChange={(event) => setFamily(event.target.value)}
          className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm text-pine outline-none transition-colors focus:border-emerald"
        >
          <option value="all">All families</option>
          {families.map(([name, count]) => (
            <option key={name} value={name}>
              {name} ({count})
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setThreatenedOnly(false);
              setFamily("all");
            }}
            className="inline-flex h-10 items-center rounded-full bg-sprout px-4 text-sm font-semibold text-emerald transition-colors hover:bg-chartreuse"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-moss">
          {visible.length} species
          {filtersActive ? " filtered" : ""}
        </span>
      </div>

      {visitor && visible.length === 1 ? (
        <div className="mt-8">
          <VisitorSpeciesRow entry={visible[0]} />
        </div>
      ) : (
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <div className="col-span-full rounded-2xl border border-pine/10 bg-white px-5 py-10 text-center text-sm text-moss">
            <p className="font-semibold text-pine">
              {species.length === 0 && visitor
                ? "No published species yet."
                : species.length === 0
                  ? "No species in the catalogue yet."
                  : "No species match the current filters."}
            </p>
            <p className="mt-2">
              {species.length === 0 && visitor
                ? "Published species will appear here once a conservation officer approves a linked observation."
                : species.length === 0
                  ? "Officers can add the first species from the catalogue page."
                  : "Try a different search term or clear the filters."}
            </p>
          </div>
        )}
        {visible.map((entry) => (
          <div key={entry.id} className="species-card group">
            <Link href={`/species/${entry.id}`} className="species-card-link">
              <div className="species-card-media">
                {entry.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.photoUrl}
                    alt={entry.scientificName}
                    className="species-card-img"
                  />
                ) : (
                  <div className="species-card-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                    </svg>
                  </div>
                )}
                {!entry.isPublished && (
                  <span className="species-card-unpublished">Unpublished</span>
                )}
                <span className="species-card-arrow" aria-hidden="true">
                  <Arrow direction="right" size="1em" />
                </span>
              </div>
              <div className="species-card-body">
                <p className="species-card-eyebrow">
                  {entry.commonName ?? "Plant species"}
                </p>
                <h3 className="species-card-name">{entry.scientificName}</h3>
                <div className="species-card-meta">
                  <span className="species-card-status-slot">
                    {entry.conservationStatus && (
                      <span className="species-card-status">
                        {entry.conservationStatus}
                      </span>
                    )}
                  </span>
                  {entry.taxonomy && (
                    <p className="species-card-taxonomy">{entry.taxonomy}</p>
                  )}
                </div>
              </div>
            </Link>
            {officer && (
              <div className="species-card-manage">
                <Link
                  href={`/species/${entry.id}/edit`}
                  className="btn btn--ghost btn--sm h-9"
                >
                  Manage
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
      )}
    </>
  );
}