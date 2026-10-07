import Link from "next/link";
import { redirect } from "next/navigation";
import { isOfficer } from "@/lib/auth";
import { SpeciesForm } from "@/components/species-form";

export default async function NewSpeciesPage() {
  if (!(await isOfficer())) redirect("/species");

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <Link href="/species" className="text-sm font-medium text-emerald hover:underline">
        ← Back to species
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        New species
      </h1>
      <p className="mt-2 text-moss">
        Add a plant species to the wildlife catalogue maintained by conservation
        officers.
      </p>
      <SpeciesForm />
    </div>
  );
}