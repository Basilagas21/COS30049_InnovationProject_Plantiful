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
    const target = { x: 0 };
    const current = { x: 0 };
    let raf = 0;

    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      if (moon) moon.style.transform = `translateX(${(current.x * 0.35).toFixed(2)}px)`;
      if (back) back.style.transform = `translateX(${(current.x * 0.6).toFixed(2)}px)`;
      if (front) front.style.transform = `translateX(${current.x.toFixed(2)}px)`;
      if (Math.abs(target.x - current.x) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        current.x = target.x;
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
      start();
    };
    const onLeave = () => {
      target.x = 0;
      start();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
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