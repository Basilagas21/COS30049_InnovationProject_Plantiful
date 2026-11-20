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

    const syncHeader = () => {
      const header = document.querySelector<HTMLElement>(".site-header");
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
    let notch = 120;

    const layoutChain = () => {
      // Size the chain track so its scroll play (track - stage) is a whole
      // number of wheel notches: the animation then ends exactly on a scroll
      // step instead of overshooting into the next section. Only the track
      // length is tuned — the nav and stage keep their natural fixed heights.
      // notch is detected from real wheel events (detectNotch below); notch=0
      // (continuous trackpad) leaves the natural two-section play untouched.
      if (chainTrack && chainStage) {
        if (window.innerWidth <= 640) {
          chainTrack.style.height = "";
        } else {
          const stageH = chainStage.offsetHeight;
          const naturalPlay = 2 * stageH;
          const play = notch > 0 ? Math.round(naturalPlay / notch) * notch : naturalPlay;
          chainTrack.style.height = `${stageH + play}px`;
        }
      }
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
    // Detect the device's wheel notch (GCD of the pixel deltas = one notch) and
    // re-tune the chain track to it, so the last scroll lands on the chain end
    // on any mouse. A tiny GCD means a continuous trackpad: drop the tuning.
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
        layoutChain();
        onScroll();
      }
      window.removeEventListener("wheel", detectNotch);
    };
    window.addEventListener("wheel", detectNotch, { passive: true });
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
      window.removeEventListener("wheel", detectNotch);
      doc.style.removeProperty("--home-p");
    };
  }, [rootRef]);
}
