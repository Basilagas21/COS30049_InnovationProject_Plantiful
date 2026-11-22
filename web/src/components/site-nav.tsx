"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavAuth } from "@/components/nav-auth";

type NavLink = { href: string; label: string; group?: string };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ links, variant = "top" }: { links: NavLink[]; variant?: "top" | "sidebar" }) {
  const pathname = usePathname();
  if (variant === "sidebar") {
    const groups = [...new Set(links.map(link => link.group ?? ""))];
    return (
      <div className="admin-sidebar-body">
        <div className="admin-account"><NavAuth placement="sidebar" /></div>
        <nav aria-label="Main navigation" className="admin-nav">
          {groups.map(group => (
            <div key={group || "main"} className="admin-nav-group">
              {group && <p className="admin-nav-heading">{group}</p>}
              {links.filter(link => (link.group ?? "") === group).map(({ href, label }) => (
                <Link key={href} href={href} aria-current={isActive(pathname, href) ? "page" : undefined} className="admin-nav-link">{label}</Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    );
  }
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-3 max-sm:w-full max-sm:flex-auto">
    <nav aria-label="Main navigation" className="site-nav min-w-0">
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="site-nav-link">{label}</Link>;
      })}
    </nav>
    <NavAuth />
    </div>
  );
}
