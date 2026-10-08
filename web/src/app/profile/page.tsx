"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { UserRole } from "@/lib/auth";

const roleLabels: Record<UserRole, string> = {
  botanist: "Botanist",
  conservation_officer: "Conservation officer",
  admin: "Admin",
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
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
          <Image
            src="/plantiful_logo.png"
            alt="Plantiful logo"
            width={592}
            height={421}
            className="h-14 w-auto object-contain"
          />
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

        <Link
          href="/profile/change-password"
          className="mt-5 flex items-center justify-between rounded-2xl border border-pine/10 bg-cream p-4 text-sm transition-colors hover:border-emerald"
        >
          <span>
            <span className="block font-semibold text-pine">Change password</span>
            <span className="mt-0.5 block text-moss">
              Update the password for your account
            </span>
          </span>
          <span className="text-emerald">→</span>
        </Link>

        <div className="mt-6 border-t border-pine/10 pt-6">
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