"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Status = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add the env vars listed in web/README.md.");
      setStatus("invalid");
      return;
    }

    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        setStatus("invalid");
        return;
      }
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }

    await supabase.auth.signOut({ scope: "local" });
    setBusy(false);
    setPassword("");
    setConfirm("");
    setStatus("done");
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <p className="eyebrow text-chartreuse">Plantiful / Account recovery</p>
        <h2>Start<br />fresh.</h2>
        <p>Choose a new password for your account.<br />Then sign in and continue your work.</p>
      </aside>
      <div className="rounded-3xl border border-pine/10 bg-white p-8">
        <Image
          src="/plantiful_logo.png"
          alt="Plantiful logo"
          width={592}
          height={421}
          className="h-14 w-auto object-contain"
        />

        {status === "checking" && (
          <p className="mt-6 text-sm text-moss">Checking your reset link…</p>
        )}

        {status === "invalid" && (
          <>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
              Reset link unavailable
            </h1>
            <p className="mt-1 text-sm text-moss">
              This link is invalid or has expired. Request a new email to continue.
            </p>
            {error && (
              <p className="mt-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </p>
            )}
            <Link href="/forgot-password" className="btn btn--primary mt-6 h-12 w-full">
              Request a new link
            </Link>
          </>
        )}

        {status === "done" && (
          <>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
              Password updated
            </h1>
            <p className="mt-1 text-sm text-moss">
              Your new password is ready. Sign in to continue.
            </p>
            <Link href="/signin" className="btn btn--primary mt-6 h-12 w-full">
              Go to sign in
            </Link>
          </>
        )}

        {status === "ready" && (
          <>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
              Choose a new password
            </h1>
            <p className="mt-1 text-sm text-moss">
              Use at least 6 characters. You will sign in again after saving.
            </p>

            <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-pine">New password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xl border border-pine/15 bg-cream pr-12 pl-4 text-sm outline-none transition-colors focus:border-emerald"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-0 right-0 flex h-11 w-11 items-center justify-center text-moss transition-colors hover:text-pine"
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-pine">Confirm new password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald"
                />
              </label>

              {error && (
                <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn btn--primary mt-2 h-12 w-full"
              >
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          </>
        )}

        <Link href="/signin" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-emerald hover:underline sm:min-h-0">
          <Arrow direction="left" size="1em" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
