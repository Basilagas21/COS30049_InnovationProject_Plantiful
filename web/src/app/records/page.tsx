import { fetchRecords } from "@/lib/records";
import { isOfficer } from "@/lib/auth";
import { RecordsBrowser } from "@/components/records-browser";

export default async function RecordsPage() {
  const { records, error, usingSampleData } = await fetchRecords();
  const officer = await isOfficer();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Plant records
          </h1>
          <p className="mt-2 text-moss">
            {error
              ? "Records unavailable"
              : `${records.length} field observations synced from the mobile app`}
          </p>
        </div>
        {officer && (
          <span className="inline-flex w-fit rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
            Officer view
          </span>
        )}
      </div>

      {usingSampleData && (
        <p className="mt-6 rounded-2xl bg-chartreuse/30 px-5 py-3 text-sm text-pine">
          Showing sample records. Supabase is not configured, so nothing here is
          real data.
        </p>
      )}

      {error ? (
        <div className="mt-8 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load records from the database: {error}
        </div>
      ) : (
        <RecordsBrowser records={records} officer={officer} />
      )}
    </div>
  );
}