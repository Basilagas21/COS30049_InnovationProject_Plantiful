"use client";

import Link from "next/link";

export default function RecordsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-pine">
        Something went wrong
      </h1>
      {/* Production builds hide server error messages, so show a fixed hint. */}
      <p className="mt-3 text-sm text-danger">
        Could not load this record. Check the connection to the database and
        try again.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-moss">Error reference: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine"
        >
          Try again
        </button>
        <Link
          href="/records"
          className="rounded-full border border-pine/20 px-5 py-2.5 text-sm font-semibold text-pine transition-colors hover:bg-sprout"
        >
          Back to records
        </Link>
      </div>
    </div>
  );
}
