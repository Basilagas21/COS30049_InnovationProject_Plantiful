import { fetchSpecies } from "@/lib/species";
import { SpeciesBrowser } from "@/components/species-browser";

export default async function ExplorePage() {
  const species = await fetchSpecies({ publishedOnly: true });

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-2">
        <span className="inline-flex w-fit rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
          Public plant guide
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
          Explore Niah&apos;s plants
        </h1>
        <p className="mt-2 max-w-2xl text-moss">
          A public reference to the published species catalogue of Niah National
          Park. Search by scientific or common name, filter to threatened
          species, and learn how field observations are verified before
          publication.
        </p>
      </div>

      <SpeciesBrowser species={species} officer={false} />
    </div>
  );
}