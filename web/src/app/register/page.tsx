"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || email.split("@")[0] } },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!data.session) {
      setNotice(
        "Account created. Check your inbox for a confirmation email, then sign in.",
      );
      return;
    }

    router.push("/records");
    router.refresh();
  }

  const renderEyeButton = () => (
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
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-pine/10 bg-white p-8">
        <Image
          src="/plantiful_logo.jpg"
          alt="Plantiful logo"
          width={858}
          height={620}
          className="mx-auto mt-0 w-44"
          priority
        />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-pine">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-moss">
          New botanists start here. Confirm your email before signing in.
        </p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald"
            />
          </label>
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
              {renderEyeButton()}
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Confirm password</span>
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
            disabled={loading}
            className="mt-2 h-12 rounded-full bg-emerald font-semibold text-cream transition-colors hover:bg-pine disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-moss">
          Already have an account?{" "}
          <Link href="/signin" className="font-semibold text-emerald hover:underline">
            Sign in
          </Link>
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-emerald hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}