"use client";

import { useEffect } from "react";

export function TiltInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let target: HTMLElement | null = null;
    let goalX = 0;
    let goalY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;

    function write() {
      if (!target) return;
      target.style.setProperty("--tilt-x", `${curX.toFixed(3)}deg`);
      target.style.setProperty("--tilt-y", `${curY.toFixed(3)}deg`);
    }

    function frame() {
      curX += (goalX - curX) * 0.2;
      curY += (goalY - curY) * 0.2;
      const settled = Math.abs(goalX - curX) < 0.02 && Math.abs(goalY - curY) < 0.02;
      if (settled) {
        curX = goalX;
        curY = goalY;
      }
      write();
      if (settled) {
        raf = 0;
        if (goalX === 0 && goalY === 0) target = null;
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function handleMove(e: PointerEvent) {
      const el = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-tilt]");
      if (!el) return;
      if (el !== target) {
        if (target) {
          target.style.setProperty("--tilt-x", "0deg");
          target.style.setProperty("--tilt-y", "0deg");
        }
        target = el;
        curX = 0;
        curY = 0;
      }
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      goalY = px * 12;
      goalX = -py * 12;
      start();
    }

    function handleOut(e: PointerEvent) {
      const el = (e.target as HTMLElement)?.closest?.<HTMLElement>("[data-tilt]");
      if (!el || el !== target) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related && el.contains(related)) return;
      goalX = 0;
      goalY = 0;
      start();
    }

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerout", handleOut);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerout", handleOut);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
