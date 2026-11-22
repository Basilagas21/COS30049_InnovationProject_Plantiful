"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryStatus } from "@/app/admin/inquiries/actions";
import type { InquiryStatus } from "@/lib/inquiries";

type Props = {
  inquiryId: string;
  status: InquiryStatus;
};

export function InquiryStatusButtons({ inquiryId, status }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function update(next: InquiryStatus) {
    setError(null);
    startTransition(async () => {
      const result = await setInquiryStatus(inquiryId, next);
      if (!result.ok) {
        setError(result.error ?? "Could not update this inquiry.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex shrink-0 items-center gap-2">
        {status !== "read" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => update("read")}
            className="min-h-11 rounded-full bg-emerald px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50 sm:min-h-0"
          >
            {isPending ? "Updating…" : "Mark read"}
          </button>
        )}
        {status !== "archived" ? (
          <button
            type="button"
            disabled={isPending}
            onClick={() => update("archived")}
            className="min-h-11 rounded-full border border-pine/20 bg-white px-4 py-2 text-xs font-semibold text-moss transition-colors hover:bg-sand disabled:opacity-50 sm:min-h-0"
          >
            {isPending ? "Updating…" : "Archive"}
          </button>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => update("new")}
            className="min-h-11 rounded-full border border-pine/20 bg-white px-4 py-2 text-xs font-semibold text-moss transition-colors hover:bg-sand disabled:opacity-50 sm:min-h-0"
          >
            {isPending ? "Updating…" : "Restore"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
