import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isOfficer, isAdmin } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { InteractionLogger } from "@/components/interaction-logger";
import { ThemeProvider } from "@/lib/theme-provider";
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
      <footer className="site-footer">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
          <div><p className="text-2xl font-semibold tracking-tight">A little closer to nature.</p><p className="mt-2 text-sm text-sprout/75">Plantiful · Niah National Park, Sarawak</p></div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/learn" className="text-sm font-semibold text-sprout/80 transition-colors hover:text-chartreuse">Learn and Q&amp;A</Link>
            <Link href="/explore" className="rounded-full bg-chartreuse px-6 py-3 text-sm font-semibold text-pine">Explore the plant guide ↗</Link>
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
