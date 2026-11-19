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
}: {
  children: ReactNode;
  className?: string;
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

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
