"use client";

import { useEffect, useRef } from "react";
import { FooterNature } from "./footer-nature";

export function FooterNatureParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const moon = el.querySelector<HTMLElement>(".forest-night-moon");
    const back = el.querySelector<HTMLElement>(".forest-night-grass--back");
    const front = el.querySelector<HTMLElement>(".forest-night-grass--front");
    const target = { x: 0, y: 0, s: 0 };
    const current = { x: 0, y: 0, s: 0 };
    let raf = 0;

    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      current.s += (target.s - current.s) * 0.1;
      if (moon) moon.style.transform = `translate(${(current.x * 0.35).toFixed(2)}px, ${(current.y * 0.35 + current.s * 0.35).toFixed(2)}px)`;
      if (back) back.style.transform = `translate(${(current.x * 0.6).toFixed(2)}px, ${(current.s * 0.7).toFixed(2)}px)`;
      if (front) front.style.transform = `translate(${current.x.toFixed(2)}px, ${current.s.toFixed(2)}px)`;
      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05 || Math.abs(target.s - current.s) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        current.x = target.x;
        current.y = target.y;
        current.s = target.s;
        raf = 0;
      }
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 36;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 20;
      start();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      start();
    };
    // Scroll parallax: the layers drift at different rates as the footer passes
    // through the viewport, the foreground grass travelling furthest.
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      target.s = (p - 0.5) * 60;
      start();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (moon) moon.style.transform = "";
      if (back) back.style.transform = "";
      if (front) front.style.transform = "";
    };
  }, []);

  return (
    <div ref={ref} className="footer-nature-parallax">
      <FooterNature />
    </div>
  );
}