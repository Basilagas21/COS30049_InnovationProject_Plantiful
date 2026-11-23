"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  spotlight = false,
}: {
  children: ReactNode;
  className?: string;
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!spotlight) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const cards = Array.from(node.querySelectorAll<HTMLElement>("[data-active-card]"));
    if (cards.length === 0) return;

    const spotlightObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("is-spotlight-active", entry.isIntersecting);
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 },
    );
    cards.forEach((card) => spotlightObserver.observe(card));
    return () => spotlightObserver.disconnect();
  }, [spotlight]);

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
