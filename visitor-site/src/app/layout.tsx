import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PLANTIFUL_APP_URL } from "@/lib/config";
import { VisitorNav } from "@/components/visitor-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plantiful | Visit Niah National Park",
  description:
    "Plantiful is a public biodiversity initiative with Sarawak Forestry Corporation (SFC) at Niah National Park. Learn about the park, meet the project, and get involved. No account needed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-cream text-pine">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="site-header">
          <div className="site-header-inner">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-1 font-semibold text-pine"
              aria-label="Plantiful home"
            >
              <Image
                src="/plantiful_logo.png"
                alt="Plantiful logo"
                width={592}
                height={421}
                className="h-9 w-auto object-contain"
                priority
              />
              <span className="text-xl tracking-tight">
                plantiful<span className="text-emerald">.</span>
              </span>
            </Link>
            <div className="flex justify-center">
              <VisitorNav />
            </div>
            {/* Public visitor site, intentionally no sign-in / account nav here.
                This is a separate app from the main Plantiful system. */}
            <a
              href={PLANTIFUL_APP_URL}
              className="shrink-0 rounded-full border border-pine/15 px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-sprout/60"
            >
              <span className="hidden sm:inline">Open the knowledge system</span>
              <span className="sm:hidden">Open site</span> ↗
            </a>
          </div>
        </header>
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <footer className="site-footer">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
            <div>
              <p className="text-2xl font-semibold tracking-tight">A little closer to nature.</p>
              <p className="mt-2 text-sm opacity-75">
                Plantiful · Niah National Park, Sarawak
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/#faq"
                className="text-sm font-semibold opacity-80 transition-colors hover:text-chartreuse hover:opacity-100"
              >
                Common questions
              </Link>
              <a
                href={PLANTIFUL_APP_URL}
                className="rounded-full bg-chartreuse px-6 py-3 text-sm font-semibold text-pine"
              >
                Open the knowledge system ↗
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
