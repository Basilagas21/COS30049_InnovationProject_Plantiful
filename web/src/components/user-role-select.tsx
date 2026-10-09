"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/users/actions";
import type { ManagedRole } from "@/app/users/roles";

type Props = {
  userId: string;
  role: ManagedRole;
  isSelf: boolean;
};

const ROLE_LABELS: Record<ManagedRole, string> = {
  botanist: "Botanist",
  conservation_officer: "Officer",
  admin: "Admin",
};

const ORDER: ManagedRole[] = ["botanist", "conservation_officer", "admin"];

export function UserRoleSelect({ userId, role, isSelf }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [current, setCurrent] = useState<ManagedRole>(role);
  const [error, setError] = useState<string | null>(null);

  function change(next: ManagedRole) {
    if (next === current || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await setUserRole(userId, next);
      if (!result.ok) {
        setError(result.error ?? "Could not update the role.");
        return;
      }
      setCurrent(next);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="inline-flex rounded-full border border-pine/15 bg-white p-1">
        {ORDER.map((candidate) => (
          <button
            key={candidate}
            type="button"
            disabled={isPending || (isSelf && candidate !== current)}
            onClick={() => change(candidate)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
              candidate === current
                ? "bg-emerald text-cream"
                : "text-moss hover:text-pine"
            }`}
          >
            {ROLE_LABELS[candidate]}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
