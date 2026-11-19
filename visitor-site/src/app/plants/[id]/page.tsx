import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchPublicSpeciesById, describeConservationStatus } from "@/lib/species";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchPublicSpeciesById(id);
  const name =
    result.state === "ok" && result.species
      ? result.species.commonName || result.species.scientificName
      : "Plant";
  return { title: `${name} | Plantiful` };
}

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await fetchPublicSpeciesById(id);

  if (result.state === "not_configured") {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Link href="/species" className="block text-sm font-medium text-emerald hover:underline">
          ← Back to species
        </Link>
        <div className="mt-6 rounded-2xl border border-pine/10 bg-white p-6">
          <p className="text-sm text-moss">
            Live species data isn&apos;t connected in this environment, so this
            plant&apos;s page can&apos;t be shown right now.
          </p>
        </div>
      </div>
    );
  }

  if (result.state === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <Link href="/species" className="block text-sm font-medium text-emerald hover:underline">
          ← Back to species
        </Link>
        <div className="mt-6 rounded-2xl border border-danger/20 bg-danger/5 p-6">
          <p className="text-sm text-danger">
            We couldn&apos;t load this plant&apos;s details right now. Please try again
            shortly.
          </p>
        </div>
      </div>
    );
  }

  const entry = result.species;
  if (!entry) notFound();

  const statusMeaning = describeConservationStatus(entry.conservationStatus);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link href="/species" className="block text-sm font-medium text-emerald hover:underline">
        ← Back to species
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          {entry.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.photoUrl}
              alt={entry.scientificName}
              className="aspect-[4/5] w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-gradient-to-br from-sprout to-cream text-6xl">
              🌿
            </div>
          )}
        </div>

        <div>
          {entry.conservationStatus && (
            <span
              className="inline-flex rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald"
            >
              {entry.conservationStatus}
            </span>
          )}
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            {entry.commonName || entry.scientificName}
          </h1>
          {entry.commonName && (
            <p className="mt-1 text-lg italic text-moss">{entry.scientificName}</p>
          )}
          {entry.taxonomy && <p className="mt-2 text-sm text-moss">{entry.taxonomy}</p>}

          {entry.description && (
            <p className="mt-6 text-sm leading-7 text-moss">{entry.description}</p>
          )}
          {entry.ecology && (
            <div className="mt-6">
              <p className="eyebrow text-emerald">Ecology</p>
              <p className="mt-2 text-sm leading-7 text-moss">{entry.ecology}</p>
            </div>
          )}
          {entry.culturalSignificance && (
            <div className="mt-6">
              <p className="eyebrow text-emerald">Cultural significance</p>
              <p className="mt-2 text-sm leading-7 text-moss">{entry.culturalSignificance}</p>
            </div>
          )}

          {statusMeaning && (
            <div className="mt-6 rounded-2xl border border-pine/10 bg-sprout/40 p-5">
              <p className="text-sm font-semibold text-pine">
                What does &ldquo;{entry.conservationStatus}&rdquo; mean?
              </p>
              <p className="mt-2 text-sm leading-6 text-moss">{statusMeaning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
