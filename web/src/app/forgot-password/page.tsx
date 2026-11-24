"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "@/components/arrow";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error") === "link") {
      setError("That reset link is invalid or has expired. Request a new one.");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add the env vars listed in web/README.md.");
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    setNotice(
      "If that email has a Plantiful account, a reset link is on the way. Check your inbox and spam folder.",
    );
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <p className="eyebrow text-chartreuse">Plantiful / Account recovery</p>
        <h2>Find your<br />way back.</h2>
        <p>We will send a secure link to your email.<br />Choose a new password and return to the field.</p>
      </aside>
      <div className="rounded-3xl border border-pine/10 bg-white p-8">
        <Image
          src="/plantiful_logo.png"
          alt="Plantiful logo"
          width={592}
          height={421}
          className="h-14 w-auto object-contain"
        />
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-moss">
          Enter the email linked to your Plantiful account.
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
            className="btn btn--primary mt-2 h-12 w-full"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-moss">
          Remembered it?{" "}
          <Link href="/signin" className="font-semibold text-emerald hover:underline">
            Back to sign in
          </Link>
        </p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-emerald hover:underline sm:min-h-0">
          <Arrow direction="left" size="1em" /> Back to home
        </Link>
      </div>
    </div>
  );
}
