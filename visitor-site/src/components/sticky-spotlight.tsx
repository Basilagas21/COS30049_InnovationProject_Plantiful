"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ParticleField } from "./particle-field";

type Fact = { title: string; body: string };

/**
 * Desktop/tablet-only "scrollytelling" treatment for the SFC facts section,
 * modeled on the pinned, center-spotlight card layout used on neuon.ai:
 * the section stays pinned on screen for a few viewport-heights of scroll,
 * one fact is centered and fully lit at a time, the other two sit dimmed
 * as left/right previews. A real photo fills the entire panel as a true
 * full-bleed background, with a dark gradient wash over it for text
 * contrast — the same treatment the homepage hero already uses for its
 * own photo. The section's own heading/intro (passed in as `header`)
 * lives inside the panel now too, above the cards. Left/right arrow
 * buttons let a visitor step through the facts directly instead of only
 * scrolling. The panel itself breaks out wider than the page's normal
 * content column (see .spotlight-breakout in globals.css).
 *
 * How the "which fact is active" part works without a scroll-position
 * library: one invisible, full-height "step" div per fact is stacked
 * (absolutely, so it adds no flow height) inside the tall scroller below,
 * and an IntersectionObserver with a thin band centered on the viewport
 * (the same centered-rootMargin trick used elsewhere in this app) reports
 * whichever step's center is currently crossing the middle of the screen.
 * The arrow buttons just scroll the window to a step's center — the same
 * observer then picks that up naturally, so there's only one source of
 * truth for "which fact is active," not two competing ones.
 *
 * Rendered only at lg+ (see the `hidden lg:block` wrapper in page.tsx) —
 * below that, page.tsx falls back to a plain stacked layout, since pinning
 * a single column of full-width cards has nothing to pin against.
 */
export function StickySpotlight({
  facts,
  bgImage,
  header,
}: {
  facts: Fact[];
  bgImage: string;
  header?: ReactNode;
}) {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(facts.length - 1, index));
    const stepEl = stepRefs.current[clamped];
    if (!stepEl) return;
    const rect = stepEl.getBoundingClientRect();
    const stepCenterDoc = rect.top + window.scrollY + rect.height / 2;
    window.scrollTo({ top: stepCenterDoc - window.innerHeight / 2, behavior: "smooth" });
  }

  return (
    <div className="spotlight-scroller" style={{ height: `${facts.length * 80}vh` }}>
      {/* Absolutely positioned so they contribute no flow height of their
          own (the scroller's explicit inline height above already gives
          the real scroll distance) — otherwise, as plain stacked block
          siblings, they'd push .spotlight-sticky down below all of them
          instead of letting it start at the top and pin in place. */}
      {facts.map((_, i) => (
        <div
          key={i}
          data-step={i}
          ref={(el) => {
            stepRefs.current[i] = el;
          }}
          className="spotlight-step"
          style={{ top: `${i * 80}vh` }}
        />
      ))}

      <div className="spotlight-sticky">
        <div className="spotlight-photo-bg" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bgImage} alt="" className="spotlight-photo-img" />
        </div>

        <ParticleField density="full" />

        {header && <div className="spotlight-header">{header}</div>}

        <div className="spotlight-stage">
          <button
            type="button"
            aria-label="Previous fact"
            className="spotlight-arrow spotlight-arrow-left"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next fact"
            className="spotlight-arrow spotlight-arrow-right"
            onClick={() => goTo(active + 1)}
            disabled={active === facts.length - 1}
          >
            ›
          </button>

          <div className="spotlight-cards">
            {facts.map((fact, i) => {
              const offset = i - active;
              const magnitude = Math.min(Math.abs(offset), 2);
              return (
                <div
                  key={fact.title}
                  className={`spotlight-card ${offset === 0 ? "is-active" : ""}`}
                  style={{
                    transform: `translate(-50%, -50%) translateX(${offset * 70}%) scale(${1 - magnitude * 0.16})`,
                    opacity: 1 - magnitude * 0.58,
                    zIndex: 10 - magnitude,
                  }}
                >
                  {/* This inner wrapper carries the pointer-tracked 3D
                      tilt (see TiltInit + [data-tilt] in globals.css).
                      It's a separate nested element specifically so its
                      own transform doesn't fight with the position/scale
                      transform React sets on the parent above — nested
                      transforms simply compose visually. */}
                  <div className="spotlight-card-tilt" data-tilt>
                    <h3 className="heading-accent-dark">{fact.title}</h3>
                    <p>{fact.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
