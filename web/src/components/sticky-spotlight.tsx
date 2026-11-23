"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ParticleField } from "./particle-field";

type Fact = { title: string; body: string };

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
            aria-label="Previous"
            className="spotlight-arrow spotlight-arrow-left"
            onClick={() => goTo(active - 1)}
            disabled={active === 0}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
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
                    transform: `translate(-50%, -50%) translateX(${offset * 95}%) scale(${1 - magnitude * 0.16})`,
                    opacity: 1 - magnitude * 0.68,
                    zIndex: 10 - magnitude,
                  }}
                >
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
