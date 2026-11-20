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
    const header = document.querySelector<HTMLElement>(".site-header");

    const syncHeader = () => {
      if (header) doc.style.setProperty("--header-h", `${header.offsetHeight}px`);
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
    // Precomputed path samples so the token position is a cheap interpolation
    // each frame instead of an expensive getPointAtLength call.
    let vineX: number[] = [];
    let vineY: number[] = [];
    // Cached geometry, refreshed on layout/resize rather than read every frame.
    let headerH = 0;
    let stageH = 0;
    let trackTop = 0;
    let trackH = 0;
    let lastActive = -2;
    let lastLit = -1;

    const cacheGeometry = () => {
      headerH = header?.offsetHeight ?? 0;
      stageH = chainStage?.offsetHeight ?? window.innerHeight;
      if (chainTrack) {
        const r = chainTrack.getBoundingClientRect();
        trackTop = r.top + window.scrollY;
        trackH = r.height;
      }
    };

    const layoutChain = () => {
      if (!vinePath) return;
      vineLen = vinePath.getTotalLength();
      const N = 120;
      vineX = new Array(N + 1);
      vineY = new Array(N + 1);
      for (let i = 0; i <= N; i++) {
        const pt = vinePath.getPointAtLength((i / N) * vineLen);
        vineX[i] = pt.x;
        vineY[i] = pt.y;
      }
      if (vineGrow) {
        vineGrow.style.strokeDasharray = `${vineLen}`;
        vineGrow.style.strokeDashoffset = `${vineLen}`;
      }
      chainNodes.forEach((node, i) => {
        const pt = vinePath.getPointAtLength(((i + 1) / (chainSteps.length + 1)) * vineLen);
        node.setAttribute("cx", `${pt.x.toFixed(1)}`);
        node.setAttribute("cy", `${pt.y.toFixed(1)}`);
      });
      cacheGeometry();
    };

    const updateChain = () => {
      if (!chainTrack || reduce.matches || !vineLen || window.innerWidth <= 640) return;
      const total = trackH - stageH;
      const p = total > 0 ? Math.min(1, Math.max(0, (headerH - (trackTop - window.scrollY)) / total)) : 0;
      if (vineGrow) vineGrow.style.strokeDashoffset = `${(vineLen * (1 - p)).toFixed(1)}`;
      if (chainToken && vineX.length) {
        const N = vineX.length - 1;
        const f = p * N;
        const i = Math.min(N - 1, Math.floor(f));
        const t = f - i;
        const x = vineX[i] + (vineX[i + 1] - vineX[i]) * t;
        const y = vineY[i] + (vineY[i + 1] - vineY[i]) * t;
        chainToken.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      }
      const active = Math.max(-1, Math.min(chainSteps.length - 1, Math.floor(p * (chainSteps.length + 1)) - 1));
      let lit = 0;
      for (let i = 0; i < chainNodes.length; i++) {
        if (p >= (i + 1) / (chainSteps.length + 1)) lit = i + 1;
      }
      // Only touch the DOM when the active step / lit count actually changes.
      if (active !== lastActive) {
        chainSteps.forEach((step, i) => step.classList.toggle("is-active", i === active));
        chainScenes.forEach((scene, i) => scene.classList.toggle("is-active", i === active));
        if (seedScene) seedScene.classList.toggle("is-active", active === -1);
        if (introStep) introStep.classList.toggle("is-active", active === -1);
        if (chainStage) chainStage.classList.toggle("is-peak", active === chainSteps.length - 1);
        lastActive = active;
      }
      if (lit !== lastLit) {
        chainNodes.forEach((node, i) => node.classList.toggle("is-lit", i < lit));
        lastLit = lit;
      }
    };

    const doScroll = () => {
      const vh = window.innerHeight;
      const sy = window.scrollY;
      if (!reduce.matches && sy < vh * 1.2) {
        if (canopyBack) canopyBack.style.transform = `translateY(${(sy * 0.12).toFixed(1)}px)`;
        if (canopyFront) canopyFront.style.transform = `translateY(${(sy * 0.2).toFixed(1)}px)`;
        if (aurora) aurora.style.transform = `translateY(${(sy * 0.06).toFixed(1)}px)`;
      }
      // Reveal entrances are handled by the IntersectionObserver above; no
      // per-frame getBoundingClientRect loop here (it forced layout each scroll).
      updateChain();
    };
    // Coalesce scroll work to one animation frame so rapid scroll events don't
    // run the handler multiple times per frame.
    let scrollRaf = 0;
    const onScroll = () => {
      if (!scrollRaf) scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; doScroll(); });
    };

    // Record-driven blocks (live chip, ledger) stream in after hydration; adopt
    // any reveal element that appears later and refresh the cached geometry.
    const mo = new MutationObserver(() => {
      for (const el of Array.from(root.querySelectorAll<HTMLElement>(".home-reveal"))) {
        if (!reveals.includes(el)) {
          reveals.push(el);
          io.observe(el);
        }
      }
      cacheGeometry();
    });
    mo.observe(root, { childList: true, subtree: true });

    layoutChain();
    doScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      syncHeader();
      layoutChain();
      doScroll();
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          syncHeader();
          layoutChain();
          doScroll();
        })
        .catch(() => {});
    }

    return () => {
      root.classList.remove("js-home");
      io.disconnect();
      mo.disconnect();
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [rootRef]);
}