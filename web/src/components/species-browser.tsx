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

type SortKey = "name-asc" | "name-desc";

const PAGE_SIZES = [12, 24, 48];

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
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

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
    const filtered = species.filter((entry) => {
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
    return filtered.sort((a, b) =>
      sort === "name-asc"
        ? a.scientificName.localeCompare(b.scientificName)
        : b.scientificName.localeCompare(a.scientificName),
    );
  }, [species, query, threatenedOnly, family, sort]);

  const threatenedCount = useMemo(
    () => species.filter((s) => isThreatenedStatus(s.conservationStatus)).length,
    [species],
  );

  const filtersActive =
    Boolean(query.trim()) || threatenedOnly || family !== "all";

  // Pagination is visitor-only: the officer catalogue renders every record so
  // management workflows and the lifecycle suite always see the full list.
  const totalPages = visitor ? Math.max(1, Math.ceil(visible.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const pageItems = visitor
    ? visible.slice((safePage - 1) * pageSize, safePage * pageSize)
    : visible;

  const clearFilters = () => {
    setQuery("");
    setThreatenedOnly(false);
    setFamily("all");
    setPage(1);
  };

  return (
    <div className="species-browser">
      <div className="species-browser-toolbar">
        <div className="species-browser-search">
          <svg
            className="species-browser-searchicon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <label htmlFor="species-search" className="sr-only">
            Search by scientific or common name
          </label>
          <input
            id="species-search"
            type="search"
            value={query}
            placeholder="Search by scientific or common name…"
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            className="field-input species-browser-input"
          />
        </div>

        <div className="species-browser-filters">
          <button
            type="button"
            onClick={() => {
              setThreatenedOnly((v) => !v);
              setPage(1);
            }}
            aria-pressed={threatenedOnly}
            className={`species-browser-chip${threatenedOnly ? " is-active" : ""}`}
          >
            {threatenedOnly ? "All statuses" : "Threatened only"}
            <span className="species-browser-chip-count">{threatenedCount}</span>
          </button>

          <label htmlFor="species-family" className="sr-only">
            Plant family
          </label>
          <select
            id="species-family"
            value={family}
            onChange={(event) => {
              setFamily(event.target.value);
              setPage(1);
            }}
            className="species-browser-select"
          >
            <option value="all">All families</option>
            {families.map(([name, count]) => (
              <option key={name} value={name}>
                {name} ({count})
              </option>
            ))}
          </select>

          <label htmlFor="species-sort" className="sr-only">
            Sort species
          </label>
          <select
            id="species-sort"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortKey);
              setPage(1);
            }}
            className="species-browser-select"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="species-browser-chip species-browser-chip--clear"
            >
              Clear filters
            </button>
          )}
        </div>

        <span className="species-browser-count" aria-live="polite">
          {visible.length} species{filtersActive ? " filtered" : ""}
        </span>
      </div>

      {visitor && visible.length === 1 ? (
        <div className="species-browser-featured">
          <VisitorSpeciesRow entry={visible[0]} />
        </div>
      ) : (
        <div className="species-browser-results">
          <div className="species-browser-grid">
            {visible.length === 0 && (
              <div className="species-browser-empty">
                <p className="species-browser-empty-title">
                  {species.length === 0 && visitor
                    ? "No published species yet."
                    : species.length === 0
                      ? "No species in the catalogue yet."
                      : "No species match the current filters."}
                </p>
                <p className="species-browser-empty-body">
                  {species.length === 0 && visitor
                    ? "Published species will appear here once a conservation officer approves a linked observation."
                    : species.length === 0
                      ? "Officers can add the first species from the catalogue page."
                      : "Try a different search term or clear the filters."}
                </p>
              </div>
            )}
            {pageItems.map((entry) => (
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

          {visitor && totalPages > 1 && (
            <div className="species-browser-pagination">
              <span className="species-browser-pageof">
                Page {safePage} of {totalPages}
              </span>
              <div className="species-browser-pagenav">
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
              <label htmlFor="species-pagesize" className="sr-only">
                Species per page
              </label>
              <select
                id="species-pagesize"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                className="species-browser-select"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
