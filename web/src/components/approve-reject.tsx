"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRecordApproval } from "@/app/records/actions";

type Props = {
  recordId: string;
};

export function ApproveRejectButtons({ recordId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    startTransition(async () => {
      await setRecordApproval(recordId, decision);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={isPending}
        onClick={() => decide("approved")}
        className="rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50"
      >
        {isPending ? "Updating…" : "Approve"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => decide("rejected")}
        className="rounded-full border border-danger/30 bg-white px-5 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-cream disabled:opacity-50"
      >
        {isPending ? "Updating…" : "Reject"}
      </button>
    </div>
  );
}