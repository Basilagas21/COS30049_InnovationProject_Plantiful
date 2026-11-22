import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isOfficer, isAdmin } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { InteractionLogger } from "@/components/interaction-logger";
import { ThemeProvider } from "@/lib/theme-provider";
import { TiltInit } from "@/components/tilt-init";
import { FooterDotNav } from "@/components/footer-dot-nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plantiful",
  description: "Rapid biodiversity assessment knowledge system",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [officer, admin] = await Promise.all([isOfficer(), isAdmin()]);
  const navLinks = [
    { href: "/", label: "Home", group: "Browse" },
    { href: "/explore", label: "Explore", group: "Browse" },
    { href: "/learn", label: "Learn", group: "Browse" },
    { href: "/species", label: "Species", group: "Browse" },
    { href: "/map", label: "Map", group: "Browse" },
    { href: "/records", label: "Records", group: "Browse" },
    ...(officer
      ? [
          { href: "/approvals", label: "Approvals", group: "Review" },
          { href: "/reports", label: "Reports", group: "Review" },
          { href: "/alerts", label: "Monitoring", group: "Review" },
          { href: "/admin/inquiries", label: "Inquiries", group: "Review" },
        ]
      : []),
    ...(admin
      ? [
          { href: "/users", label: "Users", group: "Admin" },
          { href: "/admin/settings", label: "Settings", group: "Admin" },
        ]
      : []),
  ];

  const logo = (
    <Link href="/" className="flex shrink-0 items-center gap-1 font-semibold text-pine" aria-label="Plantiful home">
      <Image
        src="/plantiful_logo.png"
        alt="Plantiful logo"
        width={592}
        height={421}
        className="h-9 w-auto object-contain"
        priority
      />
      <span className="text-xl tracking-tight">plantiful<span className="text-emerald">.</span></span>
    </Link>
  );

  const page = (
    <>
      <main id="main-content" className="site-content flex flex-1 flex-col">{children}</main>
      <footer className="site-footer site-footer-expanded">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="footer-top-row">
            <Link href="/" className="footer-top-btn">Back to top ↑</Link>
          </div>

          <div className="footer-columns">
            <div className="footer-col">
              <p className="footer-col-heading">Explore</p>
              <Link href="/explore">Explore the plant guide</Link>
              <Link href="/species">Species catalogue</Link>
              <Link href="/map">Species map</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-heading">Learn</p>
              <Link href="/learn">Visitor learning guide</Link>
              <Link href="/learn">Conservation status labels</Link>
              <Link href="/records">Field records</Link>
            </div>

            <div className="footer-col">
              <p className="footer-col-heading">Workspace</p>
              <Link href="/signin">Sign in</Link>
              <Link href="/register">Create an account</Link>
              <Link href="/">About Plantiful</Link>
            </div>
          </div>

          <div className="footer-side-nav">
            <FooterDotNav />
            <Link
              href="/explore"
              className="btn-glow footer-pill-cta rounded-full bg-chartreuse px-6 py-3 text-sm font-semibold text-pine"
            >
              Explore ↗
            </Link>
          </div>

          <div className="footer-tagline">
            <p className="footer-tagline-main">Every plant. A story worth preserving.</p>
            <p className="footer-tagline-sub">Discover. Connect. Conserve.</p>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("plantiful.theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light");document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-pine">
        <ThemeProvider>
          <TiltInit />
          <InteractionLogger />
          <a href="#main-content" className="skip-link">Skip to content</a>
          {admin ? (
            // Admins get a side bar, because they have the most links.
            <div className="admin-shell">
              <aside className="admin-sidebar">
                {logo}
                <SiteNav links={navLinks} variant="sidebar" />
              </aside>
              <div className="admin-page">{page}</div>
            </div>
          ) : (
            <>
              <header className="site-header">
                <div className="site-header-inner">
                  {logo}
                  <SiteNav links={navLinks} />
                </div>
              </header>
              {page}
            </>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
