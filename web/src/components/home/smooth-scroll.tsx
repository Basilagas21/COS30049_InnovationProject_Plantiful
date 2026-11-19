"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const chainTrack = document.querySelector<HTMLElement>(".home-chain-track");
    const chainStage = document.querySelector<HTMLElement>(".home-chain-stage");
    const journeyEl = document.querySelector<HTMLElement>(".home-journey");
    const closeEl = document.querySelector<HTMLElement>(".home-close");
    const footerEl = document.querySelector<HTMLElement>(".site-footer");
    const headerEl = document.querySelector<HTMLElement>(".site-header");
    // Each section plays over a fixed number of wheel notches so the last one
    // lands exactly on the section boundary instead of bleeding into the next.
    const CHAIN_STEPS = 13;
    const SECTION_STEPS = 6;
    // eslint-disable-next-line prefer-const -- instance is read by its own constructor callbacks below
    let lenis: Lenis;
    const seatedTop = (el: HTMLElement) => el.getBoundingClientRect().top + lenis.scroll - (headerEl?.offsetHeight ?? 0);
    const quantRegions = () => {
      if (window.innerWidth <= 640) return [];
      const regions: { start: number; end: number; steps: number }[] = [];
      if (chainTrack && chainStage) {
        const play = chainTrack.offsetHeight - chainStage.offsetHeight;
        if (play > 0) regions.push({ start: seatedTop(chainTrack), end: seatedTop(chainTrack) + play, steps: CHAIN_STEPS });
      }
      if (journeyEl && closeEl) {
        regions.push({ start: seatedTop(journeyEl), end: seatedTop(closeEl), steps: SECTION_STEPS });
        if (footerEl) regions.push({ start: seatedTop(closeEl), end: seatedTop(footerEl), steps: SECTION_STEPS });
      }
      return regions;
    };
    const virtualScroll = (data: { deltaY: number }): boolean => {
      const pos = lenis.targetScroll;
      for (const r of quantRegions()) {
        if (pos >= r.start && pos < r.end) {
          const step = (r.end - r.start) / r.steps;
          const rel = pos - r.start;
          const idx = data.deltaY > 0 ? Math.floor((rel + 1) / step) + 1 : Math.ceil((rel - 1) / step) - 1;
          if (idx >= 0 && idx <= r.steps) data.deltaY = r.start + idx * step - pos;
          break;
        }
      }
      return true;
    };
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      anchors: false,
      virtualScroll,
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
