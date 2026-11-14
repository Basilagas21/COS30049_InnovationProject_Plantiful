"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      anchors: false,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      event.preventDefault();
      const header = document.querySelector(".site-header");
      const offset = header ? header.getBoundingClientRect().height + 16 : 0;
      lenis.scrollTo(el, { offset: -offset });
      history.pushState(null, "", `#${id}`);
    };
    document.addEventListener("click", onClick);

    const onReduceChange = () => {
      if (reduce.matches) lenis.destroy();
    };
    reduce.addEventListener("change", onReduceChange);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      reduce.removeEventListener("change", onReduceChange);
      lenis.destroy();
    };
  }, []);

  return null;
}
