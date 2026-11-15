"use client";

import { useEffect, type RefObject } from "react";

export function useHomeMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const doc = document.documentElement;
    const reveals = Array.from(root.querySelectorAll<HTMLElement>(".home-reveal"));
    const banner = root.querySelector<HTMLElement>(".home-canopy");
    const frond = root.querySelector<HTMLElement>(".home-frond-wrap");
    const heroCopy = root.querySelector<HTMLElement>(".home-hero-copy");
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

    // Centre the frond in the gap between the slogan's right edge and the
    // canopy's right edge, so the breathing room on both sides is equal.
    const layoutFrond = () => {
      if (!frond || !banner || !heroCopy) return;
      if (window.innerWidth <= 640) {
        frond.style.left = "";
        return;
      }
      const canopyRect = banner.getBoundingClientRect();
      const copyRight = heroCopy.getBoundingClientRect().right - canopyRect.left;
      const centre = (copyRight + canopyRect.width) / 2;
      frond.style.left = `${centre.toFixed(1)}px`;
    };

    // Scroll-driven verification chain: a record climbs the vine as you scroll.
    const chainTrack = root.querySelector<HTMLElement>(".home-chain-track");
    const chainStage = root.querySelector<HTMLElement>(".home-chain-stage");
    const vinePath = root.querySelector<SVGPathElement>(".home-chain-vine-path");
    const vineGrow = root.querySelector<SVGPathElement>(".home-chain-vine-grow");
    const chainToken = root.querySelector<SVGCircleElement>(".home-chain-token");
    const chainNodes = Array.from(root.querySelectorAll<SVGCircleElement>(".home-chain-node"));
    const chainSteps = Array.from(root.querySelectorAll<HTMLElement>(".home-chain-step"));
    const chainProgressFill = root.querySelector<HTMLElement>(".home-chain-progress-fill");
    let vineLen = 0;

    const layoutChain = () => {
      if (!vinePath) return;
      vineLen = vinePath.getTotalLength();
      if (vineGrow) {
        vineGrow.style.strokeDasharray = `${vineLen}`;
        vineGrow.style.strokeDashoffset = `${vineLen}`;
      }
      chainNodes.forEach((node, i) => {
        const pt = vinePath.getPointAtLength(((i + 1) / chainSteps.length) * vineLen);
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
      const active = Math.min(chainSteps.length - 1, Math.floor(p * chainSteps.length));
      chainSteps.forEach((step, i) => step.classList.toggle("is-active", i === active));
      chainNodes.forEach((node, i) => node.classList.toggle("is-lit", i < active));
      if (chainProgressFill) chainProgressFill.style.transform = `scaleX(${p.toFixed(4)})`;
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
    layoutFrond();
    layoutChain();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      syncHeader();
      layoutFrond();
      layoutChain();
      onScroll();
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          syncHeader();
          layoutFrond();
          layoutChain();
          onScroll();
        })
        .catch(() => {});
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let parallaxRaf = 0;
    const tick = () => {
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
        parallaxRaf = requestAnimationFrame(tick);
      } else {
        current.x = target.x;
        current.y = target.y;
        parallaxRaf = 0;
      }
      if (frond) frond.style.transform = `translate(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px)`;
    };
    const startParallax = () => {
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(tick);
    };
    const onBannerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !banner) return;
      const rect = banner.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 24;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      startParallax();
    };
    const onBannerLeave = () => {
      target.x = 0;
      target.y = 0;
      startParallax();
    };

    if (!reduce.matches) {
      banner?.addEventListener("pointermove", onBannerMove);
      banner?.addEventListener("pointerleave", onBannerLeave);
    }

    return () => {
      root.classList.remove("js-home");
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      banner?.removeEventListener("pointermove", onBannerMove);
      banner?.removeEventListener("pointerleave", onBannerLeave);
      if (parallaxRaf) cancelAnimationFrame(parallaxRaf);
      if (frond) {
        frond.style.transform = "";
        frond.style.left = "";
      }
      doc.style.removeProperty("--home-p");
    };
  }, [rootRef]);
}
