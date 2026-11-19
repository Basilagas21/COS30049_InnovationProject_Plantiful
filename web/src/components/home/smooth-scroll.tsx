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
      let chainEnd: number | null = null;
      if (chainTrack && chainStage) {
        const play = chainTrack.offsetHeight - chainStage.offsetHeight;
        if (play > 0) {
          chainEnd = seatedTop(chainTrack) + play;
          regions.push({ start: seatedTop(chainTrack), end: chainEnd, steps: CHAIN_STEPS });
        }
      }
      if (journeyEl && closeEl) {
        const journeySeat = seatedTop(journeyEl);
        // The chain stage scrolls off between the chain end and the journey seating;
        // step through that gap too so section 2 does not leak into section 3 as free scroll.
        if (chainEnd !== null && chainEnd < journeySeat) regions.push({ start: chainEnd, end: journeySeat, steps: SECTION_STEPS });
        regions.push({ start: journeySeat, end: seatedTop(closeEl), steps: SECTION_STEPS });
        if (footerEl) regions.push({ start: seatedTop(closeEl), end: seatedTop(footerEl), steps: SECTION_STEPS });
      }
      return regions;
    };
    lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      anchors: false,
    });

    // A physical wheel notch can fire several wheel events, so stepping once per
    // event overshoots the section boundary. Instead let Lenis glide freely, then
    // settle onto the nearest notch boundary once scrolling pauses, so the rest
    // never bleeds past a section edge.
    let snapTimer = 0;
    const snapToGrid = () => {
      const regions = quantRegions();
      if (!regions.length) return;
      const pos = lenis.targetScroll;
      let best = pos;
      let bestDist = Infinity;
      for (const r of regions) {
        const step = (r.end - r.start) / r.steps;
        for (let k = 0; k <= r.steps; k++) {
          const pt = r.start + k * step;
          const d = Math.abs(pt - pos);
          if (d < bestDist) {
            bestDist = d;
            best = pt;
          }
        }
      }
      if (bestDist > 1) lenis.scrollTo(best, { duration: 0.45 });
    };
    const onWheel = () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(snapToGrid, 160);
    };
    window.addEventListener("wheel", onWheel, { passive: true });

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
      window.clearTimeout(snapTimer);
      window.removeEventListener("wheel", onWheel);
      document.removeEventListener("click", onClick);
      reduce.removeEventListener("change", onReduceChange);
      lenis.destroy();
    };
  }, []);

  return null;
}
