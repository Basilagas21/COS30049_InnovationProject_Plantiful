import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PLANTIFUL_APP_URL } from "@/lib/config";
import { VisitorNav } from "@/components/visitor-nav";
import { TiltInit } from "@/components/tilt-init";
import { FooterDotNav } from "@/components/footer-dot-nav";
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
        {/* Renders nothing; wires up the sitewide pointer-tilt effect for
            any element marked data-tilt (see tilt-init.tsx). Mounted once
            here rather than per-page. */}
        <TiltInit />
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
              className="btn-pop shrink-0 rounded-full border border-pine/15 px-4 py-2 text-sm font-semibold text-pine transition-colors hover:bg-sprout/60"
            >
              <span className="hidden sm:inline">Open the knowledge system</span>
              <span className="sm:hidden">Open site</span> ↗
            </a>
          </div>
        </header>
        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
        <footer className="site-footer site-footer-expanded">
          <div className="mx-auto w-full max-w-6xl px-6">
            <div className="footer-top-row">
              <Link href="/#top" className="footer-top-btn">
                Back to top ↑
              </Link>
            </div>

            <div className="footer-columns">
              <div className="footer-col">
                <p className="footer-col-heading">Explore</p>
                <Link href="/species">Species catalogue</Link>
                <a href={`${PLANTIFUL_APP_URL}/map`}>Open the map ↗</a>
                <a href={PLANTIFUL_APP_URL}>Knowledge system ↗</a>
              </div>

              <div className="footer-col">
                <p className="footer-col-heading">About Plantiful</p>
                <Link href="/#about-sfc">About SFC</Link>
                <Link href="/#why-plantiful">Why Plantiful</Link>
                <Link href="/#visiting">Visiting Niah</Link>
                <Link href="/#faq">Common questions</Link>
              </div>

              <div className="footer-col">
                <p className="footer-col-heading">Get involved</p>
                <Link href="/inquiry">Volunteer as a field botanist</Link>
                <Link href="/inquiry">Student placements</Link>
                <Link href="/inquiry">Partnerships</Link>
                <Link href="/inquiry">Send us an inquiry</Link>
              </div>

              <div className="footer-col">
                <p className="footer-col-heading">More</p>
                <Link href="/species">Conservation status labels</Link>
              </div>
            </div>

            <div className="footer-side-nav">
              <FooterDotNav />
              <a
                href={PLANTIFUL_APP_URL}
                className="btn-pop btn-glow footer-pill-cta rounded-full bg-chartreuse px-6 py-3 text-sm font-semibold text-pine"
              >
                Explore ↗
              </a>
            </div>

            <div className="footer-tagline">
              <p className="footer-tagline-main">
                Niah&apos;s plants, verified by people who show up.
              </p>
              <p className="footer-tagline-sub">We survey. We verify. We share.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
