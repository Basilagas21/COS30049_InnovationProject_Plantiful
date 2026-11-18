"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function SiteNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const dense = links.length > 7;
  const navRef = useRef<HTMLElement>(null);

  // On narrow screens the nav scrolls horizontally; keep the active tab in
  // view so it never lands clipped off the edge.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = active.getBoundingClientRect();
    const linkLeft = linkRect.left - navRect.left + nav.scrollLeft;
    const target = linkLeft - (nav.clientWidth - linkRect.width) / 2;
    nav.scrollTo({ left: Math.max(0, target), behavior: "auto" });
  }, [pathname]);

  return (
    <nav ref={navRef} aria-label="Main navigation" className={`site-nav min-w-0${dense ? " site-nav--dense" : ""}`}>
      {links.map(({ href, label }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="site-nav-link">{label}</Link>;
      })}
    </nav>
  );
}
