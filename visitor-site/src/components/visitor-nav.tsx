"use client";

import { useState } from "react";
import Link from "next/link";

// "/#section" links jump to a section on the homepage (from any page);
// plain paths are their own dedicated pages.
const NAV_LINKS = [
  { href: "/#about-sfc", label: "About SFC" },
  { href: "/#why-plantiful", label: "Why Plantiful" },
  { href: "/species", label: "Species" },
  { href: "/inquiry", label: "Inquiry" },
  { href: "/#visiting", label: "Visiting" },
  { href: "/#faq", label: "FAQ" },
];

export function VisitorNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav aria-label="Page sections" className="relative">
      <ul className="hidden items-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm font-medium text-pine/80 transition-colors hover:text-emerald"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="visitor-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-pine/15 text-pine transition-colors md:hidden"
      >
        <span
          aria-hidden="true"
          className="inline-block text-lg leading-none transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          {open ? "✕" : "☰"}
        </span>
      </button>

      <ul
        id="visitor-mobile-nav"
        className={`absolute right-0 top-12 z-40 w-56 origin-top-right rounded-2xl border border-pine/10 bg-white p-2 shadow-lg transition-all duration-200 md:hidden ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-pine transition-colors hover:bg-sprout/60"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
