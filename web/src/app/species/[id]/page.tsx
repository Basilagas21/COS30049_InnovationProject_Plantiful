import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { notFound } from "next/navigation";
import { fetchSpeciesById } from "@/lib/species";
import { isOfficer } from "@/lib/auth";
import { plantQuestionsForSpecies } from "@/lib/plant-learning";
import { PhotoGallery } from "@/components/species-photos";
import { SpeciesDeleteButton } from "@/components/species-delete-button";
import { RecordMiniMap } from "@/components/record-mini-map";
import { fetchMapPoints } from "@/lib/map";

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, officer, points] = await Promise.all([
    fetchSpeciesById(id),
    isOfficer(),
    fetchMapPoints(id),
  ]);
  if (!entry) notFound();

  const firstPoint = points[0] ?? null;
  const questions = plantQuestionsForSpecies(entry.scientificName);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link href="/species" className="inline-flex min-h-11 items-center text-sm font-medium text-emerald hover:underline sm:min-h-0">
        <Arrow direction="left" size="1em" /> Back to species
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="relative overflow-hidden rounded-3xl border border-pine/10 bg-sprout">
            {entry.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={entry.photoUrl}
                alt={`${entry.scientificName} botanical photo`}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label="Botanical illustration"
                className="aspect-[4/3] w-full bg-[url('/botanical.svg')] bg-contain bg-center bg-no-repeat"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-pine/55 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-5 text-sm font-semibold italic text-white">
              {entry.scientificName}
            </p>
          </div>

          <div>
            <p className="eyebrow text-emerald">Distribution</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-pine">
              Observed location
            </h2>
            <div className="mt-4">
              <RecordMiniMap
                lat={firstPoint?.lat}
                lng={firstPoint?.lng}
                label={entry.scientificName}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                entry.isPublished ? "bg-sprout text-emerald" : "bg-chartreuse text-pine"
              }`}
            >
              {entry.isPublished ? "Published" : "Unpublished"}
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-pine italic">
              {entry.scientificName}
            </h1>
            {entry.commonName && (
              <p className="mt-1 text-lg text-moss">{entry.commonName}</p>
            )}
            {entry.conservationStatus && (
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald">
                {entry.conservationStatus}
              </p>
            )}
          </div>

          {entry.taxonomy && (
            <div className="rounded-2xl bg-sprout p-4">
              <p className="text-xs text-moss">Taxonomy</p>
              <p className="mt-1 text-sm font-semibold text-pine">{entry.taxonomy}</p>
            </div>
          )}

          {entry.description && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Description</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{entry.description}</p>
            </div>
          )}

          {entry.ecology && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Ecology & habitat</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{entry.ecology}</p>
            </div>
          )}

          {entry.culturalSignificance && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Cultural significance</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{entry.culturalSignificance}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Added", value: new Date(entry.createdAt).toLocaleDateString() },
              { label: "Updated", value: new Date(entry.updatedAt).toLocaleDateString() },
              { label: "Photos", value: String(entry.photoCount) },
              { label: "ID", value: entry.id },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-sand p-4">
                <p className="text-xs text-moss">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-pine">{metric.value}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/map?species_id=${entry.id}`}
            className="inline-flex h-10 min-h-11 w-fit items-center rounded-full border border-pine/20 bg-white px-6 text-sm font-semibold text-pine transition-colors hover:bg-sprout sm:min-h-0"
          >
            View distribution on map
          </Link>

          {officer && (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/species/${entry.id}/edit`}
                className="btn btn--primary btn--sm h-10"
              >
                Edit species
              </Link>
              <SpeciesDeleteButton speciesId={entry.id} speciesName={entry.scientificName} />
            </div>
          )}
        </div>
      </div>

      {questions.length > 0 && (
        <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-emerald">Visitor Q&amp;A</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-pine">
                  Learn more about this species
                </h2>
              </div>
              <Link
                href="/learn"
                className="text-sm font-semibold text-emerald hover:underline"
              >
                More plant questions <Arrow direction="right" size="1em" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {questions.map((item) => (
                <details
                  key={item.question}
                  className="rounded-2xl border border-pine/10 bg-white p-5 open:bg-sprout/30"
                >
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold text-pine [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span aria-hidden="true" className="text-lg text-emerald">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-moss">{item.answer}</p>
                </details>
              ))}
            </div>
        </section>
      )}

      <div className="mt-12">
        <PhotoGallery speciesId={entry.id} photos={entry.photos} officer={officer} />
      </div>
    </div>
  );
}