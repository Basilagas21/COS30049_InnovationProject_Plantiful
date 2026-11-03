"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const roles: Record<string, string> = { botanist: "Botanist", conservation_officer: "Conservation officer", admin: "Admin" };

export function NavAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const panelId = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const open = openedOn === pathname;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;
    let authChanged = false;
    supabase.auth.getUser().then(({ data }) => {
      if (active && !authChanged) { setUser(data.user); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authChanged = true;
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
        if (!session?.user) setOpenedOn(null);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      const { data } = await createClient().from("user_profiles").select("name, role").eq("user_id", userId).maybeSingle();
      if (active && data) setProfile({ id: userId, name: data.name, role: data.role });
    };
    void load().catch(() => { /* Auth metadata remains available as a fallback. */ });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpenedOn(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpenedOn(null); trigger.current?.focus(); }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setOpenedOn(null);
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally { setBusy(false); }
  }

  if (loading) return <span className="h-11 w-28 rounded-full bg-sprout" role="status" aria-label="Loading account" />;
  if (!user) return <Link href="/signin" className="inline-flex min-h-11 items-center rounded-full bg-emerald px-4 text-sm font-semibold text-cream">Sign in</Link>;

  const currentProfile = profile?.id === user.id ? profile : null;
  const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
  const name = currentProfile?.name?.trim() || (typeof metadataName === "string" && metadataName.trim()) || user.email?.split("@")[0] || "Your account";
  const avatarValue = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  const avatar = typeof avatarValue === "string" && /^https?:\/\//.test(avatarValue) ? avatarValue : null;
  const initials = name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
  const avatarContent = avatar && failedAvatar !== avatar
    // Account pictures may come from the user's authentication provider.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={avatar} alt="" referrerPolicy="no-referrer" onError={() => setFailedAvatar(avatar)} className="h-full w-full object-cover" />
    : initials;

  return (
    <div ref={container} className="relative shrink-0" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpenedOn(null);
    }}>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls={panelId} aria-label={`Account for ${name}`}
        onClick={() => setOpenedOn(open ? null : pathname)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-pine/15 bg-surface py-1 pl-1 pr-3 text-sm text-pine transition hover:bg-sprout">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sprout text-xs font-bold text-emerald">{avatarContent}</span>
        <span className="max-w-24 truncate font-semibold sm:max-w-36">{name}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {open && <section id={panelId} aria-label="Your account" className="absolute right-0 top-full z-50 mt-3 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-pine/15 bg-surface text-sm text-pine shadow-xl">
        <div className="border-b border-pine/10 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-moss">Your account</p>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sprout font-bold text-emerald">{avatarContent}</span>
            <div className="min-w-0"><p className="break-words font-semibold">{name}</p><p className="mt-1 break-all text-xs text-moss">{user.email}</p></div>
          </div>
          <span className="mt-3 inline-block rounded-full bg-sprout px-3 py-1 text-xs font-medium text-emerald">{currentProfile ? roles[currentProfile.role] ?? 'Signed in' : 'Signed in'}</span>
        </div>
        <div className="space-y-1 p-2">
          <Link href="/profile" onClick={() => setOpenedOn(null)} className="flex min-h-11 items-center justify-between rounded-xl px-3 hover:bg-sprout">Profile & settings <span aria-hidden="true">↗</span></Link>
          <button type="button" disabled={busy} onClick={handleSignOut} className="min-h-11 w-full rounded-xl px-3 text-left text-danger hover:bg-sand disabled:opacity-50">{busy ? 'Signing out…' : 'Sign out'}</button>
          {error && <p role="alert" className="px-3 pb-2 text-xs text-danger">{error}</p>}
        </div>
      </section>}
    </div>
  );
}
