import Link from "next/link";
import { fetchRecords } from "@/lib/records";
import { isOfficer } from "@/lib/auth";
import { ApproveRejectButtons } from "@/components/approve-reject";

export default async function RecordsPage() {
  const records = await fetchRecords();
  const officer = await isOfficer();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Plant records
          </h1>
          <p className="mt-2 text-moss">
            {records.length} field observations synced from the mobile app
          </p>
        </div>
        {officer && (
          <span className="inline-flex w-fit rounded-full bg-sprout px-3 py-1 text-sm font-semibold text-emerald">
            Officer view
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search species…"
          className="h-10 w-full rounded-full border border-pine/15 bg-white px-4 text-sm outline-none transition-colors focus:border-emerald sm:w-64"
        />
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>All species</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Published</option>
        </select>
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>All conservation statuses</option>
          <option>Endangered</option>
          <option>Vulnerable</option>
          <option>Not listed</option>
        </select>
        <select className="h-10 rounded-full border border-pine/15 bg-white px-4 text-sm outline-none focus:border-emerald">
          <option>Latest first</option>
          <option>Oldest first</option>
          <option>Name A-Z</option>
        </select>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {records.map((record) => (
          <div
            key={record.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-pine/10 bg-white transition-shadow hover:shadow-lg"
          >
            <Link
              href={`/records/${record.id}`}
              className="flex flex-1 flex-col"
            >
              <div className="aspect-[4/3] w-full rounded-t-2xl bg-sprout/70 transition-colors group-hover:bg-sprout">
                {(record.approvalStatus === "pending" ||
                  record.approvalStatus === "rejected") && (
                  <span className="m-3 inline-block rounded-full bg-chartreuse px-3 py-1 text-xs font-bold text-pine">
                    {record.approvalStatus === "pending" ? "Review" : "Rejected"}
                  </span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald">
                  {record.commonName ?? record.scientificName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-pine">
                  {record.scientificName}
                </h3>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-moss">
                    {record.gpsLat?.toFixed(4)}, {record.gpsLng?.toFixed(4)} ·{" "}
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      record.approvalStatus === "approved"
                        ? record.isPublished
                          ? "bg-sprout text-emerald"
                          : "bg-chartreuse/60 text-pine"
                        : "bg-sand text-moss"
                    }`}
                  >
                    {record.isPublished
                      ? "Published"
                      : record.approvalStatus === "approved"
                        ? "Approved"
                        : record.approvalStatus === "pending"
                          ? "Pending"
                          : "Rejected"}
                  </span>
                </div>
              </div>
            </Link>
            {officer && record.approvalStatus === "pending" && (
              <div className="border-t border-pine/10 p-4 pt-3">
                <ApproveRejectButtons recordId={record.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}