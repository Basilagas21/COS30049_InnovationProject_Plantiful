"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up from 0 to `value` once, on mount, with an ease-out curve.
 * Used for headline stats (published species, verified observations) so a
 * number lands with a little weight instead of just appearing, the way a
 * data-forward marketing site treats its own figures.
 *
 * Starts already at the final value for the server-rendered markup (and
 * if JS never runs), so there's no flash of "0" before hydration, and
 * skips the animation outright for prefers-reduced-motion.
 */
export function Counter({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // display already starts at `value` (see useState above), so there is
    // nothing to animate: leave it as-is rather than setting state we
    // already have.
    if (reduceMotion || value <= 0) {
      return;
    }

    // Kick off from the next frame rather than setting state synchronously
    // here: the first tick() call (progress ~0) already renders the
    // counter at effectively 0, so there's no need for a separate
    // setDisplay(0) in the effect body itself.
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{display}</span>;
}
