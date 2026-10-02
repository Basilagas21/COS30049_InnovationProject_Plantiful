import { notFound } from "next/navigation";
import Link from "next/link";

const record = {
  id: "R-0001",
  species: "Nepenthes lowii",
  scientific: "Low's pitcher plant",
  classification: "Endangered",
  location: "Subis Trail",
  coordinates: "3.9983° N, 113.7822° E",
  accuracy: "±4 m",
  captured: "2026-09-28 09:41",
  synced: "2026-09-28 10:02",
  notes:
    "Mature pitcher with upper and lower pitchers present. Pitcher rim in good condition; fruit set observed nearby. Light gaps moderate along the trail edge.",
};

export default function RecordDetailPage() {
  const ok = true;
  if (!ok) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link href="/records" className="text-sm font-medium text-emerald hover:underline">
        ← Back to records
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-sprout to-cream" />
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <span className="inline-flex rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
              Published
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-pine">
              {record.species}
            </h1>
            <p className="mt-1 text-lg italic text-moss">{record.scientific}</p>
            <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald">
              {record.classification}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Location", value: record.location },
              { label: "Coordinates", value: record.coordinates },
              { label: "GPS accuracy", value: record.accuracy },
              { label: "Captured", value: record.captured },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-sprout p-4">
                <p className="text-xs text-moss">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-pine">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-pine/10 bg-white p-5">
            <h2 className="font-semibold text-pine">Field notes</h2>
            <p className="mt-2 text-sm leading-7 text-moss">{record.notes}</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-sand px-5 py-4 text-sm">
            <span className="text-moss">
              Synced from field device · {record.synced}
            </span>
            <span className="font-semibold text-emerald">ID {record.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}