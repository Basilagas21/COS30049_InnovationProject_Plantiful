import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/auth";
import { fetchInquiries, INQUIRIES_PAGE_SIZE } from "@/lib/inquiries";
import { InquiryInbox } from "@/components/inquiry-inbox";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildInquiriesHref(page: number): string {
  return page > 1 ? `/admin/inquiries?page=${page}` : "/admin/inquiries";
}

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await getCurrentRole();
  if (!role) redirect("/signin");
  if (role !== "conservation_officer" && role !== "admin") redirect("/records");

  const params = await searchParams;
  const requestedPage = parsePage(firstValue(params.page));
  const { inquiries, total, newCount, error } = await fetchInquiries({
    page: requestedPage,
  });
  const totalPages = Math.max(1, Math.ceil(total / INQUIRIES_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const showingFrom = total === 0 ? 0 : (page - 1) * INQUIRIES_PAGE_SIZE + 1;
  const showingTo = Math.min(page * INQUIRIES_PAGE_SIZE, total);

  return (
    <div className="mx-auto w-full max-w-[90rem] flex-1 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald">Public contact</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-pine sm:text-4xl">
            Inquiries
          </h1>
          <p className="mt-2 max-w-2xl text-moss">
            Questions, volunteering offers, student placements and partnership
            requests sent from the visitor site. New messages appear first.
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

      {!error && total === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-pine/15 bg-sand/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-pine">No inquiries yet</p>
          <p className="mt-1 text-sm text-moss">
            Submissions from the visitor site&apos;s inquiry form will appear
            here as soon as someone sends one.
          </p>
        </div>
      )}

      {!error && total > 0 && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-moss">
            <p>
              Showing <span className="font-semibold text-pine">{showingFrom}</span>
              {" to "}
              <span className="font-semibold text-pine">{showingTo}</span> of{" "}
              <span className="font-semibold text-pine">{total}</span> inquiries
            </p>
            <p className="font-mono text-xs">
              Page {page} of {totalPages}
            </p>
          </div>

          <InquiryInbox inquiries={inquiries} />

          {totalPages > 1 && (
            <nav
              aria-label="Inquiries pagination"
              className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-pine/10 bg-white px-4 py-3 text-sm"
            >
              {page > 1 ? (
                <Link
                  href={buildInquiriesHref(page - 1)}
                  className="btn btn--quiet min-h-11"
                  scroll={false}
                >
                  Previous
                </Link>
              ) : (
                <span className="btn btn--quiet pointer-events-none min-h-11 opacity-40">
                  Previous
                </span>
              )}

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (number) => (
                    <Link
                      key={number}
                      href={buildInquiriesHref(number)}
                      aria-current={number === page ? "page" : undefined}
                      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 font-semibold transition-colors ${
                        number === page
                          ? "bg-pine text-cream"
                          : "text-moss hover:bg-sprout hover:text-emerald"
                      }`}
                      scroll={false}
                    >
                      {number}
                    </Link>
                  ),
                )}
              </div>

              {page < totalPages ? (
                <Link
                  href={buildInquiriesHref(page + 1)}
                  className="btn btn--quiet min-h-11"
                  scroll={false}
                >
                  Next
                </Link>
              ) : (
                <span className="btn btn--quiet pointer-events-none min-h-11 opacity-40">
                  Next
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
