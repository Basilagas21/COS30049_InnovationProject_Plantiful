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
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/species", label: "Species" },
    { href: "/map", label: "Map" },
    { href: "/records", label: "Records" },
    { href: "/profile", label: "Profile" },
    ...(officer
      ? [
          { href: "/approvals", label: "Approvals" },
          { href: "/reports", label: "Reports" },
          { href: "/alerts", label: "Alerts" },
        ]
      : []),
    ...(admin ? [{ href: "/users", label: "Users" }] : []),
  ];

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
          <header className="site-header">
            <div className="site-header-inner">
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
              <SiteNav links={navLinks} />
            </div>
          </header>
          <main id="main-content" className="site-content flex flex-1 flex-col">{children}</main>
          <footer className="site-footer">
            <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-6 px-6">
              <div><p className="text-2xl font-semibold tracking-tight">A little closer to nature.</p><p className="mt-2 text-sm text-sprout/75">Plantiful · Niah National Park, Sarawak</p></div>
              <Link href="/explore" className="rounded-full bg-chartreuse px-6 py-3 text-sm font-semibold text-pine">Explore the plant guide ↗</Link>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
