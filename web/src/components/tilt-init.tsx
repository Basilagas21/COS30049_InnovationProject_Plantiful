"use client";

import { useEffect } from "react";

/**
 * Pointer-tracking 3D tilt effect for any element marked `data-tilt`.
 * Mounted once in the root layout and uses event delegation (listeners on
 * `document`, not per-card) so adding the effect anywhere else later is
 * just adding the attribute — no new component, no new dependency.
 *
 * Writes --tilt-x / --tilt-y custom properties that globals.css turns
 * into a `perspective(...) rotateX/rotateY(...)` transform, so it never
 * fights with a hover/scroll-spotlight transform set elsewhere: either
 * put `data-tilt` on its own nested wrapper, or don't combine it with
 * another transform-animating class.
 */
export function TiltInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    function reset(target: HTMLElement) {
      target.style.setProperty("--tilt-x", "0deg");
      target.style.setProperty("--tilt-y", "0deg");
    }

    function handleMove(e: PointerEvent) {
      const target = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-tilt]");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      target.style.setProperty("--tilt-y", `${(px * 12).toFixed(2)}deg`);
      target.style.setProperty("--tilt-x", `${(-py * 12).toFixed(2)}deg`);
    }

    function handleOut(e: PointerEvent) {
      const target = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-tilt]");
      if (!target) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related && target.contains(related)) return;
      reset(target);
    }

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerout", handleOut);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerout", handleOut);
    };
  }, []);

  return null;
}
