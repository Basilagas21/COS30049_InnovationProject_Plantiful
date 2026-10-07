import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchRecordById } from "@/lib/records";
import { isOfficer } from "@/lib/auth";
import { ApproveRejectButtons } from "@/components/approve-reject";

export default async function RecordDetailPage({
  params,
}: PageProps<"/records/[id]">) {
  const { id } = await params;
  const record = await fetchRecordById(id);
  if (!record) notFound();

  const officer = await isOfficer();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <Link href="/records" className="text-sm font-medium text-emerald hover:underline">
        ← Back to records
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative">
          {record.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.photoUrl}
              alt={record.scientificName}
              className="aspect-[4/5] w-full rounded-3xl object-cover"
            />
          ) : (
            <div className="aspect-[4/5] w-full rounded-3xl bg-gradient-to-br from-sprout to-cream" />
          )}
        </div>
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                record.isPublished
                  ? "bg-sprout text-emerald"
                  : record.provisionalName
                    ? "bg-chartreuse/70 text-pine"
                    : "bg-chartreuse/70 text-pine"
              }`}
            >
              {record.provisionalName
                ? "New discovery · unconfirmed species"
                : record.isPublished
                  ? "Published"
                  : record.approvalStatus === "pending"
                    ? "Pending review"
                    : record.approvalStatus === "approved"
                      ? "Approved"
                      : "Rejected"}
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-pine">
              {record.scientificName}
            </h1>
            <p className="mt-1 text-lg italic text-moss">{record.commonName}</p>
            {record.conservationStatus && (
              <p className="mt-2 text-sm font-medium uppercase tracking-wide text-emerald">
                {record.conservationStatus}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                label: "QR code",
                value: record.qrCode ?? "—",
              },
              {
                label: "Coordinates",
                value: record.gpsLat != null && record.gpsLng != null
                  ? `${Math.abs(record.gpsLat).toFixed(4)}° ${record.gpsLat >= 0 ? "N" : "S"}, ${Math.abs(record.gpsLng).toFixed(4)}° ${record.gpsLng >= 0 ? "E" : "W"}${
                      record.gpsAccuracyM != null ? ` (±${record.gpsAccuracyM.toFixed(1)} m)` : ""
                    }`
                  : "—",
              },
              {
                label: "Height",
                value: record.heightCm != null ? `${record.heightCm.toFixed(1)} cm` : "—",
              },
              {
                label: "Captured",
                value: new Date(record.createdAt).toLocaleString(),
              },
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl bg-sprout p-4">
                <p className="text-xs text-moss">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-pine">{metric.value}</p>
              </div>
            ))}
          </div>

          {record.description && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Species notes</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{record.description}</p>
            </div>
          )}

          {record.morphology && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Morphology</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{record.morphology}</p>
            </div>
          )}

          {record.notes && (
            <div className="rounded-2xl border border-pine/10 bg-white p-5">
              <h2 className="font-semibold text-pine">Field notes</h2>
              <p className="mt-2 text-sm leading-7 text-moss">{record.notes}</p>
            </div>
          )}

          {officer && record.approvalStatus === "pending" && (
            <div className="rounded-2xl border border-chartreuse/60 bg-chartreuse/10 p-5">
              <h2 className="font-semibold text-pine">Review submission</h2>
              <p className="mt-1 text-sm text-moss">
                Approving marks this observation as verified; rejecting flags
                it for follow-up by the botanist.
              </p>
              <div className="mt-4">
                <ApproveRejectButtons recordId={record.id} />
              </div>
            </div>
          )}

          {record.reviewedAt && (
            <div className="flex items-center justify-between rounded-2xl bg-sprout px-5 py-4 text-sm">
              <span className="text-moss">
                {record.approvalStatus === "approved" ? "Approved" : "Reviewed"} ·{" "}
                {new Date(record.reviewedAt).toLocaleString()}
              </span>
              <span className="font-semibold text-emerald">ID {record.id}</span>
            </div>
          )}

          <div className="flex items-center justify-between rounded-2xl bg-sand px-5 py-4 text-sm">
            <span className="text-moss">
              {record.syncedAt
                ? `Synced · ${new Date(record.syncedAt).toLocaleString()}`
                : "Synced from field device"}
            </span>
            {!record.reviewedAt && (
              <span className="font-semibold text-emerald">ID {record.id}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}