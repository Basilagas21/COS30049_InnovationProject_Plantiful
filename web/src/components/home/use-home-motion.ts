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
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      syncHeader();
      onScroll();
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(syncHeader).catch(() => {});
    }

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };
    let parallaxRaf = 0;
    const tick = () => {
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;
      if (frond) frond.style.transform = `translate(${current.x.toFixed(2)}px, ${current.y.toFixed(2)}px)`;
      if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
        parallaxRaf = requestAnimationFrame(tick);
      } else {
        parallaxRaf = 0;
      }
    };
    const startParallax = () => {
      if (!parallaxRaf) parallaxRaf = requestAnimationFrame(tick);
    };
    const onBannerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !banner) return;
      const rect = banner.getBoundingClientRect();
      target.x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      target.y = ((event.clientY - rect.top) / rect.height - 0.5) * 14;
      startParallax();
    };
    const onBannerLeave = () => {
      target.x = 0;
      target.y = 0;
      startParallax();
    };

    const magnetic: Array<{ el: HTMLElement; move: (e: PointerEvent) => void; leave: () => void }> = [];
    if (!reduce.matches) {
      banner?.addEventListener("pointermove", onBannerMove);
      banner?.addEventListener("pointerleave", onBannerLeave);
      const buttons = Array.from(root.querySelectorAll<HTMLElement>(".home-btn"));
      for (const el of buttons) {
        const move = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
          const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
          el.style.transform = `translate(${(x * 6).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
        };
        const leave = () => {
          el.style.transform = "";
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        magnetic.push({ el, move, leave });
      }
    }

    return () => {
      root.classList.remove("js-home");
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      banner?.removeEventListener("pointermove", onBannerMove);
      banner?.removeEventListener("pointerleave", onBannerLeave);
      if (parallaxRaf) cancelAnimationFrame(parallaxRaf);
      for (const { el, move, leave } of magnetic) {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        el.style.transform = "";
      }
      doc.style.removeProperty("--home-p");
    };
  }, [rootRef]);
}
