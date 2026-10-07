"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { MapPoint } from "@/lib/map";

type Props = {
  points: MapPoint[];
};

const STATUS_COLORS: Record<string, string> = {
  "Critically endangered": "#8c2f39",
  Endangered: "#b54a3b",
  Vulnerable: "#d69b2a",
  "Near threatened": "#8a9a5b",
  "Least concern": "#076653",
};

function statusColor(status: string | null): string {
  if (status && STATUS_COLORS[status]) return STATUS_COLORS[status];
  return "#076653";
}

export function SpeciesMap({ points }: Props) {
  const [hovered, setHovered] = useState<MapPoint | null>(null);

  const bounds = useMemo(() => {
    if (points.length === 0) return null;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const padLat = Math.max((maxLat - minLat) * 0.2, 0.0005);
    const padLng = Math.max((maxLng - minLng) * 0.2, 0.0005);
    return {
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
    };
  }, [points]);

  const spaced = useMemo(() => {
    const used = new Set<string>();
    return points.map((point) => {
      const key = `${point.lat.toFixed(4)}|${point.lng.toFixed(4)}`;
      if (used.has(key)) {
        return { ...point, offset: (used.size % 3) * 4 - 4 };
      }
      used.add(key);
      return { ...point, offset: 0 };
    });
  }, [points]);

  if (!bounds || points.length === 0) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
        <div className="flex h-full min-h-[420px] items-center justify-center p-8">
          <p className="text-sm text-moss">
            No approved observations with GPS coordinates yet. Field data syncs
            here as soon as botanists capture it.
          </p>
        </div>
      </div>
    );
  }

  const WIDTH = 720;
  const HEIGHT = 420;
  const MARGIN = 24;
  const viewport = bounds;

  function toXY(lat: number, lng: number) {
    const x =
      MARGIN +
      ((lng - viewport.minLng) / (viewport.maxLng - viewport.minLng)) * (WIDTH - MARGIN * 2);
    const y =
      MARGIN +
      ((viewport.maxLat - lat) / (viewport.maxLat - viewport.minLat)) * (HEIGHT - MARGIN * 2);
    return { x, y };
  }

  const speciesCount = new Set(points.map((p) => p.label)).size;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[420px] w-full"
          role="img"
          aria-label="Species distribution map"
        >
          {/* Grid */}
          {Array.from({ length: 8 }, (_, i) => {
            const gx = (i / 7) * WIDTH;
            const gy = (i / 7) * HEIGHT;
            return (
              <g key={i}>
                <line
                  x1={gx}
                  y1={0}
                  x2={gx}
                  y2={HEIGHT}
                  stroke="#076653"
                  strokeOpacity={0.06}
                />
                <line
                  x1={0}
                  y1={gy}
                  x2={WIDTH}
                  y2={gy}
                  stroke="#076653"
                  strokeOpacity={0.06}
                />
              </g>
            );
          })}

          {/* Points */}
          {spaced.map((point) => {
            const { x, y } = toXY(point.lat, point.lng);
            const r = point.conservationStatus ? 7 : 5.5;
            return (
              <g
                key={`${point.id}-${point.offset}`}
                onMouseEnter={() => setHovered(point)}
                onMouseLeave={() => setHovered(null)}
              >
                <Link href={`/records/${point.id}`} tabIndex={-1}>
                  <circle
                    cx={x + point.offset}
                    cy={y + point.offset}
                    r={r + 4}
                    fill="transparent"
                  />
                  <circle
                    cx={x + point.offset}
                    cy={y + point.offset}
                    r={r}
                    fill={statusColor(point.conservationStatus)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </Link>
              </g>
            );
          })}

          {hovered && (
            <g transform="translate(16,16)">
              <rect rx={10} width={220} height={86} fill="#fff" opacity={0.96} />
              <text x={14} y={26} fontSize={13} fontWeight="700" fill="#0c342c">
                {hovered.label.length > 28
                  ? `${hovered.label.slice(0, 28)}…`
                  : hovered.label}
              </text>
              {hovered.commonName && (
                <text x={14} y={44} fontSize={12} fill="#6b7568">
                  {hovered.commonName}
                </text>
              )}
              {hovered.conservationStatus && (
                <text x={14} y={62} fontSize={12} fontWeight="600" fill="#b54a3b">
                  {hovered.conservationStatus}
                </text>
              )}
              <text x={14} y={78} fontSize={11} fill="#6b7568">
                {hovered.heightCm != null ? `${hovered.heightCm} cm · ` : ""}
                {new Date(hovered.createdAt).toLocaleDateString()}
              </text>
            </g>
          )}
        </svg>

        <div className="absolute top-4 left-4 flex flex-col gap-2 rounded-2xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">
            {points.length} observations
          </p>
          <p className="text-lg font-bold text-pine">{speciesCount} species</p>
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-pine/10 bg-white p-5">
          <h2 className="font-semibold text-pine">Distribution summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-moss">Observations</dt>
              <dd className="font-semibold text-pine">{points.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-moss">Species</dt>
              <dd className="font-semibold text-pine">{speciesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-moss">Threatened</dt>
              <dd className="font-semibold text-pine">
                {points.filter((p) => p.conservationStatus).length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-emerald p-5 text-cream">
          <h2 className="font-semibold">Legend</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#8c2f39]" /> Critically endangered
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#b54a3b]" /> Endangered
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#d69b2a]" /> Vulnerable
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full bg-[#076653]" /> Not threatened
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}