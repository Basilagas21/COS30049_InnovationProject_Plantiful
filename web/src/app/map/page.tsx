import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { fetchRecords } from "@/lib/records";
import { fetchMapPoints } from "@/lib/map";
import { SpeciesMap } from "@/components/species-map";
import { fetchSpeciesById } from "@/lib/species";
import { isAuthenticated } from "@/lib/auth";

const LOCATED_PAGE_SIZE = 10;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildMapHref(speciesId: string | null, page: number): string {
  const query = new URLSearchParams();
  if (speciesId) query.set("species_id", speciesId);
  if (page > 1) query.set("page", String(page));
  const search = query.toString();
  return search ? `/map?${search}` : "/map";
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const speciesId = firstValue(params.species_id) ?? null;
  const requestedPage = parsePage(firstValue(params.page));

  const { records, error, usingSampleData } = await fetchRecords();
  const points = await fetchMapPoints(speciesId);
  const authenticated = await isAuthenticated();
  const located = records.filter((r) => r.gpsLat != null && r.gpsLng != null);
  const totalPages = Math.max(1, Math.ceil(located.length / LOCATED_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const pageStart = (page - 1) * LOCATED_PAGE_SIZE;
  const pageLocations = located.slice(pageStart, pageStart + LOCATED_PAGE_SIZE);
  const speciesCount = new Set(records.map((r) => r.scientificName)).size;
  const pendingCount = records.filter((r) => r.approvalStatus === "pending").length;

  let filterSpeciesName: string | null = null;
  if (speciesId) {
    const entry = await fetchSpeciesById(speciesId);
    filterSpeciesName = entry?.scientificName ?? null;
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        Species map{filterSpeciesName ? ` – ${filterSpeciesName}` : ""}
      </h1>
      <p className="mt-2 text-moss">
        Field observations plotted by GPS coordinate — filter by approval status
        {usingSampleData ? " (sample data)" : ""}
        {speciesId && (
          <>
            {" "}
            · <Link href="/map" className="text-emerald hover:underline">Show all species</Link>
          </>
        )}
      </p>

      {error && (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load records from the database: {error}
        </div>
      )}

      <div className="mt-8">
        <SpeciesMap points={points} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-3xl border border-pine/10 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-pine/10 bg-sprout/50 px-5 py-3 text-sm text-moss">
            <span>Located observations</span>
            {located.length > 0 && (
              <span className="font-mono text-xs">{located.length} total</span>
            )}
          </div>
          {located.length === 0 ? (
            <p className="px-5 py-6 text-sm text-moss">
              {authenticated
                ? "No observations with GPS yet."
                : "No published observations with GPS yet."}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-pine/10">
                {pageLocations.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/records/${r.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-3 text-sm transition-colors hover:bg-sprout/40"
                    >
                      <span className="font-medium text-pine">{r.scientificName}</span>
                      <span className="font-mono text-xs text-moss">
                        {r.gpsLat!.toFixed(5)}, {r.gpsLng!.toFixed(5)}
                        {r.gpsAccuracyM != null ? ` ±${r.gpsAccuracyM.toFixed(0)} m` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <nav
                  aria-label="Located observations pagination"
                  className="flex items-center justify-between gap-3 border-t border-pine/10 px-5 py-3 text-sm"
                >
                  {page > 1 ? (
                    <Link
                      href={buildMapHref(speciesId, page - 1)}
                      scroll={false}
                      className="inline-flex min-h-11 items-center font-semibold text-emerald hover:underline sm:min-h-0"
                    >
                      <Arrow direction="left" size="1em" /> Previous
                    </Link>
                  ) : (
                    <span className="text-moss/50">
                      <Arrow direction="left" size="1em" /> Previous
                    </span>
                  )}
                  <span className="text-moss">
                    Page <strong className="text-pine">{page}</strong> of{" "}
                    <strong className="text-pine">{totalPages}</strong>
                  </span>
                  {page < totalPages ? (
                    <Link
                      href={buildMapHref(speciesId, page + 1)}
                      scroll={false}
                      className="inline-flex min-h-11 items-center font-semibold text-emerald hover:underline sm:min-h-0"
                    >
                      Next <Arrow direction="right" size="1em" />
                    </Link>
                  ) : (
                    <span className="text-moss/50">
                      Next <Arrow direction="right" size="1em" />
                    </span>
                  )}
                </nav>
              )}
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-pine/10 bg-white p-5">
            <h2 className="font-semibold text-pine">Observation summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-moss">Total records</dt>
                <dd className="font-semibold text-pine">{records.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-moss">Species</dt>
                <dd className="font-semibold text-pine">{speciesCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-moss">With GPS</dt>
                <dd className="font-semibold text-pine">{located.length}</dd>
              </div>
              {authenticated && (
                <div className="flex justify-between">
                  <dt className="text-moss">Awaiting review</dt>
                  <dd className="font-semibold text-pine">{pendingCount}</dd>
                </div>
              )}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
