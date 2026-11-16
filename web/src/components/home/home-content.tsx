"use client";

import { useId, useRef, type CSSProperties } from "react";
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

const CHAIN_ICONS: string[][] = [
  ["M9 9h17v17H9z", "M14.5 14.5h6v6h-6z", "M38 9h17v17H38z", "M43.5 14.5h6v6h-6z", "M9 38h17v17H9z", "M14.5 43.5h6v6h-6z", "M38 38h8v8h-8z", "M48 48h7v7h-7z"],
  ["M10 21h7l4-7h22l4 7h7a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V25a4 4 0 0 1 4-4z", "M41 35a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"],
  ["M50 32a18 18 0 0 1-30 13", "M20 45l-7 1 2-7", "M14 32a18 18 0 0 1 30-13", "M44 19l7-1-2 7"],
  ["M42 27a15 15 0 1 1-30 0 15 15 0 0 1 30 0z", "M38 38l15 15", "M20 27l5 5 10-10"],
  ["M32 56V31", "M32 31C32 19 23 12 11 12c1 12 9 19 21 19z", "M32 31c0-10 8-16 21-16-1 11-9 16-21 16z"],
];

function ChainIcon({ stage }: { stage: number }) {
  return (
    <svg
      className={`chain-icon${stage === CHAIN.length - 1 ? " chain-icon--peak" : ""}`}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {CHAIN_ICONS[stage].map((d, j) => (
        <path key={j} d={d} pathLength={1} style={{ "--pi": j } as CSSProperties} />
      ))}
    </svg>
  );
}

function ChainBackdrop() {
  return (
    <g>
      <path d="M120 0 L180 0 L60 520 L20 520 Z" fill="url(#sc-shaft)" />
      <path d="M300 0 L340 0 L260 520 L230 520 Z" fill="url(#sc-shaft)" />
      <path d="M212 0 L240 0 L182 520 L162 520 Z" fill="url(#sc-shaft)" />
      <g fill="#123a28">
        <path d="M0 0 C40 10 70 40 78 84 C40 76 10 46 0 12 Z" />
        <path d="M0 40 C36 44 62 66 70 102 C36 96 8 74 0 48 Z" opacity=".85" />
        <path d="M30 0 C52 18 64 44 62 74 C40 58 28 30 30 0 Z" opacity=".7" />
        <path d="M0 96 C30 104 52 128 56 162 C28 154 6 130 0 104 Z" opacity=".6" />
        <path d="M440 0 C400 10 370 40 362 84 C400 76 430 46 440 12 Z" />
        <path d="M440 40 C404 44 378 66 370 102 C404 96 432 74 440 48 Z" opacity=".85" />
        <path d="M410 0 C388 18 376 44 378 74 C400 58 412 30 410 0 Z" opacity=".7" />
        <path d="M440 96 C410 104 388 128 384 162 C412 154 434 130 440 104 Z" opacity=".6" />
      </g>
      <g fill="#0e2c1d">
        <path d="M0 250 C26 244 48 258 54 284 C30 286 8 272 0 258 Z" opacity=".75" />
        <path d="M440 240 C414 234 392 248 386 274 C410 276 432 262 440 248 Z" opacity=".75" />
        <path d="M0 330 C22 326 40 338 44 360 C24 362 6 350 0 338 Z" opacity=".6" />
        <path d="M440 320 C418 316 400 328 396 350 C416 352 434 340 440 328 Z" opacity=".6" />
      </g>
      <g fill="#0e2c1d">
        <path d="M0 520 C10 480 8 452 16 428 C24 452 22 484 30 520 Z" />
        <path d="M40 520 C48 488 46 462 54 440 C62 462 60 492 68 520 Z" />
        <path d="M90 520 C96 494 94 474 100 456 C106 474 104 498 110 520 Z" opacity=".7" />
        <path d="M330 520 C336 494 334 474 340 456 C346 474 344 498 350 520 Z" opacity=".7" />
        <path d="M380 520 C388 486 386 460 394 438 C402 460 400 490 408 520 Z" />
        <path d="M412 520 C420 484 418 456 426 432 C434 456 432 488 440 520 Z" />
      </g>
      <g>
        <circle className="sc-spore" style={{ "--sp": 0 } as CSSProperties} cx="70" cy="150" r="3" fill="#e3ef26" />
        <circle className="sc-spore" style={{ "--sp": 1 } as CSSProperties} cx="380" cy="120" r="2.5" fill="#6fd6b0" />
        <circle className="sc-spore" style={{ "--sp": 2 } as CSSProperties} cx="350" cy="400" r="3" fill="#e3ef26" />
        <circle className="sc-spore" style={{ "--sp": 3 } as CSSProperties} cx="90" cy="420" r="2.5" fill="#6fd6b0" />
        <circle className="sc-spore" style={{ "--sp": 4 } as CSSProperties} cx="58" cy="280" r="2" fill="#6fd6b0" />
        <circle className="sc-spore" style={{ "--sp": 5 } as CSSProperties} cx="392" cy="300" r="2" fill="#e3ef26" />
      </g>
    </g>
  );
}

function ChainBackdropLayer() {
  return (
    <svg className="chain-backdrop" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sc-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2fbce" stopOpacity="0" />
          <stop offset=".3" stopColor="#e2fbce" stopOpacity=".07" />
          <stop offset=".7" stopColor="#e2fbce" stopOpacity=".06" />
          <stop offset="1" stopColor="#e2fbce" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ChainBackdrop />
    </svg>
  );
}

function QrGlyph({ x, y, s = 40, ink = "#0c342c", paper = "#fffdee" }: { x: number; y: number; s?: number; ink?: string; paper?: string }) {
  const u = s / 8;
  const finder = (fx: number, fy: number) => (
    <g key={`${fx}-${fy}`}>
      <rect x={fx} y={fy} width={u * 2.6} height={u * 2.6} fill={ink} />
      <rect x={fx + u * 0.55} y={fy + u * 0.55} width={u * 1.5} height={u * 1.5} fill={paper} />
      <rect x={fx + u * 0.95} y={fy + u * 0.95} width={u * 0.7} height={u * 0.7} fill={ink} />
    </g>
  );
  return (
    <g>
      {finder(x, y)}
      {finder(x + s - u * 2.6, y)}
      {finder(x, y + s - u * 2.6)}
      <g fill={ink}>
        <rect x={x + u * 3.4} y={y + u * 3.4} width={u} height={u} />
        <rect x={x + u * 4.8} y={y + u * 3.8} width={u * 0.8} height={u * 0.8} />
        <rect x={x + u * 3.8} y={y + u * 5} width={u * 0.8} height={u * 0.8} />
        <rect x={x + u * 5.2} y={y + u * 5.2} width={u} height={u} />
        <rect x={x + u * 6.2} y={y + u * 4.2} width={u * 0.7} height={u * 0.7} />
        <rect x={x + u * 4.6} y={y + u * 6.4} width={u * 0.7} height={u * 0.7} />
      </g>
    </g>
  );
}

function Ground({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.16} fill="#010806" opacity=".45" />;
}

function Badge({ cx, cy, r = 24 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill="#e3ef26" opacity=".18" />
      <circle cx={cx} cy={cy} r={r} fill="#e3ef26" />
      <path d={`M${cx - r * 0.42} ${cy + r * 0.02} l${r * 0.3} ${r * 0.32} l${r * 0.56} ${-r * 0.62}`} stroke="#0c342c" strokeWidth={r * 0.18} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function DeviceBody({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 60} cy={y + 205} rx={62} ry={10} fill="#010806" opacity=".45" />
      <rect x={x + 117} y={y + 8} width={4} height={186} rx={2} fill="#082018" />
      <rect x={x} y={y} width={120} height={200} rx={20} fill="#0c342c" />
      <path d={`M${x + 22} ${y + 3} H${x + 98}`} stroke="#6fd6b0" strokeOpacity=".5" strokeWidth={2} strokeLinecap="round" />
      <rect x={x + 10} y={y + 16} width={100} height={158} rx={10} fill="#071c14" />
      <rect x={x + 10} y={y + 16} width={100} height={158} rx={10} fill="none" stroke="#6fd6b0" strokeOpacity=".3" strokeWidth={1.5} />
      <circle cx={x + 60} cy={y + 8} r={2.5} fill="#071c14" stroke="#6fd6b0" strokeWidth={1} />
      <rect x={x + 44} y={y + 184} width={32} height={4} rx={2} fill="#6fd6b0" opacity=".5" />
    </g>
  );
}

function Soil({ cx, cy, rx }: { cx: number; cy: number; rx: number }) {
  const gid = useId();
  const h = rx * 0.42;
  const topRy = rx * 0.22;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d5244" />
          <stop offset="1" stopColor="#082018" />
        </linearGradient>
      </defs>
      <ellipse cx={cx} cy={cy + h + topRy * 0.3} rx={rx * 1.12} ry={rx * 0.18} fill="#010806" opacity=".5" />
      <path d={`M${cx - rx} ${cy} C${cx - rx * 0.9} ${cy + h * 0.7} ${cx - rx * 0.5} ${cy + h} ${cx} ${cy + h} C${cx + rx * 0.5} ${cy + h} ${cx + rx * 0.9} ${cy + h * 0.7} ${cx + rx} ${cy} Z`} fill={`url(#${gid})`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={topRy} fill="#3a7d5c" />
      <ellipse cx={cx - rx * 0.15} cy={cy - topRy * 0.15} rx={rx * 0.55} ry={topRy * 0.5} fill="#4a9468" opacity=".55" />
      <ellipse cx={cx} cy={cy} rx={rx} ry={topRy} fill="none" stroke="#4a9468" strokeWidth={2} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.2} ry={topRy * 0.42} fill="#0a2418" />
      <ellipse cx={cx} cy={cy - topRy * 0.08} rx={rx * 0.2} ry={topRy * 0.34} fill="none" stroke="#2f6b4f" strokeWidth={2} />
      <circle cx={cx - rx * 0.5} cy={cy + topRy * 0.2} r={2.6} fill="#2f6b4f" />
      <circle cx={cx + rx * 0.48} cy={cy + topRy * 0.3} r={2.2} fill="#2f6b4f" />
      <circle cx={cx + rx * 0.22} cy={cy - topRy * 0.32} r={1.8} fill="#16402c" />
      <circle cx={cx - rx * 0.3} cy={cy - topRy * 0.35} r={1.5} fill="#16402c" />
      <path d={`M${cx - rx * 0.7} ${cy} q2 -10 5 -13 M${cx - rx * 0.66} ${cy} q-1 -9 -4 -11 M${cx - rx * 0.62} ${cy + 2} q3 -7 6 -9`} stroke="#6fd6b0" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity=".8" />
      <path d={`M${cx + rx * 0.68} ${cy + 2} q1 -9 4 -12 M${cx + rx * 0.72} ${cy + 2} q2 -7 5 -9`} stroke="#6fd6b0" strokeWidth={1.8} strokeLinecap="round" fill="none" opacity=".7" />
    </g>
  );
}

function Leaf({ x, y, s = 1, flip = false, angle = 0, veins = "full", round = false }: { x: number; y: number; s?: number; flip?: boolean; angle?: number; veins?: "full" | "soft" | "none"; round?: boolean }) {
  const cid = useId();
  const blade = round ? "M0 0 C12 -4 28 -14 38 -30 C26 -28 10 -18 0 0 Z" : "M0 0 C6 -28 30 -52 60 -54 C38 -26 14 -2 0 0 Z";
  const midrib = round ? "M0 0 L38 -30" : "M0 0 L60 -54";
  const veinPath = veins === "full"
    ? "M10 -9 C2 -14 2 -24 8 -32 M24 -22 C16 -27 16 -37 22 -45 M38 -34 C32 -38 32 -46 37 -52 M10 -9 C18 -5 26 -3 34 -3 M24 -22 C32 -18 40 -16 48 -16"
    : "M14 -12 C8 -17 7 -25 11 -33 M30 -27 C24 -32 23 -39 27 -46 M14 -12 C20 -8 27 -6 34 -5";
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${flip ? -s : s} ${s})`}>
      <defs><clipPath id={cid}><path d={blade} /></clipPath></defs>
      <path d={blade} fill="#076653" transform="translate(1.5 3)" />
      <path d={blade} fill="#479e65" />
      <g clipPath={`url(#${cid})`}>
        <path d={midrib} stroke="#e2fbce" strokeOpacity={round ? ".35" : ".6"} strokeWidth={round ? 1.5 : 2} strokeLinecap="round" />
        {veins !== "none" && <path d={veinPath} stroke="#e2fbce" strokeOpacity={veins === "full" ? ".5" : ".3"} strokeWidth={veins === "full" ? 1.5 : 1.2} strokeLinecap="round" fill="none" />}
      </g>
    </g>
  );
}

function PlantTag({ x, y, s = 70 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 70})`}>
      <path d="M35 12 C23 20 23 32 35 36 C47 32 47 20 35 12 Z" fill="none" stroke="#a0bd77" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="0" y="0" width="70" height="88" rx="9" fill="#fffdee" />
      <rect x="0" y="0" width="70" height="88" rx="9" fill="none" stroke="#0c342c" strokeOpacity=".2" strokeWidth="1.5" />
      <circle cx="35" cy="12" r="3.5" fill="#0e2c1d" />
      <QrGlyph x={11} y={24} s={48} ink="#0c342c" paper="#fffdee" />
      <path d="M11 78 h48" stroke="#0c342c" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Printer({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x + 70} cy={y + 84} rx={74} ry={9} fill="#010806" opacity=".4" />
      <rect x={x + 136} y={y + 8} width={4} height={62} rx={2} fill="#082018" />
      <rect x={x} y={y} width={140} height={76} rx={14} fill="#0c342c" />
      <path d={`M${x + 18} ${y + 3.5} H${x + 122}`} stroke="#6fd6b0" strokeOpacity=".5" strokeWidth={2} strokeLinecap="round" />
      <circle cx={x + 36} cy={y + 36} r={16} fill="#071c14" stroke="#6fd6b0" strokeWidth={2} />
      <circle cx={x + 36} cy={y + 36} r={5} fill="#6fd6b0" />
      <path d={`M${x + 66} ${y + 28} h52 M${x + 66} ${y + 42} h36`} stroke="#6fd6b0" strokeWidth={2.5} strokeLinecap="round" opacity=".6" />
      <circle cx={x + 124} cy={y + 14} r={4.5} fill="#e3ef26" />
      <rect x={x + 35} y={y + 68} width={70} height={8} rx={4} fill="#071c14" stroke="#6fd6b0" strokeOpacity=".4" strokeWidth={1} />
    </g>
  );
}

function SceneSeed() {
  return (
    <svg className="chain-seed" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="scs-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".13" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".05" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse className="sc-glow" cx="220" cy="400" rx="160" ry="160" fill="url(#scs-glow)" />
      <Soil cx={220} cy={450} rx={72} />
      <path d="M220 450 C219 428 221 404 220 380 C220 376 220 374 220 372" stroke="#a0bd77" strokeWidth="6" strokeLinecap="round" />
      <Leaf x={220} y={412} s={0.8} flip round veins="none" />
      <Leaf x={220} y={412} s={0.8} round veins="none" />
      <Leaf x={220} y={388} s={0.5} flip angle={-6} veins="soft" />
      <Leaf x={220} y={388} s={0.5} angle={6} veins="soft" />
      <path d="M220 372 C220 362 225 355 232 355 C239 355 242 362 237 367 C233 371 228 368 229 363 C230 360 233 359 235 361" stroke="#479e65" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      <circle cx="235" cy="361" r="2.5" fill="#e3ef26" />
    </svg>
  );
}

function SceneTag() {
  return (
    <svg className="chain-scene" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sc0-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".14" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".05" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="220" cy="300" rx="200" ry="235" fill="url(#sc0-glow)" />
      <Printer x={150} y={60} />
      <Soil cx={220} cy={472} rx={90} />
      <path d="M220 472 C217 428 223 380 220 330 C218 280 222 240 220 204" stroke="#a0bd77" strokeWidth="7" strokeLinecap="round" />
      <Leaf x={220} y={292} s={1} />
      <Leaf x={220} y={252} s={1} flip />
      <Leaf x={220} y={226} s={0.7} flip angle={-6} />
      <path d="M220 206 C214 200 211 192 213 184 C218 190 220 198 220 206 Z" fill="#479e65" />
      <path d="M220 206 C226 200 229 192 227 184 C222 190 220 198 220 206 Z" fill="#479e65" />
      <path className="sc-bud" d="M220 204 C213 194 213 182 220 173 C227 182 227 194 220 204 Z" fill="#e3ef26" />
      <g className="sc-tag"><PlantTag x={185} y={138} s={70} /></g>
    </svg>
  );
}

function SceneRecord() {
  return (
    <svg className="chain-scene" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sc1-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".13" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".05" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient>
        <linearGradient id="sc1-scan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e3ef26" stopOpacity=".3" /><stop offset="1" stopColor="#e3ef26" stopOpacity="0" /></linearGradient>
      </defs>
      <ellipse cx="220" cy="290" rx="205" ry="235" fill="url(#sc1-glow)" />
      <path d="M190 250 L310 330" stroke="#6fd6b0" strokeWidth="2" strokeDasharray="3 8" strokeLinecap="round" opacity=".5" />
      <DeviceBody x={70} y={170} />
      <rect x="90" y="196" width="80" height="42" rx="5" fill="#0e2c1d" stroke="#6fd6b0" strokeOpacity=".4" strokeWidth="1.5" />
      <path d="M130 232 C129 222 131 214 130 206" stroke="#a0bd77" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 220 C122 218 116 212 115 205 C122 207 128 212 130 220 Z" fill="#479e65" />
      <path d="M130 214 C138 212 144 206 145 199 C138 201 132 206 130 214 Z" fill="#479e65" />
      <circle cx="130" cy="203" r="2.5" fill="#e3ef26" />
      <g stroke="#6fd6b0" strokeWidth="3" strokeLinecap="round">
        <path className="sc-field" style={{ "--fi": 0 } as CSSProperties} d="M92 250 h60" />
        <path className="sc-field" style={{ "--fi": 1 } as CSSProperties} d="M92 264 h72" />
        <path className="sc-field" style={{ "--fi": 2 } as CSSProperties} d="M92 278 h48" />
      </g>
      <path d="M94 292 c0 -6 9 -6 9 0 c0 4.5 -4.5 8 -4.5 8 c0 0 -4.5 -3.5 -4.5 -8 z" fill="#e3ef26" />
      <path d="M108 294 h56" stroke="#6fd6b0" strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
      <g fill="#6fd6b0" opacity=".5">
        {Array.from({ length: 8 }).map((_, k) => {
          const r = Math.floor(k / 4), c = k % 4;
          return <rect key={k} x={92 + c * 18} y={308 + r * 13} width="13" height="8" rx="2" />;
        })}
      </g>
      <rect x="146" y="321" width="13" height="8" rx="2" fill="#e3ef26" opacity=".85" />
      <g className="sc-typing" fill="#e3ef26"><circle cx="120" cy="334" r="2.2" /><circle cx="130" cy="334" r="2.2" /><circle cx="140" cy="334" r="2.2" /></g>
      <Soil cx={362} cy={468} rx={60} />
      <path d="M362 468 C360 436 364 410 362 378 C361 356 363 340 362 322" stroke="#a0bd77" strokeWidth="5" strokeLinecap="round" />
      <Leaf x={362} y={410} s={0.7} flip />
      <Leaf x={362} y={378} s={0.7} />
      <Leaf x={362} y={348} s={0.55} flip angle={-6} />
      <path d="M362 324 C357 319 355 312 356 306 C360 311 362 317 362 324 Z" fill="#479e65" />
      <path d="M362 324 C367 319 369 312 368 306 C364 311 362 317 362 324 Z" fill="#479e65" />
      <circle cx="362" cy="303" r="4" fill="#e3ef26" />
      <PlantTag x={340} y={418} s={44} />
      <g stroke="#6fd6b0" strokeWidth="3" strokeLinecap="round" opacity=".9">
        <path d="M310 304 v-18 h18" /><path d="M404 286 h18 v18" /><path d="M422 458 v18 h-18" /><path d="M328 476 h-18 v-18" />
      </g>
      <g className="sc-scan">
        <rect x="312" y="288" width="108" height="12" fill="url(#sc1-scan)" />
        <rect x="312" y="288" width="108" height="3" rx="1.5" fill="#e3ef26" />
      </g>
    </svg>
  );
}

function SceneSync() {
  return (
    <svg className="chain-scene" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sc2-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".13" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".05" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="220" cy="280" rx="205" ry="235" fill="url(#sc2-glow)" />
      <DeviceBody x={40} y={180} />
      <rect x="60" y="206" width="56" height="66" rx="6" fill="#0e2c1d" stroke="#6fd6b0" strokeOpacity=".4" strokeWidth="1.5" />
      <QrGlyph x={68} y={214} s={40} ink="#6fd6b0" paper="#0e2c1d" />
      <circle cx="132" cy="222" r="6" fill="#e3ef26" />
      <path d="M62 292 h72" stroke="#6fd6b0" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <path d="M62 306 h52" stroke="#6fd6b0" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
      <path d="M118 330 l14 -14 M132 316 v10 M132 316 h-10" stroke="#e3ef26" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g stroke="#6fd6b0" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M168 245 A12 12 0 0 1 168 265" opacity=".85" />
        <path d="M176 238 A22 22 0 0 1 176 272" opacity=".55" />
        <path d="M184 231 A32 32 0 0 1 184 279" opacity=".3" />
      </g>
      <path d="M190 255 H300" stroke="#6fd6b0" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" opacity=".3" />
      <circle className="sc-packet" style={{ "--pk": 0 } as CSSProperties} cx="190" cy="255" r="6" fill="#e3ef26" />
      <circle className="sc-packet" style={{ "--pk": 1 } as CSSProperties} cx="190" cy="255" r="6" fill="#e3ef26" />
      <circle className="sc-packet" style={{ "--pk": 2 } as CSSProperties} cx="190" cy="255" r="6" fill="#e3ef26" />
      <ellipse cx="355" cy="476" rx="80" ry="11" fill="#010806" opacity=".45" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x="300" y={160 + i * 72} width="110" height="60" rx="10" fill="#076653" />
          <rect x="300" y={160 + i * 72} width="110" height="60" rx="10" fill="none" stroke="#6fd6b0" strokeOpacity=".3" strokeWidth="1.5" />
          <path d={`M308 ${164 + i * 72} H402`} stroke="#e2fbce" strokeOpacity=".4" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="318" cy={190 + i * 72} r="4.5" fill={i === 1 ? "#e3ef26" : "#6fd6b0"} />
          <path d={`M334 ${190 + i * 72} h56`} stroke="#e2fbce" strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

function SceneReview() {
  return (
    <svg className="chain-scene" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs><radialGradient id="sc3-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".13" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".05" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient></defs>
      <ellipse cx="220" cy="280" rx="200" ry="235" fill="url(#sc3-glow)" />
      <Ground cx={224} cy={478} rx={110} />
      <rect x="128" y="128" width="200" height="280" rx="14" fill="#0e2c1d" />
      <rect x="120" y="120" width="200" height="280" rx="14" fill="#fffdee" />
      <rect x="142" y="142" width="70" height="70" rx="7" fill="#f3f0e3" stroke="#0c342c" strokeOpacity=".2" strokeWidth="1.5" />
      <QrGlyph x={150} y={150} s={54} ink="#0c342c" paper="#f3f0e3" />
      <path d="M226 156 h72 M226 178 h54 M226 200 h62" stroke="#0c342c" strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <path d="M142 232 h156" stroke="#0c342c" strokeOpacity=".2" strokeWidth="2" strokeLinecap="round" />
      <path d="M142 254 h156 M142 278 h132 M142 302 h146 M142 326 h108" stroke="#0c342c" strokeWidth="2.5" strokeLinecap="round" opacity=".45" />
      <rect x="142" y="344" width="70" height="40" rx="8" fill="#e2fbce" />
      <path d="M160 372 C160 362 168 356 176 356 C176 366 168 372 160 372 Z" fill="#479e65" />
      <path d="M160 372 L176 356" stroke="#076653" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M186 364 h18" stroke="#0c342c" strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="222" y="344" width="70" height="40" rx="8" fill="#e2fbce" />
      <path d="M238 360 c0 -6 9 -6 9 0 c0 4.5 -4.5 8 -4.5 8 c0 0 -4.5 -3.5 -4.5 -8 z" fill="#076653" />
      <path d="M254 364 h30" stroke="#0c342c" strokeOpacity=".5" strokeWidth="2.5" strokeLinecap="round" />
      <g className="sc-mag">
        <defs>
          <radialGradient id="sc3-lens" cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#fffdee" stopOpacity=".3" /><stop offset=".5" stopColor="#6fd6b0" stopOpacity=".14" /><stop offset="1" stopColor="#6fd6b0" stopOpacity=".06" /></radialGradient>
          <clipPath id="sc3-lensclip"><circle cx="186" cy="262" r="38" /></clipPath>
        </defs>
        <circle cx="186" cy="262" r="40" fill="url(#sc3-lens)" />
        <g clipPath="url(#sc3-lensclip)">
          <path d="M158 250 h56 M158 270 h44 M158 290 h50" stroke="#0c342c" strokeWidth="7" strokeLinecap="round" opacity=".8" />
        </g>
        <circle cx="186" cy="262" r="40" fill="none" stroke="#0c342c" strokeWidth="5" />
        <circle cx="186" cy="262" r="40" fill="none" stroke="#e3ef26" strokeWidth="2" />
        <path d="M164 244 A28 28 0 0 1 192 236" stroke="#fffdee" strokeOpacity=".85" strokeWidth="4" strokeLinecap="round" />
        <path d="M158 254 A32 32 0 0 1 165 243" stroke="#fffdee" strokeOpacity=".45" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M214 290 L248 324" stroke="#0c342c" strokeWidth="10" strokeLinecap="round" />
        <path d="M214 290 L248 324" stroke="#e3ef26" strokeWidth="4" strokeLinecap="round" />
      </g>
      <g className="sc-check">
        <Badge cx={296} cy={372} r={26} />
      </g>
    </svg>
  );
}

function SceneCanopy() {
  return (
    <svg className="chain-scene" viewBox="0 0 440 520" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="sc4-glow"><stop offset="0" stopColor="#6fd6b0" stopOpacity=".18" /><stop offset=".6" stopColor="#6fd6b0" stopOpacity=".07" /><stop offset="1" stopColor="#6fd6b0" stopOpacity="0" /></radialGradient>
        <linearGradient id="sc4-canopy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0e2c1d" stopOpacity="0" /><stop offset=".55" stopColor="#0e2c1d" stopOpacity=".85" /><stop offset="1" stopColor="#0e2c1d" stopOpacity=".85" /></linearGradient>
      </defs>
      <ellipse className="sc-glow" cx="220" cy="280" rx="200" ry="235" fill="url(#sc4-glow)" />
      <path d="M0 0 H440 V40 C400 66 360 58 320 78 C280 100 250 140 220 150 C190 140 160 100 120 78 C80 58 40 66 0 40 Z" fill="url(#sc4-canopy)" />
      <g fill="#123a28" opacity=".85">
        <path d="M70 62 C82 88 80 116 64 134 C52 110 56 82 70 62 Z" />
        <path d="M150 70 C164 96 162 124 146 142 C134 118 138 92 150 70 Z" />
        <path d="M220 72 C236 100 236 132 220 156 C204 132 204 100 220 72 Z" />
        <path d="M290 70 C304 96 302 124 286 142 C274 118 278 92 290 70 Z" />
        <path d="M370 62 C382 88 380 116 364 134 C352 110 356 82 370 62 Z" />
      </g>
      <Soil cx={220} cy={472} rx={90} />
      <path d="M220 472 C217 426 223 376 220 326 C217 280 223 248 220 214" stroke="#a0bd77" strokeWidth="7" strokeLinecap="round" />
      <Leaf x={220} y={420} s={1} flip />
      <Leaf x={220} y={364} s={1} />
      <Leaf x={220} y={303} s={0.8} flip angle={-5} />
      <Leaf x={220} y={255} s={0.8} angle={5} />
      <g className="sc-bloom">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <path key={a} d="M220 190 C208 166 207 138 220 112 C233 138 232 166 220 190 Z" fill="#e3ef26" transform={`rotate(${a} 220 190)`} />
        ))}
        {[30, 90, 150, 210, 270, 330].map((a) => (
          <path key={a} d="M220 190 C212 172 211 152 220 134 C229 152 228 172 220 190 Z" fill="#f4fbb0" transform={`rotate(${a} 220 190)`} />
        ))}
        <circle cx="220" cy="190" r="13" fill="#fffdee" />
        <circle cx="220" cy="190" r="6" fill="#e3ef26" />
        <g fill="#b8cc1a"><circle cx="214" cy="186" r="1.8" /><circle cx="226" cy="188" r="1.8" /><circle cx="220" cy="196" r="1.8" /></g>
      </g>
    </svg>
  );
}

const CHAIN_SCENES = [SceneTag, SceneRecord, SceneSync, SceneReview, SceneCanopy];

function ChainScenes() {
  return (
    <>
      {CHAIN_SCENES.map((Scene, i) => (
        <Scene key={i} />
      ))}
    </>
  );
}

function formatFix(record: RecordListItem): string {
  if (record.gpsLat === null || record.gpsLng === null) return "GPS fix not recorded";
  const acc = record.gpsAccuracyM !== null ? ` · ±${Math.round(record.gpsAccuracyM)}\u00A0m` : "";
  return `${record.gpsLat.toFixed(2)}° N, ${record.gpsLng.toFixed(2)}° E${acc}`;
}

export function HomeContent({
  records,
}: {
  records: RecordListItem[];
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
              <p className="live-chip-meta">{formatFix(featured)}<span className="live-chip-meta-date">captured {featured.createdAt.slice(0, 10)}</span></p>
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
          <path fill="#0e2c1d" d="M-0.4 300 C1.8 212.5 -6.4 156.8 -2.8 140.8 C1.5 172.7 12.5 228.4 13.9 300 ZM11.1 300 C12.3 209.5 10.1 151.9 12.0 135.5 C14.3 168.4 18.0 226.0 18.8 300 ZM23.2 300 C24.2 187.5 7.3 115.8 9.0 95.4 C11.1 136.3 29.3 207.9 30.0 300 ZM30.1 300 C31.9 185.7 -6.0 112.9 -2.9 92.1 C0.7 133.7 41.1 206.5 42.3 300 ZM48.0 300 C49.8 169.0 53.4 85.7 56.4 61.9 C59.9 109.5 58.7 192.8 59.9 300 ZM52.7 300 C54.3 270.9 18.3 252.4 21.0 247.1 C24.2 257.7 62.4 276.2 63.5 300 ZM64.1 300 C65.0 246.6 59.9 212.5 61.5 202.8 C63.3 222.3 69.7 256.3 70.3 300 ZM77.1 300 C78.7 182.1 84.5 107.2 87.2 85.7 C90.4 128.6 86.7 203.6 87.7 300 ZM88.6 300 C90.1 201.5 70.1 138.7 72.6 120.8 C75.7 156.7 97.7 219.4 98.7 300 ZM103.6 300 C105.6 165.7 115.1 80.3 118.5 55.8 C122.6 104.7 115.8 190.1 117.1 300 ZM109.3 300 C110.6 247.9 76.2 214.7 78.4 205.2 C81.0 224.2 117.1 257.3 117.9 300 ZM123.9 300 C126.0 229.6 112.3 184.7 115.7 171.9 C119.8 197.5 136.2 242.4 137.5 300 ZM136.5 300 C137.4 181.6 114.1 106.3 115.6 84.8 C117.4 127.8 141.9 203.1 142.5 300 ZM147.2 300 C149.4 222.1 136.1 172.5 139.8 158.4 C144.2 186.7 160.5 236.3 162.0 300 ZM151.8 300 C153.7 205.0 131.9 144.5 135.2 127.3 C139.1 161.8 163.5 222.3 164.8 300 ZM163.0 300 C165.2 236.8 177.9 196.6 181.5 185.1 C185.9 208.1 176.2 248.3 177.6 300 ZM174.3 300 C175.3 246.1 140.9 211.8 142.6 202.0 C144.7 221.6 180.5 255.9 181.2 300 ZM190.6 300 C192.3 253.4 184.1 223.8 186.8 215.4 C190.1 232.3 200.5 261.9 201.6 300 ZM197.0 300 C198.1 194.0 205.5 126.6 207.3 107.3 C209.5 145.8 203.4 213.3 204.2 300 ZM207.5 300 C208.7 227.4 188.9 181.2 190.9 168.0 C193.3 194.4 214.6 240.6 215.4 300 ZM225.2 300 C226.5 186.3 250.7 114.0 252.9 93.3 C255.5 134.7 233.1 207.0 233.9 300 ZM230.4 300 C232.4 230.2 237.2 185.8 240.6 173.1 C244.7 198.5 242.7 242.9 244.1 300 ZM240.6 300 C241.8 166.4 221.2 81.4 223.2 57.1 C225.6 105.7 247.7 190.7 248.5 300 ZM256.9 300 C258.2 237.2 224.0 197.3 226.2 185.9 C228.8 208.7 264.7 248.6 265.6 300 ZM262.7 300 C263.9 210.0 267.9 152.7 270.0 136.4 C272.4 169.1 270.0 226.4 270.9 300 ZM275.9 300 C278.1 223.9 271.1 175.5 274.8 161.6 C279.1 189.3 289.1 237.7 290.6 300 ZM288.6 300 C289.7 179.6 261.8 102.9 263.7 81.0 C266.0 124.8 295.5 201.5 296.2 300 ZM302.2 300 C303.5 184.8 277.8 111.5 279.9 90.5 C282.4 132.4 309.7 205.7 310.5 300 ZM312.0 300 C313.2 171.6 342.5 90.0 344.4 66.6 C346.8 113.3 319.0 195.0 319.8 300 ZM324.2 300 C325.7 207.8 293.2 149.1 295.7 132.3 C298.6 165.8 333.0 224.5 334.0 300 ZM328.7 300 C330.0 169.3 341.4 86.0 343.5 62.3 C345.9 109.8 336.1 193.0 336.9 300 ZM341.5 300 C343.2 184.2 323.8 110.4 326.6 89.4 C330.0 131.5 351.7 205.2 352.9 300 ZM351.9 300 C352.9 195.2 330.7 128.6 332.4 109.5 C334.4 147.6 357.9 214.3 358.6 300 ZM366.0 300 C367.7 181.1 347.3 105.4 350.2 83.8 C353.6 127.0 376.4 202.7 377.5 300 ZM379.9 300 C380.8 250.6 361.7 219.2 363.2 210.2 C365.1 228.2 385.4 259.6 386.0 300 ZM387.3 300 C388.4 266.0 375.9 244.4 377.8 238.2 C380.1 250.6 394.1 272.2 394.9 300 ZM399.3 300 C400.7 258.4 425.2 231.9 427.5 224.3 C430.3 239.5 407.7 266.0 408.6 300 ZM413.6 300 C415.4 202.0 416.6 139.7 419.7 121.9 C423.3 157.5 424.6 219.9 425.8 300 ZM418.1 300 C419.1 268.7 446.1 248.8 447.7 243.2 C449.5 254.5 423.7 274.4 424.3 300 ZM433.6 300 C434.5 169.2 441.8 86.0 443.4 62.3 C445.2 109.8 439.1 193.0 439.7 300 ZM442.9 300 C444.3 194.2 476.7 126.8 478.9 107.6 C481.6 146.0 450.9 213.4 451.8 300 ZM450.9 300 C452.8 213.9 476.5 159.2 479.7 143.5 C483.5 174.8 462.2 229.6 463.5 300 ZM467.1 300 C469.0 197.0 493.7 131.5 496.9 112.8 C500.9 150.2 478.9 215.8 480.2 300 ZM475.2 300 C477.3 199.0 498.4 134.8 501.9 116.4 C506.1 153.1 487.9 217.4 489.3 300 ZM486.7 300 C488.8 187.7 488.5 116.3 492.0 95.8 C496.1 136.7 499.1 208.1 500.5 300 ZM499.4 300 C501.1 231.5 504.5 187.9 507.3 175.4 C510.6 200.4 509.6 244.0 510.7 300 ZM506.3 300 C508.5 203.9 529.9 142.8 533.6 125.3 C538.1 160.3 519.7 221.4 521.2 300 ZM522.4 300 C524.3 230.8 525.1 186.8 528.2 174.3 C532.0 199.4 533.7 243.4 535.0 300 ZM531.2 300 C532.2 182.6 547.6 107.9 549.2 86.5 C551.3 129.2 537.3 203.9 538.0 300 ZM539.1 300 C540.7 208.0 517.1 149.5 519.7 132.7 C522.8 166.2 548.4 224.7 549.5 300 ZM555.4 300 C557.1 219.2 582.8 167.7 585.7 153.0 C589.1 182.4 565.8 233.9 566.9 300 ZM563.0 300 C564.3 271.3 573.7 253.0 575.9 247.8 C578.5 258.2 570.9 276.5 571.7 300 ZM573.7 300 C575.8 254.3 581.7 225.2 585.2 216.9 C589.5 233.5 586.4 262.6 587.8 300 ZM586.6 300 C588.0 176.9 596.3 98.5 598.6 76.1 C601.3 120.9 594.7 199.3 595.6 300 ZM595.8 300 C597.8 226.3 622.3 179.4 625.6 166.0 C629.6 192.8 607.7 239.7 609.1 300 ZM612.2 300 C613.9 231.3 596.2 187.5 599.0 175.0 C602.3 200.0 622.3 243.8 623.4 300 ZM617.5 300 C619.5 219.3 639.2 167.9 642.6 153.2 C646.7 182.6 629.7 233.9 631.0 300 ZM633.0 300 C634.3 170.6 607.1 88.3 609.2 64.7 C611.7 111.8 640.7 194.1 641.5 300 ZM642.1 300 C643.3 243.0 633.9 206.7 635.9 196.3 C638.3 217.1 649.2 253.4 650.0 300 ZM654.5 300 C655.8 219.5 676.7 168.3 678.9 153.7 C681.6 183.0 662.5 234.2 663.4 300 ZM668.4 300 C669.4 224.0 633.0 175.6 634.6 161.8 C636.6 189.4 674.4 237.8 675.0 300 ZM678.6 300 C680.4 268.1 680.6 247.7 683.7 241.9 C687.4 253.5 689.7 273.9 691.0 300 ZM685.3 300 C686.2 187.6 657.5 116.1 659.1 95.7 C660.9 136.5 690.8 208.0 691.5 300 ZM697.5 300 C699.5 269.8 675.2 250.7 678.6 245.2 C682.6 256.1 709.6 275.3 711.0 300 ZM706.1 300 C707.9 267.5 699.4 246.8 702.3 240.8 C705.8 252.7 716.6 273.4 717.8 300 ZM721.0 300 C723.0 202.2 750.7 140.0 754.0 122.3 C758.0 157.8 732.9 220.0 734.3 300 ZM732.5 300 C734.0 251.1 706.8 220.0 709.4 211.1 C712.5 228.9 741.8 260.0 742.8 300 ZM738.4 300 C740.2 221.9 712.1 172.1 715.3 157.9 C719.0 186.3 749.5 236.1 750.8 300 ZM751.5 300 C753.3 235.4 749.9 194.3 752.9 182.6 C756.6 206.1 762.5 247.2 763.7 300 ZM765.2 300 C766.6 191.4 783.8 122.3 786.2 102.5 C789.1 142.0 773.8 211.1 774.7 300 ZM778.5 300 C780.7 263.1 790.9 239.7 794.5 233.0 C798.9 246.4 791.5 269.8 792.9 300 ZM783.6 300 C785.3 223.9 810.2 175.4 813.1 161.6 C816.6 189.2 794.1 237.7 795.2 300 ZM796.6 300 C798.7 211.5 814.5 155.2 818.0 139.1 C822.1 171.3 809.1 227.6 810.5 300 ZM812.1 300 C813.8 222.8 787.8 173.6 790.8 159.6 C794.4 187.7 822.7 236.8 823.9 300 ZM821.4 300 C823.2 184.7 834.1 111.4 837.1 90.4 C840.6 132.3 832.0 205.7 833.2 300 ZM828.5 300 C830.8 176.0 859.2 97.1 862.9 74.5 C867.4 119.6 841.9 198.5 843.4 300 ZM842.1 300 C843.5 187.7 869.4 116.2 871.7 95.8 C874.3 136.6 850.1 208.1 851.0 300 ZM855.7 300 C856.7 235.1 849.7 193.8 851.4 182.0 C853.5 205.6 861.8 246.9 862.4 300 ZM864.4 300 C865.9 190.1 827.8 120.2 830.4 100.2 C833.6 140.2 873.7 210.1 874.8 300 ZM877.5 300 C879.5 265.6 850.6 243.8 853.9 237.5 C857.9 250.0 889.4 271.9 890.7 300 ZM884.9 300 C886.0 188.0 857.8 116.7 859.6 96.4 C861.8 137.1 891.4 208.4 892.1 300 ZM897.4 300 C899.4 194.9 907.6 128.0 911.0 108.9 C915.1 147.1 909.6 214.0 910.9 300 ZM911.8 300 C913.9 219.7 878.3 168.6 882.0 153.9 C886.3 183.2 924.9 234.3 926.3 300 ZM917.2 300 C918.5 216.0 931.5 162.6 933.7 147.3 C936.3 177.8 925.0 231.3 925.8 300 ZM931.5 300 C933.6 216.4 932.5 163.3 935.9 148.1 C939.9 178.4 943.8 231.6 945.1 300 ZM940.1 300 C942.1 231.6 965.5 188.1 968.9 175.7 C973.0 200.5 952.3 244.0 953.7 300 ZM950.4 300 C952.6 181.3 948.4 105.7 952.1 84.1 C956.5 127.3 963.6 202.8 965.1 300 ZM964.3 300 C965.9 250.9 961.8 219.7 964.5 210.8 C967.7 228.6 974.0 259.9 975.1 300 ZM975.6 300 C977.8 269.5 973.1 250.1 976.7 244.6 C981.2 255.7 988.8 275.1 990.3 300 ZM985.1 300 C986.7 186.6 981.7 114.4 984.4 93.8 C987.7 135.0 995.0 207.2 996.1 300 ZM998.4 300 C1000.0 265.4 989.5 243.4 992.2 237.1 C995.5 249.7 1008.2 271.7 1009.3 300 ZM1011.5 300 C1012.8 173.5 1007.5 92.9 1009.6 69.9 C1012.1 115.9 1019.1 196.5 1020.0 300 ZM1016.2 300 C1018.2 226.0 1041.7 178.9 1045.0 165.4 C1049.0 192.3 1028.2 239.4 1029.5 300 ZM1030.0 300 C1031.1 238.5 1036.5 199.3 1038.5 188.1 C1040.8 210.5 1036.9 249.7 1037.7 300 ZM1044.5 300 C1046.5 258.6 1006.9 232.3 1010.2 224.8 C1014.1 239.8 1056.2 266.1 1057.5 300 ZM1049.9 300 C1051.8 248.1 1034.1 215.1 1037.1 205.7 C1040.8 224.5 1060.9 257.6 1062.1 300 ZM1062.3 300 C1063.3 206.0 1077.2 146.2 1078.9 129.1 C1081.0 163.3 1068.5 223.1 1069.2 300 ZM1071.5 300 C1072.8 217.8 1047.7 165.4 1049.8 150.5 C1052.2 180.4 1079.0 232.7 1079.8 300 ZM1085.8 300 C1087.2 225.7 1077.2 178.3 1079.5 164.8 C1082.4 191.9 1094.2 239.2 1095.2 300 ZM1096.8 300 C1098.0 255.4 1104.3 227.0 1106.3 218.9 C1108.6 235.1 1103.9 263.5 1104.7 300 ZM1108.8 300 C1110.8 215.7 1113.4 162.1 1116.8 146.7 C1120.9 177.4 1121.1 231.0 1122.4 300 ZM1121.5 300 C1123.4 247.5 1140.7 214.2 1143.9 204.6 C1147.7 223.7 1132.9 257.1 1134.2 300 ZM1133.0 300 C1134.3 238.6 1161.2 199.6 1163.4 188.4 C1166.1 210.7 1140.9 249.8 1141.8 300 ZM1138.7 300 C1140.8 165.4 1108.9 79.8 1112.4 55.3 C1116.6 104.3 1151.3 189.9 1152.7 300 ZM1150.0 300 C1151.2 194.6 1118.9 127.5 1121.0 108.3 C1123.5 146.7 1157.5 213.7 1158.3 300 ZM1165.7 300 C1167.6 227.3 1135.4 181.0 1138.7 167.8 C1142.7 194.2 1177.5 240.5 1178.8 300 ZM1173.4 300 C1174.3 199.0 1150.3 134.7 1151.9 116.4 C1153.7 153.1 1178.9 217.4 1179.6 300 ZM1186.6 300 C1188.9 174.8 1155.3 95.1 1159.0 72.3 C1163.4 117.8 1199.9 197.5 1201.4 300 ZM1196.4 300 C1197.9 191.2 1207.1 121.9 1209.7 102.2 C1212.9 141.7 1205.8 211.0 1206.9 300 ZM1205.0 300 C1206.0 264.9 1169.9 242.6 1171.7 236.2 C1173.8 249.0 1211.2 271.3 1211.9 300 ZM1218.9 300 C1220.5 217.3 1190.6 164.6 1193.4 149.6 C1196.7 179.7 1228.9 232.3 1230.0 300 ZM1227.1 300 C1229.1 250.6 1259.0 219.2 1262.4 210.2 C1266.5 228.2 1239.3 259.6 1240.7 300 ZM1243.9 300 C1244.9 262.3 1274.8 238.3 1276.4 231.4 C1278.4 245.1 1249.8 269.1 1250.5 300 ZM1251.4 300 C1252.7 190.5 1246.8 120.8 1249.0 100.9 C1251.7 140.7 1259.4 210.4 1260.3 300 ZM1262.9 300 C1264.6 226.4 1225.0 179.5 1227.8 166.1 C1231.3 192.9 1273.2 239.8 1274.3 300 ZM1275.4 300 C1276.5 182.0 1270.2 106.8 1272.1 85.4 C1274.4 128.3 1282.3 203.4 1283.0 300 ZM1286.8 300 C1287.9 229.0 1260.7 183.9 1262.7 171.0 C1265.0 196.8 1293.8 241.9 1294.5 300 ZM1296.1 300 C1298.2 270.8 1314.3 252.3 1317.8 247.0 C1322.0 257.6 1308.7 276.1 1310.1 300 ZM1308.7 300 C1310.4 180.2 1298.9 103.9 1301.8 82.2 C1305.3 125.7 1319.2 202.0 1320.3 300 ZM1318.9 300 C1321.2 218.4 1337.2 166.5 1340.9 151.7 C1345.3 181.3 1332.3 233.2 1333.8 300 ZM1327.4 300 C1329.3 174.8 1344.2 95.1 1347.4 72.3 C1351.2 117.8 1338.8 197.5 1340.1 300 ZM1342.7 300 C1344.9 229.0 1366.6 183.8 1370.1 170.9 C1374.3 196.7 1355.4 241.9 1356.8 300 ZM1352.9 300 C1354.8 190.2 1342.9 120.3 1346.1 100.4 C1350.0 140.3 1364.5 210.2 1365.8 300 ZM1364.2 300 C1365.5 264.9 1359.7 242.6 1361.9 236.2 C1364.7 249.0 1372.4 271.3 1373.3 300 ZM1369.7 300 C1371.5 234.4 1375.7 192.6 1378.7 180.7 C1382.2 204.5 1380.3 246.3 1381.5 300 ZM1382.5 300 C1384.3 171.2 1367.9 89.2 1370.9 65.8 C1374.5 112.6 1393.3 194.6 1394.5 300 ZM1396.9 300 C1398.6 211.4 1386.3 155.0 1389.0 138.9 C1392.2 171.1 1406.6 227.5 1407.7 300 ZM1410.6 300 C1412.5 203.6 1426.4 142.3 1429.5 124.8 C1433.2 159.8 1421.7 221.1 1423.0 300 ZM1421.6 300 C1423.3 270.1 1435.9 251.0 1438.8 245.6 C1442.2 256.4 1432.0 275.5 1433.1 300 ZM1427.0 300 C1428.0 229.4 1403.5 184.5 1405.1 171.7 C1407.0 197.4 1432.8 242.3 1433.5 300 Z" />
        </svg>
        <svg className="canopy-floor canopy-floor--front" viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden="true">
          <path fill="#03100a" d="M-1.3 220 C0.2 192.9 20.7 175.7 23.1 170.7 C25.9 180.6 7.3 197.8 8.3 220 ZM14.9 220 C17.4 160.3 14.8 122.2 19.0 111.4 C24.0 133.1 29.9 171.1 31.6 220 ZM33.8 220 C36.1 149.9 4.6 105.2 8.4 92.5 C12.9 118.0 47.4 162.6 48.9 220 ZM44.2 220 C45.3 140.2 68.1 89.4 70.0 74.9 C72.2 103.9 50.9 154.7 51.6 220 ZM54.2 220 C55.5 163.1 51.7 126.9 53.9 116.6 C56.5 137.3 62.0 173.5 62.9 220 ZM73.1 220 C75.6 196.1 64.2 180.9 68.4 176.5 C73.3 185.2 87.9 200.4 89.6 220 ZM86.7 220 C88.3 153.1 71.2 110.5 73.8 98.3 C77.0 122.7 96.3 165.2 97.3 220 ZM102.4 220 C103.8 156.0 112.9 115.3 115.4 103.7 C118.3 127.0 111.2 167.7 112.2 220 ZM113.1 220 C114.6 199.6 83.3 186.7 85.7 183.0 C88.5 190.4 121.6 203.3 122.6 220 ZM126.1 220 C127.8 140.6 147.3 90.0 150.0 75.6 C153.3 104.5 135.9 155.0 137.0 220 ZM146.5 220 C149.0 196.7 168.9 182.0 173.2 177.7 C178.2 186.2 161.7 201.0 163.4 220 ZM154.1 220 C155.8 128.5 149.9 70.3 152.8 53.7 C156.1 87.0 164.3 145.2 165.4 220 ZM177.6 220 C179.4 181.3 200.7 156.7 203.8 149.7 C207.5 163.7 188.6 188.3 189.8 220 ZM189.4 220 C192.0 163.4 204.2 127.4 208.4 117.1 C213.5 137.7 204.6 173.7 206.2 220 ZM202.6 220 C204.6 191.6 196.7 173.5 200.0 168.3 C204.0 178.6 214.6 196.7 215.9 220 ZM213.0 220 C214.9 196.6 187.4 181.7 190.5 177.5 C194.2 186.0 224.1 200.9 225.3 220 ZM229.8 220 C231.6 147.5 212.7 101.3 215.6 88.2 C219.0 114.5 240.2 160.7 241.4 220 ZM245.6 220 C247.8 167.3 243.8 133.8 247.5 124.2 C251.9 143.3 258.9 176.9 260.4 220 ZM264.2 220 C266.4 124.8 244.9 64.2 248.5 46.9 C252.8 81.5 277.1 142.1 278.6 220 ZM269.7 220 C271.9 129.6 273.5 72.0 277.2 55.6 C281.7 88.4 283.1 146.0 284.6 220 ZM286.6 220 C288.7 179.1 287.0 153.1 290.5 145.6 C294.6 160.5 299.0 186.5 300.4 220 ZM303.3 220 C305.5 150.3 281.1 105.9 284.7 93.2 C289.1 118.6 316.4 162.9 317.9 220 ZM314.3 220 C316.7 122.6 333.0 60.6 337.0 42.9 C341.8 78.4 328.8 140.3 330.4 220 ZM326.6 220 C328.0 195.9 319.6 180.6 322.1 176.2 C325.0 184.9 335.3 200.3 336.3 220 ZM346.8 220 C348.7 192.6 318.1 175.1 321.2 170.1 C324.9 180.1 358.0 197.6 359.3 220 ZM355.8 220 C357.7 146.8 360.6 100.2 363.7 86.9 C367.4 113.6 367.1 160.1 368.3 220 ZM373.1 220 C374.5 162.6 361.5 126.0 363.7 115.6 C366.5 136.5 381.3 173.0 382.2 220 ZM391.3 220 C392.4 133.9 366.5 79.1 368.5 63.4 C370.8 94.7 398.2 149.5 399.0 220 ZM406.3 220 C408.5 151.0 385.4 107.1 389.1 94.6 C393.5 119.6 419.5 163.6 421.0 220 ZM416.8 220 C419.1 180.2 405.2 154.8 409.0 147.6 C413.5 162.1 430.4 187.4 431.9 220 ZM433.5 220 C435.1 121.9 433.9 59.4 436.5 41.6 C439.5 77.3 442.8 139.7 443.8 220 ZM448.9 220 C450.6 127.3 438.2 68.3 441.0 51.5 C444.4 85.2 459.0 144.2 460.2 220 ZM456.7 220 C457.9 131.0 429.8 74.3 431.7 58.1 C434.1 90.5 463.7 147.1 464.5 220 ZM475.8 220 C477.9 162.1 460.3 125.2 463.8 114.7 C467.9 135.8 488.3 172.6 489.7 220 ZM492.4 220 C493.7 194.7 499.8 178.6 502.1 174.0 C504.8 183.2 500.6 199.3 501.5 220 ZM499.8 220 C501.9 176.5 507.9 148.9 511.4 140.9 C515.7 156.8 512.6 184.4 514.0 220 ZM516.2 220 C517.8 189.4 527.1 169.8 529.8 164.3 C532.9 175.4 525.7 194.9 526.8 220 ZM531.5 220 C533.6 191.4 532.1 173.2 535.6 168.0 C539.8 178.4 544.1 196.6 545.5 220 ZM551.4 220 C553.8 125.8 543.7 65.8 547.7 48.7 C552.5 83.0 565.9 142.9 567.6 220 ZM564.7 220 C566.2 176.4 556.1 148.7 558.6 140.8 C561.7 156.6 573.8 184.4 574.8 220 ZM580.4 220 C581.8 129.4 569.7 71.7 572.1 55.3 C574.9 88.2 588.9 145.9 589.9 220 ZM589.0 220 C590.7 171.8 579.6 141.1 582.3 132.3 C585.6 149.9 598.9 180.5 600.0 220 ZM601.7 220 C604.0 155.8 600.4 114.9 604.2 103.2 C608.7 126.6 615.2 167.5 616.7 220 ZM622.6 220 C623.9 155.9 635.9 115.1 638.1 103.4 C640.8 126.7 630.5 167.5 631.4 220 ZM637.4 220 C638.5 178.3 636.6 151.8 638.4 144.2 C640.5 159.4 643.9 185.9 644.7 220 ZM648.4 220 C650.9 155.5 653.4 114.4 657.5 102.7 C662.5 126.2 663.4 167.2 665.1 220 ZM665.5 220 C667.3 195.6 679.6 180.1 682.8 175.7 C686.5 184.6 676.7 200.1 677.9 220 ZM672.6 220 C674.8 194.2 693.0 177.8 696.6 173.2 C700.9 182.5 685.5 198.9 687.0 220 ZM687.0 220 C688.3 150.2 699.7 105.7 701.8 93.1 C704.3 118.4 694.6 162.9 695.5 220 ZM707.1 220 C708.5 181.2 720.7 156.5 723.0 149.4 C725.8 163.5 715.4 188.2 716.3 220 ZM720.2 220 C721.9 139.8 707.8 88.7 710.5 74.1 C713.8 103.3 730.1 154.4 731.2 220 ZM739.1 220 C740.9 147.1 738.4 100.8 741.4 87.5 C744.9 114.0 749.9 160.4 751.1 220 ZM751.0 220 C753.4 144.3 741.6 96.1 745.7 82.3 C750.5 109.9 765.6 158.0 767.2 220 ZM766.5 220 C768.8 147.6 781.0 101.5 784.8 88.3 C789.5 114.7 780.5 160.7 782.0 220 ZM781.0 220 C783.5 129.9 785.2 72.5 789.4 56.1 C794.4 88.9 795.9 146.3 797.5 220 ZM792.2 220 C794.5 144.1 783.8 95.8 787.5 82.0 C792.0 109.6 805.8 157.9 807.3 220 ZM805.6 220 C807.8 189.1 831.5 169.4 835.1 163.8 C839.4 175.0 818.6 194.7 820.0 220 ZM819.5 220 C820.9 187.4 812.8 166.6 815.0 160.7 C817.8 172.6 827.7 193.3 828.6 220 ZM833.1 220 C834.2 123.4 819.7 61.9 821.6 44.4 C823.9 79.5 839.9 141.0 840.7 220 ZM845.7 220 C847.9 149.1 822.8 103.9 826.5 91.0 C830.9 116.8 859.0 162.0 860.5 220 ZM859.6 220 C861.5 164.2 880.9 128.6 884.1 118.5 C888.0 138.8 871.1 174.3 872.4 220 ZM873.7 220 C875.1 192.1 854.6 174.3 856.8 169.2 C859.4 179.4 881.7 197.2 882.6 220 ZM890.1 220 C892.1 143.5 870.3 94.9 873.6 81.0 C877.5 108.8 901.8 157.4 903.1 220 ZM904.0 220 C905.3 178.3 917.3 151.8 919.5 144.2 C922.1 159.4 911.9 185.9 912.7 220 ZM919.7 220 C922.0 157.0 914.7 117.0 918.5 105.5 C923.0 128.4 933.4 168.5 934.9 220 ZM933.6 220 C936.0 130.0 920.1 72.7 924.1 56.3 C929.0 89.1 948.1 146.3 949.7 220 ZM950.9 220 C952.7 124.4 931.2 63.6 934.1 46.2 C937.7 81.0 961.5 141.8 962.7 220 ZM960.3 220 C962.5 125.2 949.6 64.8 953.4 47.6 C957.9 82.1 973.8 142.4 975.3 220 ZM979.5 220 C980.9 159.6 1006.5 121.2 1008.9 110.2 C1011.8 132.2 988.2 170.6 989.2 220 ZM995.2 220 C996.3 181.8 991.8 157.5 993.5 150.5 C995.7 164.4 1001.6 188.7 1002.3 220 ZM1006.7 220 C1008.8 137.2 1009.5 84.5 1013.1 69.5 C1017.3 99.6 1019.4 152.3 1020.8 220 ZM1018.9 220 C1020.5 188.2 1002.0 168.0 1004.5 162.2 C1007.6 173.8 1028.1 194.0 1029.2 220 ZM1040.5 220 C1042.5 159.6 1066.8 121.1 1070.1 110.2 C1074.1 132.1 1052.6 170.6 1053.9 220 ZM1048.8 220 C1050.1 158.1 1062.9 118.7 1065.1 107.5 C1067.6 130.0 1056.5 169.4 1057.4 220 ZM1060.6 220 C1062.9 135.2 1076.0 81.3 1079.9 65.9 C1084.5 96.7 1074.5 150.7 1076.0 220 ZM1075.8 220 C1077.9 179.2 1048.1 153.3 1051.6 145.9 C1055.9 160.7 1088.5 186.6 1090.0 220 ZM1094.2 220 C1096.7 163.4 1095.3 127.3 1099.4 117.0 C1104.4 137.6 1109.1 173.7 1110.8 220 ZM1112.4 220 C1114.6 176.5 1103.7 148.9 1107.4 141.0 C1111.9 156.8 1125.8 184.4 1127.3 220 ZM1127.4 220 C1129.7 193.5 1106.1 176.6 1109.9 171.8 C1114.5 181.5 1141.1 198.3 1142.7 220 ZM1138.0 220 C1139.3 158.8 1155.8 119.9 1158.0 108.8 C1160.5 131.0 1145.8 169.9 1146.6 220 ZM1150.1 220 C1151.3 176.0 1136.5 147.9 1138.4 139.9 C1140.8 156.0 1157.1 184.0 1157.9 220 ZM1166.1 220 C1167.7 143.7 1174.6 95.2 1177.3 81.3 C1180.5 109.0 1175.6 157.6 1176.7 220 ZM1176.8 220 C1178.6 169.3 1201.9 137.1 1204.8 127.8 C1208.3 146.3 1187.3 178.5 1188.4 220 ZM1198.5 220 C1199.6 148.6 1189.4 103.2 1191.2 90.2 C1193.3 116.1 1204.9 161.6 1205.6 220 ZM1211.7 220 C1213.6 181.8 1206.0 157.5 1209.2 150.6 C1213.0 164.5 1223.1 188.8 1224.4 220 ZM1219.1 220 C1221.3 121.7 1197.7 59.1 1201.5 41.2 C1206.0 77.0 1232.6 139.5 1234.1 220 ZM1239.6 220 C1241.2 177.6 1239.3 150.6 1242.0 142.9 C1245.2 158.3 1249.3 185.3 1250.3 220 ZM1250.8 220 C1252.4 173.8 1258.0 144.5 1260.8 136.1 C1264.0 152.9 1260.6 182.2 1261.7 220 ZM1264.7 220 C1266.9 184.8 1250.9 162.4 1254.5 156.0 C1258.8 168.8 1277.6 191.2 1279.1 220 ZM1286.1 220 C1288.2 155.9 1272.4 115.1 1276.0 103.4 C1280.3 126.7 1298.9 167.5 1300.3 220 ZM1299.3 220 C1300.6 193.4 1272.9 176.5 1275.0 171.6 C1277.5 181.3 1306.9 198.2 1307.7 220 ZM1312.2 220 C1313.5 144.3 1304.1 96.1 1306.3 82.3 C1309.0 109.8 1320.1 158.0 1321.0 220 ZM1328.2 220 C1329.4 153.5 1309.8 111.1 1311.8 99.1 C1314.2 123.2 1335.3 165.6 1336.1 220 ZM1335.7 220 C1337.4 190.9 1307.3 172.3 1310.1 167.0 C1313.4 177.6 1345.7 196.2 1346.8 220 ZM1357.8 220 C1359.7 166.7 1363.6 132.8 1366.7 123.1 C1370.3 142.5 1368.7 176.4 1370.0 220 ZM1370.7 220 C1372.3 135.3 1357.9 81.3 1360.6 65.9 C1363.8 96.8 1380.5 150.7 1381.5 220 ZM1381.5 220 C1383.2 199.5 1390.8 186.5 1393.5 182.8 C1396.8 190.2 1391.4 203.2 1392.5 220 ZM1401.7 220 C1403.7 137.8 1404.8 85.4 1408.2 70.5 C1412.3 100.4 1413.9 152.7 1415.3 220 ZM1406.3 220 C1407.9 174.4 1412.8 145.3 1415.4 137.0 C1418.5 153.6 1415.7 182.7 1416.8 220 ZM1421.6 220 C1423.4 170.6 1435.9 139.2 1438.9 130.2 C1442.6 148.2 1432.5 179.6 1433.7 220 Z" />
        </svg>
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
                <svg className="home-chain-vine" viewBox="0 20 140 580" preserveAspectRatio="xMidYMax meet" fill="none">
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
                <article className="home-chain-step home-chain-intro">
                  <svg className="chain-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path pathLength={1} d="M32 54 V32" />
                    <path pathLength={1} d="M32 36 C32 26 24 20 14 20 c1 10 8 16 18 16z" />
                    <path pathLength={1} d="M32 36 c0-8 6-14 16-14 -1 9-7 14-16 14z" />
                  </svg>
                  <h3>The journey begins.</h3>
                  <p>Scroll to follow a record from the forest floor to the public canopy.</p>
                </article>
                {CHAIN.map((step, i) => (
                  <article key={step.title} className="home-chain-step">
                    <ChainIcon stage={i} />
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="home-chain-art" aria-hidden="true">
              <ChainBackdropLayer />
              <SceneSeed />
              <ChainScenes />
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
