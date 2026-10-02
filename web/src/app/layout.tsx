import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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

const navLinks = [
  { href: "/records", label: "Records" },
  { href: "/map", label: "Map" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-pine">
        <header className="sticky top-0 z-10 border-b border-pine/10 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold text-pine">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald text-sprout">
                ✿
              </span>
              Plantiful
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
              <Link
                href="/signin"
                className="rounded-full bg-emerald px-4 py-2 text-cream transition-colors hover:bg-pine"
              >
                Sign in
              </Link>
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