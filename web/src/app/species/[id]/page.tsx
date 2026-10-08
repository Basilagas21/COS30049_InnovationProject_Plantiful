import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchSpeciesById } from "@/lib/species";
import { isOfficer } from "@/lib/auth";
import { PhotoGallery } from "@/components/species-photos";
import { SpeciesDeleteButton } from "@/components/species-delete-button";

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [entry, officer] = await Promise.all([fetchSpeciesById(id), isOfficer()]);
  if (!entry) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link href="/species" className="text-sm font-medium text-emerald hover:underline">
        ← Back to species
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative">
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
            {!entry.isPublished && (
              <span className="absolute top-4 left-4 rounded-full bg-chartreuse px-3 py-1 text-xs font-bold text-pine">
                Unpublished
              </span>
            )}
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
            className="inline-flex h-10 w-fit items-center rounded-full border border-pine/20 bg-white px-6 text-sm font-semibold text-pine transition-colors hover:bg-sprout"
          >
            View distribution on map
          </Link>

          {officer && (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/species/${entry.id}/edit`}
                className="inline-flex h-10 items-center rounded-full bg-emerald px-6 text-sm font-semibold text-cream transition-colors hover:bg-pine"
              >
                Edit species
              </Link>
              <SpeciesDeleteButton speciesId={entry.id} speciesName={entry.scientificName} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <PhotoGallery speciesId={entry.id} photos={entry.photos} officer={officer} />
      </div>
    </div>
  );
}