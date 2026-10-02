"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth";

const roleLabels: Record<UserRole, string> = {
  botanist: "Botanist",
  conservation_officer: "Conservation officer",
  admin: "Admin",
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);

      if (data.user) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (active) setRole((profile?.role as UserRole | null) ?? null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user?.email ?? null);
      if (!session?.user) setRole(null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

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
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setPassword("");
    setConfirm("");
    setNotice("Password updated successfully.");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail(null);
    setRole(null);
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-pine/10 bg-white p-8 text-center text-sm text-moss">
          Loading profile…
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <div className="rounded-3xl border border-pine/10 bg-white p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald text-sprout">
            ✿
          </span>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
            Your profile
          </h1>
          <p className="mt-1 text-sm text-moss">
            Sign in to view your account and settings.
          </p>
          <Link
            href="/signin"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-emerald font-semibold text-cream transition-colors hover:bg-pine"
          >
            Sign in
          </Link>
          <p className="mt-3 text-center text-sm text-moss">
            New to Plantiful?{" "}
            <Link href="/register" className="font-semibold text-emerald hover:underline">
              Create an account
            </Link>
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-emerald hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-pine sm:text-4xl">
        Profile
      </h1>

      <div className="mt-8 flex items-center gap-4 rounded-3xl bg-sprout p-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald text-xl font-bold text-sprout">
          {email[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-pine">{email}</p>
          <p className="text-sm text-emerald">{role ? roleLabels[role] : "Signed in"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-pine/10 bg-white p-6">
        <h2 className="text-lg font-semibold text-pine">Settings</h2>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleChangePassword}>
          <p className="text-sm font-medium text-moss">Change password</p>
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
                className="absolute top-1/2 right-3 -translate-y-1/2 text-moss transition-colors hover:text-pine"
              >
                <svg
                  width="20"
                  height="20"
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
          {notice && (
            <p className="rounded-xl bg-sprout px-4 py-3 text-sm text-emerald">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-2 h-12 rounded-full bg-emerald font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-60"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="mt-8 border-t border-pine/10 pt-6">
          <p className="text-sm font-medium text-moss">Sign out</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-3 h-12 w-full rounded-full border border-danger text-danger transition-colors hover:bg-danger hover:text-cream"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}