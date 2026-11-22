"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "top", label: "Top" },
  { id: "about-sfc", label: "About SFC" },
  { id: "why-plantiful", label: "Why Plantiful" },
  { id: "visiting", label: "Visiting" },
  { id: "faq", label: "FAQ" },
] as const;

// Purely a nice-to-have: on pages that don't have these section ids (species,
// inquiry, plant detail), the observer simply finds nothing to watch and the
// nav renders as plain, inert anchor links to "/#<id>" instead.
export function FooterDotNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = SECTIONS.map((section, index) => ({
      el: document.getElementById(section.id),
      index,
    })).filter((entry): entry is { el: HTMLElement; index: number } => entry.el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const match = elements.find((item) => item.el === entry.target);
          if (match) setActive(match.index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    elements.forEach(({ el }) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="footer-dot-nav" aria-label="Jump to section">
      {SECTIONS.map((section, index) => (
        <a
          key={section.id}
          href={`/#${section.id}`}
          className={`footer-dot ${index === active ? "is-active" : ""}`}
          aria-label={section.label}
          title={section.label}
        />
      ))}
    </nav>
  );
}
