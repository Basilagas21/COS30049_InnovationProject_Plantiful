"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/nav-auth";

export function SiteNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-3 max-sm:w-full max-sm:flex-auto">
    <nav aria-label="Main navigation" className="site-nav min-w-0">
      {links.map(({ href, label }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname === href || pathname.startsWith(`${href}/`);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="site-nav-link">{label}</Link>;
      })}
    </nav>
    <NavAuth />
    </div>
  );
}
