"use client";

import { useState, useTransition } from "react";
import { resolveAlert } from "@/app/alerts/actions";

type Props = {
  alertId: string;
  onResolved: () => void;
};

// Two-step because resolution is final (#31): there is no reopen action.
export function ResolveAlertButton({ alertId, onResolved }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resolve() {
    setError(null);
    startTransition(async () => {
      const result = await resolveAlert(alertId);
      if (!result.ok) {
        setError(result.error ?? "Could not resolve the alert.");
        setConfirming(false);
        return;
      }
      setDone(true);
      onResolved();
    });
  }

  if (done) {
    return <p role="status" className="text-xs font-medium text-emerald">Marked resolved</p>;
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-moss">Resolve this alert? This can&apos;t be undone.</span>
          <button
            type="button"
            disabled={isPending}
            onClick={resolve}
            className="rounded-full bg-emerald px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-50"
          >
            {isPending ? "Resolving…" : "Confirm"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirming(false)}
            className="rounded-full border border-pine/15 bg-white px-4 py-2 text-xs font-medium text-pine disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-full border border-emerald/30 bg-white px-4 py-2 text-xs font-semibold text-emerald transition-colors hover:bg-emerald hover:text-cream"
        >
          Mark resolved
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
