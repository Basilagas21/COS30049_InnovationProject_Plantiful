import Link from "next/link";
import { fetchRecords } from "@/lib/records";
import { fetchMapPoints } from "@/lib/map";
import { SpeciesMap } from "@/components/species-map";

export default async function MapPage() {
  const { records, error, usingSampleData } = await fetchRecords();
  const points = await fetchMapPoints();
  const located = records.filter((r) => r.gpsLat != null && r.gpsLng != null);
  const speciesCount = new Set(records.map((r) => r.scientificName)).size;
  const pendingCount = records.filter((r) => r.approvalStatus === "pending").length;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        Species map
      </h1>
      <p className="mt-2 text-moss">
        Approved field observations plotted by GPS coordinate
        {usingSampleData ? " (sample data)" : ""}
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
          <div className="border-b border-pine/10 bg-sprout/50 px-5 py-3 text-sm text-moss">
            Located observations
          </div>
          {located.length === 0 ? (
            <p className="px-5 py-6 text-sm text-moss">No observations with GPS yet.</p>
          ) : (
            <ul className="divide-y divide-pine/10">
              {located.map((r) => (
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
              <div className="flex justify-between">
                <dt className="text-moss">Awaiting review</dt>
                <dd className="font-semibold text-pine">{pendingCount}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
