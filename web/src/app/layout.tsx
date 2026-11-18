import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, Martian_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isOfficer, isAdmin } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { NavAuth } from "@/components/nav-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { InteractionLogger } from "@/components/interaction-logger";
import { SmoothScroll } from "@/components/home/smooth-scroll";
import { FooterNature } from "@/components/home/footer-nature";
import { ThemeProvider } from "@/lib/theme-provider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const martianMono = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  display: "swap",
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
    { href: "/learn", label: "Learn" },
    { href: "/species", label: "Species" },
    { href: "/map", label: "Map" },
    { href: "/records", label: "Records" },
    ...(officer
      ? [
          { href: "/approvals", label: "Approvals" },
          { href: "/reports", label: "Reports" },
          { href: "/alerts", label: "Monitoring" },
        ]
      : []),
    ...(admin ? [{ href: "/users", label: "Users" }] : []),
  ];

  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${bricolage.variable} ${publicSans.variable} ${martianMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("plantiful.theme")||"system";var d=t===\"dark\"||(t===\"system\"&&window.matchMedia(\"(prefers-color-scheme: dark)\").matches);document.documentElement.setAttribute(\"data-theme\",d?\"dark\":\"light\");document.documentElement.style.colorScheme=d?\"dark\":\"light\"}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("js-home")`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-cream text-pine">
        <ThemeProvider>
          <SmoothScroll />
          <div className="site-grain" aria-hidden="true" />
          <InteractionLogger />
          <a href="#main-content" className="skip-link">Skip to content</a>
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand flex shrink-0 items-center gap-2 font-semibold text-pine" aria-label="Plantiful home">
                <Image
                  src="/plantiful_logo.png"
                  alt="Plantiful logo"
                  width={592}
                  height={421}
                  className="-my-2 h-12 w-auto object-contain sm:h-24"
                  priority
                />
                <span className="brand-word text-xl tracking-tight sm:text-3xl" aria-hidden="true">
                  {"plantiful".split("").map((ch, i) => (
                    <span key={i} className="bl" style={{ "--li": i } as CSSProperties}>{ch}</span>
                  ))}
                  <span className="brand-dot text-emerald">.</span>
                </span>
              </Link>
              <SiteNav links={navLinks} />
              <div className="header-account flex shrink-0 items-center justify-end">
                <ThemeToggle />
                <NavAuth />
              </div>
            </div>
          </header>
          <main id="main-content" className="site-content flex flex-1 flex-col">{children}</main>
          <footer className="site-footer site-footer--full">
            <div className="footer-top">
              <div className="mx-auto w-full max-w-6xl px-6">
                <div className="footer-grid">
                  <div className="footer-brand">
                    <p className="footer-statement text-2xl font-semibold tracking-tight">A little closer to nature.</p>
                    <p>Plantiful · a verified biodiversity catalogue for Niah National Park, Sarawak.</p>
                  </div>
                  <nav className="footer-col" aria-label="Browse">
                    <h3>Browse</h3>
                    <Link href="/explore">Plant guide</Link>
                    <Link href="/learn">Learning guide</Link>
                    <Link href="/map">Species map</Link>
                    <Link href="/records">Field records</Link>
                  </nav>
                  <nav className="footer-col" aria-label="Workspace">
                    <h3>Workspace</h3>
                    <Link href="/signin">Sign in</Link>
                    <Link href="/register">Create an account</Link>
                    <Link href="/profile">Your profile</Link>
                  </nav>
                  <div className="footer-col">
                    <h3>Partners</h3>
                    <span>Sarawak Forestry Corporation</span>
                    <span>NeuonAI · industry partner</span>
                    <span>Niah National Park, Sarawak</span>
                  </div>
                </div>
                <div className="footer-base">
                  <span>© 2026 Plantiful · COS30049 Innovation Project</span>
                  <span>Every public record is reviewed before publication.</span>
                </div>
              </div>
            </div>
            <div className="footer-nature-wrap">
              <FooterNature />
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
