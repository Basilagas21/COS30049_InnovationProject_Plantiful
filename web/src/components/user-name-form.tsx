"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateUserName } from "@/app/users/actions";

type Props = {
  userId: string;
  name: string;
};

export function UserNameForm({ userId, name }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = `user-name-${userId}`;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateUserName(userId, value);
      if (!result.ok) {
        setError(result.error ?? "Could not update the name.");
        return;
      }
      if (result.name) setValue(result.name);
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-pine">{name}</span>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setError(null);
            setEditing(true);
          }}
          className="min-h-11 rounded-full border border-pine/15 px-2.5 py-1 text-xs font-semibold text-emerald transition-colors hover:border-emerald sm:min-h-0"
          aria-label={`Edit name for ${name}`}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="flex max-w-xs flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        Name
      </label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={isPending}
          maxLength={80}
          className="h-8 min-h-11 w-full rounded-full border border-pine/15 bg-white px-3 text-sm text-pine outline-none transition-colors focus:border-emerald sm:min-h-0"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 rounded-full bg-emerald px-3 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-60 sm:min-h-0"
        >
          Save
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setEditing(false);
            setValue(name);
            setError(null);
          }}
          className="min-h-11 rounded-full border border-pine/15 px-3 py-1.5 text-xs font-semibold text-moss transition-colors hover:border-pine/30 disabled:opacity-60 sm:min-h-0"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
