"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInquiryStatus } from "@/app/admin/inquiries/actions";
import type { InquiryStatus } from "@/lib/inquiries";

const PRIMARY_CLASS =
  "min-h-11 rounded-full bg-emerald px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50 sm:min-h-0";
const QUIET_CLASS =
  "min-h-11 rounded-full border border-pine/20 bg-white px-4 py-2 text-xs font-semibold text-moss transition-colors hover:bg-sand disabled:opacity-50 sm:min-h-0";

function useStatusUpdate(inquiryId: string) {
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

  return { update, isPending, error };
}

type ArchiveButtonProps = {
  inquiryId: string;
};

export function InquiryArchiveButton({ inquiryId }: ArchiveButtonProps) {
  const { update, isPending, error } = useStatusUpdate(inquiryId);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        aria-label="Archive inquiry"
        title="Hides this inquiry from Active. You can restore it from Archived."
        onClick={(event) => {
          event.stopPropagation();
          update("archived");
        }}
        className={QUIET_CLASS}
      >
        {isPending ? "Updating…" : "Archive"}
      </button>
      {error && (
        <p role="alert" className="text-right text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type StatusButtonsProps = {
  inquiryId: string;
  status: InquiryStatus;
};

export function InquiryStatusButtons({ inquiryId, status }: StatusButtonsProps) {
  const { update, isPending, error } = useStatusUpdate(inquiryId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "new" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => update("read")}
          className={PRIMARY_CLASS}
        >
          {isPending ? "Updating…" : "Mark read"}
        </button>
      )}
      {status !== "archived" ? (
        <button
          type="button"
          disabled={isPending}
          title="Hides this inquiry from Active. You can restore it from Archived."
          onClick={() => update("archived")}
          className={QUIET_CLASS}
        >
          {isPending ? "Updating…" : "Archive"}
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => update("new")}
          className={QUIET_CLASS}
        >
          {isPending ? "Updating…" : "Restore"}
        </button>
      )}
      {error && (
        <p role="alert" className="w-full text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
