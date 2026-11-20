"use client";

import { useEffect, type RefObject } from "react";

export function useHomeMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const doc = document.documentElement;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".home-reveal"));
    const canopyBack = root.querySelector<HTMLElement>(".canopy-floor--back");
    const canopyFront = root.querySelector<HTMLElement>(".canopy-floor--front");
    const aurora = root.querySelector<HTMLElement>(".aurora-field");

    let baseHeader = 0;
    let baseContent = 0;
    const syncHeader = () => {
      const header = document.querySelector<HTMLElement>(".site-header");
      if (!header) return;
      const inner = header.querySelector<HTMLElement>(".site-header-inner");
      if (!baseHeader) {
        baseHeader = header.offsetHeight;
        if (inner) {
          const cs = getComputedStyle(inner);
          baseContent = baseHeader - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        }
      }
      // Calibrate the header height so the section below it (viewport - header)
      // is a whole multiple of the wheel notch (120px), letting every section
      // scroll in whole notches with no fractional remainder. The nav padding
      // shrinks to keep its content fitted at the calibrated height.
      const NOTCH = 120;
      const targetSection = Math.round((window.innerHeight - baseHeader) / NOTCH) * NOTCH;
      let targetHeader = window.innerHeight - targetSection;
      const minHeader = baseContent + 8;
      if (targetHeader < minHeader) targetHeader = minHeader;
      const padY = Math.max(4, (targetHeader - baseContent) / 2);
      doc.style.setProperty("--header-h", `${targetHeader.toFixed(2)}px`);
      doc.style.setProperty("--header-pad-y", `${padY.toFixed(2)}px`);
    };
    syncHeader();

    if (!reduce.matches) root.classList.add("js-home");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 },
    );
    reveals.forEach((el) => io.observe(el));
    // Record-driven blocks (live chip, ledger) stream in after hydration; adopt
    // any reveal element that appears later so its entrance still fires.
    const mo = new MutationObserver(() => {
      for (const el of Array.from(root.querySelectorAll<HTMLElement>(".home-reveal"))) {
        if (!reveals.includes(el)) {
          reveals.push(el);
          io.observe(el);
        }
      }
    });
    mo.observe(root, { childList: true, subtree: true });

    // Scroll-driven verification chain: a record climbs the vine as you scroll.
    const chainTrack = root.querySelector<HTMLElement>(".home-chain-track");
    const chainStage = root.querySelector<HTMLElement>(".home-chain-stage");
    const vinePath = root.querySelector<SVGPathElement>(".home-chain-vine-path");
    const vineGrow = root.querySelector<SVGPathElement>(".home-chain-vine-grow");
    const chainToken = root.querySelector<SVGCircleElement>(".home-chain-token");
    const chainNodes = Array.from(root.querySelectorAll<SVGCircleElement>(".home-chain-node"));
    const chainSteps = Array.from(root.querySelectorAll<HTMLElement>(".home-chain-step:not(.home-chain-intro)"));
    const chainScenes = Array.from(root.querySelectorAll<SVGElement>(".chain-scene"));
    const seedScene = root.querySelector<SVGElement>(".chain-seed");
    const introStep = root.querySelector<HTMLElement>(".home-chain-intro");
    let vineLen = 0;

    const layoutChain = () => {
      if (!vinePath) return;
      vineLen = vinePath.getTotalLength();
      if (vineGrow) {
        vineGrow.style.strokeDasharray = `${vineLen}`;
        vineGrow.style.strokeDashoffset = `${vineLen}`;
      }
      chainNodes.forEach((node, i) => {
        const pt = vinePath.getPointAtLength(((i + 1) / (chainSteps.length + 1)) * vineLen);
        node.setAttribute("cx", `${pt.x.toFixed(1)}`);
        node.setAttribute("cy", `${pt.y.toFixed(1)}`);
      });
    };

    const updateChain = () => {
      if (!chainTrack || reduce.matches || !vineLen || window.innerWidth <= 640) return;
      const rect = chainTrack.getBoundingClientRect();
      const headerH = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
      const stageH = chainStage?.offsetHeight ?? window.innerHeight;
      const total = rect.height - stageH;
      const p = total > 0 ? Math.min(1, Math.max(0, (headerH - rect.top) / total)) : 0;
      if (vineGrow) vineGrow.style.strokeDashoffset = `${(vineLen * (1 - p)).toFixed(1)}`;
      if (chainToken && vinePath) {
        const pt = vinePath.getPointAtLength(p * vineLen);
        chainToken.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      }
      const active = Math.max(-1, Math.min(chainSteps.length - 1, Math.floor(p * (chainSteps.length + 1)) - 1));
      chainSteps.forEach((step, i) => step.classList.toggle("is-active", i === active));
      chainNodes.forEach((node, i) => node.classList.toggle("is-lit", p >= (i + 1) / (chainSteps.length + 1)));
      chainScenes.forEach((scene, i) => scene.classList.toggle("is-active", i === active));
      if (seedScene) seedScene.classList.toggle("is-active", active === -1);
      if (introStep) introStep.classList.toggle("is-active", active === -1);
      if (chainStage) chainStage.classList.toggle("is-peak", active === chainSteps.length - 1);
    };

    const onScroll = () => {
      const vh = window.innerHeight;
      const max = doc.scrollHeight - vh;
      doc.style.setProperty("--home-p", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
      if (!reduce.matches) {
        const sy = window.scrollY;
        if (sy < vh * 1.2) {
          if (canopyBack) canopyBack.style.transform = `translateY(${(sy * 0.12).toFixed(1)}px)`;
          if (canopyFront) canopyFront.style.transform = `translateY(${(sy * 0.2).toFixed(1)}px)`;
          if (aurora) aurora.style.transform = `translateY(${(sy * 0.06).toFixed(1)}px)`;
        }
      }
      for (const el of reveals) {
        if (el.classList.contains("is-in")) continue;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in");
      }
      updateChain();
    };
    layoutChain();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      syncHeader();
      layoutChain();
      onScroll();
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          syncHeader();
          layoutChain();
          onScroll();
        })
        .catch(() => {});
    }

    return () => {
      root.classList.remove("js-home");
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      doc.style.removeProperty("--home-p");
    };
  }, [rootRef]);
}
