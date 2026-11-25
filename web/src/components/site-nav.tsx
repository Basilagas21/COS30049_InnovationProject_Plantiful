"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type NavLink = { href: string; label: string };
export type NavGroup = { label: string; links: NavLink[] };

function isActive(pathname: string, href: string): boolean {
  const target = href.split("#")[0];
  if (target === "/") return pathname === "/";
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function SiteNav({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [more, setMore] = useState(false);
  const [menu, setMenu] = useState<{ label: string; path: string } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const dense = groups.length > 5;
  const openMenu = menu?.path === pathname ? menu.label : null;

  const update = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    setMore(nav.scrollWidth - nav.clientWidth - nav.scrollLeft > 4);
  }, []);

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

  useEffect(() => {
    if (!openMenu) return;
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setMenu(null);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const trigger = document.querySelector<HTMLElement>(
          `[data-nav-trigger][aria-expanded="true"]`,
        );
        setMenu(null);
        trigger?.focus();
      }
    };
    const close = () => setMenu(null);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenu]);

  function toggleMenu(label: string, trigger: HTMLButtonElement) {
    if (openMenu === label) {
      setMenu(null);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(248, Math.max(192, window.innerWidth - 16));
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8),
    );
    setMenuPosition({ left, top: rect.bottom + 8, width });
    setMenu({ label, path: pathname });
  }

  const activeGroup = groups.find(
    (group) => group.label === openMenu && group.links.length > 1,
  );

  return (
    <div
      ref={containerRef}
      className={`site-nav-wrap${more ? " has-more" : ""}`}
    >
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className={`site-nav min-w-0${dense ? " site-nav--dense" : ""}`}
      >
        {groups.map((group) => {
          if (group.links.length === 1) {
            const link = group.links[0];
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={group.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="site-nav-link"
              >
                {link.label}
              </Link>
            );
          }

          const active = group.links.some((link) => isActive(pathname, link.href));
          const open = openMenu === group.label;
          return (
            <button
              key={group.label}
              type="button"
              data-nav-trigger
              aria-haspopup="true"
              aria-expanded={open}
              aria-controls={menuId}
              onClick={(event) => toggleMenu(group.label, event.currentTarget)}
              className={`site-nav-trigger${active ? " is-active" : ""}${open ? " is-open" : ""}`}
            >
              {group.label}
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                className={`site-nav-caret${open ? " is-open" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
          );
        })}
      </nav>

      {activeGroup && menuPosition && (
        <div
          id={menuId}
          className="site-nav-menu site-nav-menu--fixed"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
            width: menuPosition.width,
          }}
        >
          <p className="site-nav-menu-label">{activeGroup.label}</p>
          {activeGroup.links.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenu(null)}
                className="site-nav-menu-link"
              >
                {link.label}
                {active && <span aria-hidden="true">•</span>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
