"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + slides a section into place the first time it scrolls into view.
 * Pure CSS does the animating (see .reveal / .reveal-visible in
 * globals.css); this just toggles one class via IntersectionObserver and
 * disconnects once triggered, so it never fires twice.
 *
 * Deliberately not used for above-the-fold content (the hero), since
 * that's already visible on load, so "revealing" it would just delay it.
 */
export function Reveal({
  children,
  className = "",
  spotlight = false,
}: {
  children: ReactNode;
  className?: string;
  /** Opt-in: also dims/highlights direct [data-active-card] children as
   *  they cross the viewport's vertical center, independent of the
   *  one-time reveal above (see the second effect below). */
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Always starts false on both server and client. Checking
  // `typeof IntersectionObserver` in the initializer looks tempting, but
  // Node (server render) and the browser (client render) disagree on it,
  // which produces a hydration mismatch that React won't patch up —
  // sections would render as already "visible" from the server and never
  // actually animate. Keeping this constant across server and client is
  // what hydration requires; the effect below (client-only) is the one
  // place allowed to look at the real environment.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      // No observer support (very old browser): show the content rather
      // than leaving it invisible forever. Deferred a tick so this is an
      // async callback, not a synchronous setState call inside the effect
      // body, matching how the real observer path below also only calls
      // setVisible from its own async callback.
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Separate, independent observer: a persistent "spotlight" that keeps
  // dimming/brightening cards as the visitor scrolls past, rather than a
  // one-time reveal. Opt-in so the many sections that don't use it pay
  // nothing extra for it.
  useEffect(() => {
    if (!spotlight) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const cards = Array.from(node.querySelectorAll<HTMLElement>("[data-active-card]"));
    if (cards.length === 0) return;

    const spotlightObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-spotlight-active", entry.isIntersecting);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    cards.forEach((card) => spotlightObserver.observe(card));
    return () => spotlightObserver.disconnect();
  }, [spotlight]);

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
