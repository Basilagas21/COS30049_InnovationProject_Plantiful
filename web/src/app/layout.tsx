import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, Martian_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { isOfficer, isAdmin } from "@/lib/auth";
import { SiteNav } from "@/components/site-nav";
import { IotAlertMenu } from "@/components/iot-alert-menu";
import { NavAuth } from "@/components/nav-auth";
import { InteractionLogger } from "@/components/interaction-logger";
import { SmoothScroll } from "@/components/home/smooth-scroll";
import { TiltInit } from "@/components/tilt-init";
import { FooterNatureParallax } from "@/components/home/footer-nature-parallax";
import { ThemeProvider } from "@/lib/theme-provider";
import "./globals.css";

// Runs at parse time, before the React bundle hydrates, so the frond is already
// centred and cursor-tracking on first paint (no hydration jump or delay).
const FROND_BOOTSTRAP = `(function () {
  var d = document;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wrap = null;
  function layout() {
    var canopy = d.querySelector(".home-canopy");
    wrap = d.querySelector(".home-frond-wrap");
    if (!canopy || !wrap) return;
    var z = Math.max(1, window.innerWidth / 1536);
    d.documentElement.style.setProperty("--hscale", z);
    if (window.innerWidth <= 640) { wrap.style.left = ""; return; }
    var copy = d.querySelector(".home-hero-copy");
    if (!copy || !copy.firstChild) return;
    var cr = canopy.getBoundingClientRect();
    var right = (copy.getBoundingClientRect().right - cr.left) / z;
    var center = (right + cr.width / z) / 2;
    wrap.style.left = center.toFixed(1) + "px";
    var chip = d.querySelector(".live-chip");
    if (chip) chip.style.left = (center + 112 - chip.offsetWidth / 2).toFixed(1) + "px";
  }
  var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
  function tick() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
    if (wrap) wrap.style.transform = "translate(" + cx.toFixed(2) + "px, " + cy.toFixed(2) + "px)";
    if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(tick);
    else { cx = tx; cy = ty; raf = 0; }
  }
  function start() { if (!raf) raf = requestAnimationFrame(tick); }
  d.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || reduce.matches) return;
    var t = e.target;
    var canopy = t && t.closest ? t.closest(".home-canopy") : null;
    if (!canopy) { if (tx || ty) { tx = 0; ty = 0; start(); } return; }
    wrap = d.querySelector(".home-frond-wrap");
    if (!wrap) return;
    var r = canopy.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 24;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 18;
    start();
  }, { passive: true });
  layout();
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(layout).catch(function () {});
  new MutationObserver(function () {
    var w = d.querySelector(".home-frond-wrap");
    var c = d.querySelector(".live-chip");
    if (w && (w !== wrap || !w.style.left || w.style.left === "0px")) layout();
    else if (c && !c.style.left) layout();
  }).observe(d.body, { childList: true, subtree: true });
})();`;

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "optional",
});

const publicSans = Public_Sans({
  variable: "--font-public",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "optional",
});

const martianMono = Martian_Mono({
  variable: "--font-martian",
  subsets: ["latin"],
  display: "optional",
});

export const metadata: Metadata = {
  title: "Plantiful",
  description: "Rapid biodiversity assessment knowledge system",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [officer, admin] = await Promise.all([isOfficer(), isAdmin()]);
  const navGroups = [
    { label: "Home", links: [{ href: "/", label: "Home" }] },
    {
      label: "Explore",
      links: [
        { href: "/explore", label: "Explore overview" },
        { href: "/species", label: "Species catalogue" },
        { href: "/map", label: "Species map" },
      ],
    },
    { label: "Learn", links: [{ href: "/learn", label: "Learn" }] },
    { label: "Records", links: [{ href: "/records", label: "Records" }] },
    ...(officer
      ? [
          {
            label: "Operations",
            links: [
              { href: "/approvals", label: "Approvals" },
              { href: "/reports", label: "Reports" },
              { href: "/admin/inquiries", label: "Inquiries" },
              ...(admin ? [{ href: "/users", label: "Users" }] : []),
            ],
          },
          {
            label: "Monitoring",
            links: [
              { href: "/alerts", label: "Monitoring dashboard" },
              { href: "/alerts#sensor-heading", label: "Latest sensor readings" },
              { href: "/alerts#alerts-heading", label: "Threat alert timeline" },
            ],
          },
        ]
      : []),
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
          <TiltInit />
          <div className="site-grain" aria-hidden="true" />
          <InteractionLogger />
          <a href="#main-content" className="skip-link">Skip to content</a>
          <header className="site-header">
            <div className="site-header-inner">
              <Link href="/" className="brand flex shrink-0 items-center gap-0 font-semibold text-pine" aria-label="Plantiful home">
                <Image
                  src="/plantiful_logo.png"
                  alt="Plantiful logo"
                  width={592}
                  height={421}
                  className="h-9 w-auto object-contain"
                  priority
                />
                <span className="brand-word text-xl tracking-tight" aria-hidden="true">
                  {"plantiful".split("").map((ch, i) => (
                    <span key={i} className="bl" style={{ "--li": i } as CSSProperties}>{ch}</span>
                  ))}
                  <span className="brand-dot text-emerald">.</span>
                </span>
              </Link>
              <SiteNav groups={navGroups} />
              <div className="header-account flex shrink-0 items-center justify-end">
                {officer && <IotAlertMenu />}
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
                    <p>Plantiful · A verified biodiversity catalogue for Niah National Park, Sarawak.</p>
                  </div>
                  <nav className="footer-col" aria-label="Browse">
                    <h3>Browse</h3>
                    <Link href="/explore">Explore plants</Link>
                    <Link href="/learn">Learning guide</Link>
                    <Link href="/species">Species catalogue</Link>
                    <Link href="/map">Species map</Link>
                    <Link href="/records">Plant records</Link>
                  </nav>
                  <nav className="footer-col" aria-label="Workspace">
                    <h3>Workspace</h3>
                    <Link href="/signin">Sign in</Link>
                    <Link href="/register">Create your account</Link>
                    <Link href="/profile">Your profile</Link>
                  </nav>
                  <div className="footer-col">
                    <h3>Partners</h3>
                    <span>Sarawak Forestry Corporation</span>
                    <span>NeuonAI · Industry partner</span>
                    <span>Niah National Park, Sarawak</span>
                  </div>
                </div>
                <div className="footer-base">
                  <span>© 2026 Plantiful</span>
                </div>
              </div>
            </div>
            <div className="footer-nature-wrap">
              <FooterNatureParallax />
            </div>
          </footer>
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: FROND_BOOTSTRAP }} />
      </body>
    </html>
  );
}
