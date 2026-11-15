"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import type { RecordListItem } from "@/lib/records";
import { useHomeMotion } from "./use-home-motion";

const SPORES = [
  { left: 8, dur: 11, delay: 0, dx: 26, size: 4 },
  { left: 18, dur: 13, delay: 2.4, dx: -20, size: 3 },
  { left: 29, dur: 9.5, delay: 4.2, dx: 18, size: 5 },
  { left: 41, dur: 12.5, delay: 1.2, dx: -28, size: 3 },
  { left: 52, dur: 10.5, delay: 5.1, dx: 22, size: 4 },
  { left: 63, dur: 14, delay: 0.7, dx: -16, size: 3 },
  { left: 72, dur: 9, delay: 3.3, dx: 30, size: 5 },
  { left: 81, dur: 12, delay: 6.0, dx: -24, size: 3 },
  { left: 89, dur: 10, delay: 2.0, dx: 18, size: 4 },
  { left: 96, dur: 13.5, delay: 4.8, dx: -22, size: 3 },
];

const JOURNEY = [
  {
    title: "Discover",
    description: "Get to know the plants of Niah through the published species catalogue.",
    href: "/explore",
    label: "Browse the guide",
    image: "rafflesia.jpg",
    position: "50% 25%",
    alt: "Rafflesia flower on the forest floor",
  },
  {
    title: "Connect",
    description: "See where approved plant observations connect across the landscape.",
    href: "/map",
    label: "Explore the map",
    image: "hornbill.jpeg",
    position: "70% 15%",
    alt: "Hornbill in the canopy",
  },
  {
    title: "Conserve",
    description: "Sign in to review field records and contribute to a growing body of knowledge.",
    href: "/signin",
    label: "Join the workspace",
    image: "orangutan.jpeg",
    position: "50% 20%",
    alt: "Orangutan in the understory",
  },
];

const CHAIN = [
  {
    title: "A plant is tagged.",
    body: "Each tagged plant carries a unique QR identity, so an observation in the field can be tied back to a real individual.",
  },
  {
    title: "A botanist records it.",
    body: "Offline in the forest, a botanist captures the species, a GPS fix, photos and field notes, stored safely on the device.",
  },
  {
    title: "The record syncs.",
    body: "When connectivity returns, the observation travels from the field device to the knowledge system, intact and unchanged.",
  },
  {
    title: "An officer reviews it.",
    body: "A conservation officer checks the record against its evidence and approves, returns or rejects it. Nothing is published unchecked.",
  },
  {
    title: "It joins the canopy.",
    body: "Only then does the record enter the public catalogue, carrying its tag, its fix and its reviewer for anyone to see.",
  },
];

function Arrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="home-arrow" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 L12 4 M5.5 4 H12 V10.5" />
    </svg>
  );
}

function formatFix(record: RecordListItem): string {
  if (record.gpsLat === null || record.gpsLng === null) return "GPS fix not recorded";
  const acc = record.gpsAccuracyM !== null ? ` · ±${Math.round(record.gpsAccuracyM)}\u00A0m` : "";
  return `${record.gpsLat.toFixed(2)}° N, ${record.gpsLng.toFixed(2)}° E${acc}`;
}

export function HomeContent({
  records,
  speciesCount,
}: {
  records: RecordListItem[];
  speciesCount: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  useHomeMotion(rootRef);
  const featured = records.find((r) => r.isPublished) ?? records.find((r) => r.approvalStatus === "approved") ?? null;

  return (
    <div ref={rootRef} className="home-root">
      <section className="home-canopy" aria-label="Plantiful introduction">
        <div className="aurora-field" aria-hidden="true">
          <i className="curtain curtain--1" />
          <i className="curtain curtain--2" />
          <i className="curtain curtain--3" />
          <i className="curtain curtain--4" />
        </div>
        <div className="home-stars" aria-hidden="true" />
        <div className="home-shafts" aria-hidden="true" />
        <svg className="canopy-hang" viewBox="0 0 1440 190" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#03100a" opacity=".94" d="M0 0 H1440 V40 C 1418 63 1411 114 1395 114 C 1379 114 1372 24 1350 40 C 1328 98 1321 178 1305 178 C 1289 178 1282 17 1260 29 C 1238 57 1231 104 1215 104 C 1199 104 1192 27 1170 45 C 1148 59 1141 107 1125 107 C 1109 107 1102 23 1080 39 C 1058 93 1051 169 1035 169 C 1019 169 1012 17 990 29 C 968 87 961 159 945 159 C 929 159 922 20 900 34 C 878 54 871 99 855 99 C 839 99 832 18 810 30 C 788 82 781 150 765 150 C 749 150 742 25 720 41 C 698 57 691 103 675 103 C 659 103 652 21 630 35 C 608 58 601 106 585 106 C 569 106 562 27 540 45 C 518 82 511 149 495 149 C 479 149 472 17 450 29 C 428 92 421 167 405 167 C 389 167 382 19 360 31 C 338 68 331 123 315 123 C 299 123 292 29 270 48 C 248 96 241 175 225 175 C 209 175 202 28 180 46 C 158 56 151 102 135 102 C 119 102 112 28 90 46 C 68 93 61 169 45 169 C 29 169 22 24 0 40 L0 0 Z" />
        </svg>
        <div className="home-spores" aria-hidden="true">
          {SPORES.map((s, i) => (
            <span
              key={i}
              className="home-spore"
              style={{
                left: `${s.left}%`,
                width: s.size,
                height: s.size,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
                "--sdx": `${s.dx}px`,
              } as CSSProperties}
            />
          ))}
        </div>
        <div className="home-frond-wrap" aria-hidden="true">
          <div className="home-frond" />
        </div>
        <div className="home-hero-copy">
          <h1 className="home-title">
            <span className="home-title-line"><span className="home-title-inner">Every plant.</span></span>
            <span className="home-title-line"><span className="home-title-inner">A story worth</span></span>
            <span className="home-title-line"><span className="home-title-inner"><span className="home-accent">preserving.</span></span></span>
          </h1>
          <p className="home-lede">
            A living, verified catalogue of Niah National Park. Every public record
            passed a conservation officer&apos;s review before it joined the canopy.
          </p>
          <div className="home-banner-actions">
            <Link href="/explore" className="home-btn">Explore the plant guide<Arrow /></Link>
            <Link href="/map" className="home-btn home-btn--ghost">Open the species map<Arrow /></Link>
          </div>
        </div>
        <div className="live-chip home-reveal" style={{ "--reveal-i": 2 } as CSSProperties}>
          {featured ? (
            <>
              <p className="live-chip-row"><span className="live-chip-pulse" />Latest verification</p>
              <p className="live-chip-name"><em>{featured.scientificName}</em></p>
              <p className="live-chip-meta">{formatFix(featured)}<span className="live-chip-meta-date"> · captured {featured.createdAt.slice(0, 10)}</span></p>
              <span className="live-chip-ok">{featured.isPublished ? "Published to the catalogue" : "Awaiting publication"}</span>
            </>
          ) : (
            <>
              <p className="live-chip-row"><span className="live-chip-pulse" />Latest verification</p>
              <p className="live-chip-name"><em>Awaiting the first record</em></p>
              <p className="live-chip-meta">Records appear here once an officer approves them.</p>
            </>
          )}
        </div>
        <svg className="canopy-floor canopy-floor--back" viewBox="0 0 1440 300" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#0e2c1d" d="M0 300 V252 C 26 219 33 152 51 152 C 70 152 77 278 103 264 C 129 230 136 172 154 172 C 173 172 180 281 206 268 C 231 195 239 109 257 109 C 276 109 283 282 309 270 C 334 202 341 121 360 121 C 379 121 386 271 411 251 C 437 233 444 179 463 179 C 481 179 489 284 514 273 C 540 210 547 137 566 137 C 584 137 591 280 617 266 C 643 214 650 143 669 143 C 687 143 694 276 720 260 C 746 227 753 167 771 167 C 790 167 797 271 823 252 C 849 219 856 153 874 153 C 893 153 900 280 926 266 C 951 208 959 133 977 133 C 996 133 1003 284 1029 273 C 1054 242 1061 195 1080 195 C 1099 195 1106 275 1131 259 C 1157 221 1164 157 1183 157 C 1201 157 1209 282 1234 270 C 1260 198 1267 114 1286 114 C 1304 114 1311 279 1337 265 C 1363 240 1370 191 1389 191 C 1407 191 1414 276 1440 260 L1440 300 Z" />
        </svg>
        <svg className="canopy-floor canopy-floor--front" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#03100a" d="M0 220 V189 C 20 155 26 102 40 102 C 54 102 60 204 80 194 C 100 131 106 59 120 59 C 134 59 140 203 160 191 C 180 150 186 93 200 93 C 214 93 220 197 240 182 C 260 161 266 112 280 112 C 294 112 300 195 320 178 C 340 162 346 115 360 115 C 374 115 380 194 400 177 C 420 149 426 91 440 91 C 454 91 460 195 480 178 C 500 113 506 26 520 26 C 534 26 540 192 560 174 C 580 158 586 107 600 107 C 614 107 620 203 640 192 C 660 130 666 56 680 56 C 694 56 700 194 720 177 C 740 126 746 49 760 49 C 774 49 780 201 800 189 C 820 145 826 83 840 83 C 854 83 860 203 880 192 C 900 132 906 60 920 60 C 934 60 940 192 960 173 C 980 166 986 122 1000 122 C 1014 122 1020 194 1040 177 C 1060 167 1066 123 1080 123 C 1094 123 1100 194 1120 176 C 1140 156 1146 104 1160 104 C 1174 104 1180 196 1200 180 C 1220 123 1226 43 1240 43 C 1254 43 1260 195 1280 178 C 1300 141 1306 76 1320 76 C 1334 76 1340 191 1360 171 C 1380 148 1386 90 1400 90 C 1414 90 1420 197 1440 181 L1440 220 Z" />
        </svg>
      </section>

      <section className="home-proof home-reveal" aria-label="Catalogue at a glance">
        {records.length > 0 ? (
          <p className="home-proof-line">
            <span className="home-proof-num" data-count>{records.length}</span> approved records
            <span className="home-proof-sep" aria-hidden="true">·</span>
            <span className="home-proof-num" data-count>{speciesCount}</span> published species
            <span className="home-proof-sep" aria-hidden="true">·</span>
            every one reviewed by a conservation officer
          </p>
        ) : (
          <p className="home-proof-line" role="status">
            The catalogue is being prepared. Records appear here the moment a conservation officer approves them.
          </p>
        )}
      </section>

      <section className="home-chain" aria-label="How a record joins the catalogue">
        <div className="home-chain-track">
          <div className="home-chain-stage">
            <div className="home-chain-head">
              <h2 className="home-chain-title">From forest floor<br />to public record.</h2>
              <p className="home-chain-lede">Every entry in the canopy travels the same path, and nothing is published unchecked.</p>
            </div>
            <div className="home-chain-body">
              <div className="home-chain-spine" aria-hidden="true">
                <svg className="home-chain-vine" viewBox="0 0 140 620" fill="none">
                  <defs>
                    <radialGradient id="chain-bloom">
                      <stop offset="0" stopColor="#e3ef26" stopOpacity=".4" />
                      <stop offset=".45" stopColor="#6fd6b0" stopOpacity=".18" />
                      <stop offset="1" stopColor="#6fd6b0" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle className="home-chain-bloom" cx="70" cy="20" r="64" fill="url(#chain-bloom)" />
                  <path className="home-chain-vine-path" d="M70 600 C50 540 90 480 70 420 C50 360 90 300 70 240 C50 180 82 120 70 20" />
                  <path className="home-chain-vine-grow" d="M70 600 C50 540 90 480 70 420 C50 360 90 300 70 240 C50 180 82 120 70 20" />
                  <g>
                    {CHAIN.map((_, i) => (
                      <circle key={i} className="home-chain-node" r="6" cx="70" cy="600" />
                    ))}
                  </g>
                  <circle className="home-chain-token" r="8" cx="0" cy="0" transform="translate(70 600)" />
                </svg>
              </div>
              <div className="home-chain-steps">
                {CHAIN.map((step, i) => (
                  <article key={step.title} className={`home-chain-step${i === 0 ? " is-active" : ""}`}>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-journey" aria-label="A connected conservation journey">
        <h2 className="home-journey-title home-reveal">For the forest.<br />For the future.</h2>
        <div className="home-cards">
          {JOURNEY.map((item, i) => (
            <Link
              key={item.title}
              href={item.href}
              className="home-card home-reveal"
              style={{ "--reveal-i": i } as CSSProperties}
            >
              <Image
                src={`/images/home/${item.image}`}
                alt={item.alt}
                fill
                sizes="(min-width: 1152px) 352px, (min-width: 768px) 33vw, 100vw"
                className="home-card-photo"
                style={{ objectPosition: item.position }}
              />
              <span className="home-card-shade" aria-hidden="true" />
              <span className="home-card-glow" aria-hidden="true" />
              <span className="home-card-glass">
                <span className="home-card-title">{item.title}<Arrow /></span>
                <span className="home-card-desc">{item.description}</span>
                <span className="home-card-action">{item.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-close" aria-label="Start exploring">
        <div className="home-close-grid">
          <div>
            <h2 className="home-close-title home-reveal">The catalogue grows one verified record at a time.</h2>
            <div className="home-close-actions home-reveal" style={{ "--reveal-i": 1 } as CSSProperties}>
              <Link href="/explore" className="home-btn">Browse the published catalogue<Arrow /></Link>
              <Link href="/map" className="home-btn home-btn--ghost">Open the species map<Arrow /></Link>
              <Link href="/signin" className="home-btn home-btn--ghost">Sign in to contribute<Arrow /></Link>
            </div>
          </div>
          <div className="home-colophon home-reveal" style={{ "--reveal-i": 2 } as CSSProperties}>
            <p className="home-colophon-mark">plantiful<span>.</span></p>
            <p>
              Built for Sarawak Forestry Corporation at Niah National Park, with
              industry partner NeuonAI. Photographs ship with the project asset
              library; the frond illustration is part of the Plantiful brand.
            </p>
            <p>Every public record is reviewed before publication.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
