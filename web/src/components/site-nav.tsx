"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/nav-auth";

export function SiteNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="site-nav">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="site-nav-link">{label}</Link>;
      })}
      <NavAuth />
    </nav>
  );
}
