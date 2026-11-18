"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function SiteNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const dense = links.length > 7;
  const navRef = useRef<HTMLElement>(null);
  const [more, setMore] = useState(false);

  // Show a right-edge fade only while there are tabs still to scroll to.
  const update = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    setMore(nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 4);
  }, []);

  // On narrow screens the nav scrolls horizontally; keep the active tab in
  // view so it never lands clipped off the edge.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      const navRect = nav.getBoundingClientRect();
      const linkRect = active.getBoundingClientRect();
      const linkLeft = linkRect.left - navRect.left + nav.scrollLeft;
      const target = linkLeft - (nav.clientWidth - linkRect.width) / 2;
      nav.scrollTo({ left: Math.max(0, target), behavior: "auto" });
    }
    update();
  }, [pathname, update]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      nav.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <div className={`site-nav-wrap${more ? " has-more" : ""}`}>
      <nav ref={navRef} aria-label="Main navigation" className={`site-nav min-w-0${dense ? " site-nav--dense" : ""}`}>
        {links.map(({ href, label }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="site-nav-link">{label}</Link>;
        })}
      </nav>
    </div>
  );
}
