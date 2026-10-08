"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add the env vars listed in web/README.md.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // Officers and admins start at their approval queue; everyone else at records.
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .maybeSingle();
    const role = profile?.role;
    router.push(
      role === "conservation_officer" || role === "admin"
        ? "/approvals"
        : "/records",
    );
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-pine/10 bg-white p-8">
        <Image
          src="/plantiful_logo.png"
          alt="Plantiful logo"
          width={592}
          height={421}
          className="h-14 w-auto object-contain"
        />
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
          Sign in to Plantiful
        </h1>
        <p className="mt-1 text-sm text-moss">
          Conservation officer and admin access.
        </p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@sfc.gov.my"
              className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Password</span>
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

          {error && (
            <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-12 rounded-full bg-emerald font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-moss">
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