"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/learn", label: "Learn" },
  { href: "/species", label: "Species" },
  { href: "/map", label: "Map" },
] as const;

// Unlike a single-page scrollytelling site, this app is many separate
// routes, so the dot nav highlights whichever of these top-level pages
// the visitor is currently on rather than tracking scroll position.
export function FooterDotNav() {
  const pathname = usePathname();

  return (
    <nav className="footer-dot-nav" aria-label="Quick links">
      {SECTIONS.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className={`footer-dot ${pathname === section.href ? "is-active" : ""}`}
          aria-label={section.label}
          title={section.label}
        />
      ))}
    </nav>
  );
}
