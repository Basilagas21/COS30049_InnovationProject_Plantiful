import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isOfficer } from "@/lib/auth";
import { NavAuth } from "@/components/nav-auth";
import { InteractionLogger } from "@/components/interaction-logger";
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
  const officer = await isOfficer();
  const navLinks = [
    { href: "/explore", label: "Explore" },
    { href: "/species", label: "Species" },
    { href: "/map", label: "Map" },
    { href: "/records", label: "Records" },
    { href: "/profile", label: "Profile" },
    ...(officer
      ? [
          { href: "/reports", label: "Reports" },
          { href: "/alerts", label: "Alerts" },
        ]
      : []),
  ];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-pine">
        <InteractionLogger />
        <header className="sticky top-0 z-10 border-b border-pine/10 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-pine">
              <Image
                src="/plantiful_logo.jpg"
                alt="Plantiful logo"
                width={858}
                height={620}
                className="h-9 w-auto object-contain"
                priority
              />
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-emerald"
                >
                  {link.label}
                </Link>
              ))}
              <NavAuth />
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-pine/10 bg-sand py-6">
          <div className="mx-auto w-full max-w-6xl px-6 text-sm text-moss">
            Plantiful · Niah National Park biodiversity assessment · COS30049 Group 7
          </div>
        </footer>
      </body>
    </html>
  );
}