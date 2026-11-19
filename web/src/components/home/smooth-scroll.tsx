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
    const headerEl = document.querySelector<HTMLElement>(".site-header");
    // The chain plays over a fixed number of wheel notches so the last one lands
    // exactly on the section boundary instead of bleeding into the next section.
    const CHAIN_STEPS = 13;
    // eslint-disable-next-line prefer-const -- instance is read by its own constructor callbacks below
    let lenis: Lenis;
    const chainBounds = () => {
      if (!chainTrack || !chainStage || window.innerWidth <= 640) return null;
      const play = chainTrack.offsetHeight - chainStage.offsetHeight;
      if (play <= 0) return null;
      const start = chainTrack.getBoundingClientRect().top + lenis.scroll - (headerEl?.offsetHeight ?? 0);
      return { start, play, step: play / CHAIN_STEPS };
    };
    const virtualScroll = (data: { deltaY: number }): boolean => {
      const c = chainBounds();
      if (c) {
        const pos = lenis.targetScroll;
        if (pos >= c.start && pos <= c.start + c.play) {
          const rel = pos - c.start;
          const idx = data.deltaY > 0 ? Math.floor((rel + 1) / c.step) + 1 : Math.ceil((rel - 1) / c.step) - 1;
          if (idx >= 0 && idx <= CHAIN_STEPS) data.deltaY = c.start + idx * c.step - pos;
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
