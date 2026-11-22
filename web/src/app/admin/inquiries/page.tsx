import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { fetchInquiries } from "@/lib/inquiries";
import { InquiryStatusButtons } from "@/components/inquiry-status-buttons";

const STATUS_BADGE: Record<string, string> = {
  new: "bg-chartreuse text-pine",
  read: "bg-sprout text-emerald",
  archived: "bg-sand text-moss",
};

export default async function AdminInquiriesPage() {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "conservation_officer" && role !== "admin") redirect("/records");

  const { inquiries, error } = await fetchInquiries();
  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading-accent text-3xl font-bold tracking-tight sm:text-4xl">
            Inquiries
          </h1>
          <p className="mt-2 text-moss">
            Contact-form submissions from the public visitor site&apos;s
            &ldquo;/inquiry&rdquo; page — questions, volunteering, student
            placements, and partnerships.
          </p>
        </div>
        <span className="rounded-full bg-sprout px-4 py-1.5 text-sm font-semibold text-emerald">
          {newCount} new
        </span>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-danger/30 bg-white px-5 py-4 text-sm text-danger">
          Could not load inquiries: {error}
        </div>
      )}

      {!error && inquiries.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-pine">No inquiries yet</p>
          <p className="mt-1 text-sm text-moss">
            Submissions from the visitor site&apos;s inquiry form will appear
            here as soon as someone sends one.
          </p>
        </div>
      )}

      {inquiries.length > 0 && (
        <ul className="mt-8 space-y-4">
          {inquiries.map((inquiry) => (
            <li
              key={inquiry.id}
              className="rounded-2xl border border-pine/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-pine">{inquiry.subject}</p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[inquiry.status] ?? "bg-sand text-moss"
                      }`}
                    >
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-moss">
                    {inquiry.name} ·{" "}
                    <a
                      href={`mailto:${inquiry.email}`}
                      className="hover:text-emerald"
                    >
                      {inquiry.email}
                    </a>
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-moss">
                    {inquiry.message}
                  </p>
                  <p className="mt-3 text-xs text-moss/70">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </p>
                </div>
                <InquiryStatusButtons inquiryId={inquiry.id} status={inquiry.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
