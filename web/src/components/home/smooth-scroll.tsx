"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function SmoothScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    // Wheel smoothing is handled below with a precise float target; Lenis still
    // animates the glide and drives touch/keyboard/anchor scrolling.
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: false,
      syncTouch: false,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      anchors: false,
    });

    // Calibrate pixels-per-notch so a whole number of notches equals one section
    // height (viewport - nav). Every section boundary then lands on an exact
    // scroll step: the nav stays fixed, sections fit the screen, and the glide
    // stays free (no snap). Only the scroll step is tuned, by a barely-perceptible
    // amount; the layout is untouched. The notch is detected from real wheel
    // events so this adapts to any mouse; a continuous trackpad (notch=0) keeps 1:1.
    let notch = 120;
    let multiplier = 1;
    const calibrate = () => {
      const header = document.querySelector<HTMLElement>(".site-header");
      const navH = header?.getBoundingClientRect().height ?? 0;
      const section = window.innerHeight - navH;
      if (notch <= 0 || section <= 0) {
        multiplier = 1;
        return;
      }
      const steps = Math.max(1, Math.round(section / notch));
      multiplier = section / (steps * notch);
    };
    calibrate();
    window.addEventListener("resize", calibrate);
    // The nav height can settle after mount (fonts, responsive layout); recalibrate
    // whenever it changes so the scroll step always matches the real section height.
    const headerEl = document.querySelector(".site-header");
    const headerRo = new ResizeObserver(() => calibrate());
    if (headerEl) headerRo.observe(headerEl);
    if (document.fonts?.ready) document.fonts.ready.then(calibrate).catch(() => {});

    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const notchSamples: number[] = [];
    const detectNotch = (e: WheelEvent) => {
      if (e.deltaMode !== 0) return;
      const d = Math.round(Math.abs(e.deltaY));
      if (d > 0) notchSamples.push(d);
      if (notchSamples.length < 5) return;
      const big = notchSamples.filter((x) => x >= 40);
      let detected = 0;
      if (big.length >= 3) {
        const g = big.reduce((a, b) => gcd(a, b));
        if (g >= 50) detected = g;
      }
      if (detected !== notch) {
        notch = detected;
        calibrate();
      }
      window.removeEventListener("wheel", detectNotch);
    };
    window.addEventListener("wheel", detectNotch, { passive: true });

    // Drive wheel scrolling against a precise floating-point target. Lenis rounds
    // its own target to the browser's integer scroll position after each notch,
    // which would accumulate a sub-pixel drift; owning the target keeps whole
    // notches landing exactly on section boundaries. Lenis animates the glide.
    let virtualTarget = window.scrollY;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaMode !== 0 || e.ctrlKey) return;
      e.preventDefault();
      virtualTarget = Math.min(lenis.limit, Math.max(0, virtualTarget + e.deltaY * multiplier));
      lenis.scrollTo(virtualTarget, { lerp: 0.09 });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    // Follow the real position only for genuine native scrolling (scrollbar, keys,
    // touch) — never during the wheel glide, so the float target keeps its precision.
    const onLenisScroll = (l: Lenis) => {
      if (l.isScrolling === "native") virtualTarget = l.animatedScroll;
    };
    lenis.on("scroll", onLenisScroll);

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
      window.removeEventListener("resize", calibrate);
      headerRo.disconnect();
      window.removeEventListener("wheel", detectNotch);
      window.removeEventListener("wheel", onWheel);
      lenis.off("scroll", onLenisScroll);
      reduce.removeEventListener("change", onReduceChange);
      lenis.destroy();
    };
  }, []);

  return null;
}