/**
 * A handful of soft, slowly-drifting glowing dots used as background
 * texture behind a section. Pure CSS animation (see .particle-field /
 * .particle in globals.css) — positions are fixed, not randomized, so
 * server and client render identically and nothing needs "use client".
 *
 * `density="soft"` (default) renders fewer, fainter particles for
 * sections that just want a touch of life in the background;
 * `density="full"` renders the full set for a section that's meant to be
 * the page's flagship interactive moment.
 */
const PARTICLES = [
  { left: "6%", top: "18%", size: 11, duration: 9 },
  { left: "20%", top: "72%", size: 7, duration: 11.5 },
  { left: "38%", top: "12%", size: 14, duration: 8.5 },
  { left: "55%", top: "60%", size: 8, duration: 12.5 },
  { left: "70%", top: "22%", size: 10, duration: 10 },
  { left: "86%", top: "66%", size: 13, duration: 13.5 },
  { left: "14%", top: "46%", size: 6, duration: 9.5 },
  { left: "92%", top: "38%", size: 9, duration: 10.5 },
  { left: "46%", top: "84%", size: 7, duration: 11 },
  { left: "63%", top: "8%", size: 8, duration: 9.8 },
] as const;

export function ParticleField({ density = "soft" }: { density?: "soft" | "full" }) {
  const particles = density === "full" ? PARTICLES : PARTICLES.slice(0, 5);

  return (
    <div className={`particle-field particle-field-${density}`} aria-hidden="true">
      {particles.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${-(i * 1.7)}s`,
          }}
        />
      ))}
    </div>
  );
}
