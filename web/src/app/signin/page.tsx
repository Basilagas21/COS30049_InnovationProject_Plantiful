import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-3xl border border-pine/10 bg-white p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald text-sprout">
          ✿
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-pine">
          Sign in to Plantiful
        </h1>
        <p className="mt-1 text-sm text-moss">
          Conservation officer and admin access.
        </p>

        <form className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Email</span>
            <input
              type="email"
              required
              placeholder="you@sfc.gov.my"
              className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pine">Password</span>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="h-11 rounded-xl border border-pine/15 bg-cream px-4 text-sm outline-none transition-colors focus:border-emerald"
            />
          </label>
          <button
            type="submit"
            className="mt-2 h-12 rounded-full bg-emerald font-semibold text-cream transition-colors hover:bg-pine"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-moss">
          Authentication via Supabase is coming soon. Until then this screen is a
          static placeholder.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-emerald hover:underline">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}