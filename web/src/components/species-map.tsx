"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import type { MapApprovalStatus, MapPoint } from "@/lib/map";
import { reportInteraction } from "@/lib/interactionLog";

type Props = {
  points: MapPoint[];
};

type ApprovalFilter = "all" | MapApprovalStatus;

const FILTERS: { key: ApprovalFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const APPROVAL_LABELS: Record<MapApprovalStatus, string> = {
  approved: "Approved",
  pending: "Pending review",
  rejected: "Rejected",
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

function matchesFilter(point: MapPoint, filter: ApprovalFilter): boolean {
  return filter === "all" || point.approvalStatus === filter;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function SpeciesMap({ points }: Props) {
  const router = useRouter();

  // Initial points are only used to frame the map on first load; later prop
  // changes rebuild markers without moving the camera.
  const pointsRef = useRef(points);
  const framedRef = useRef<MapPoint[] | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const glRef = useRef<typeof import("maplibre-gl") | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<ApprovalFilter>("all");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    import("maplibre-gl").then((maplibregl) => {
      if (disposed) return;
      glRef.current = maplibregl;

      // Turbopack rewrites import.meta.url, so MapLibre's default worker path
      // 404s; serve the worker from our own route instead.
      maplibregl.setWorkerUrl("/maplibre-worker");

      const initial = pointsRef.current;
      const lngs = initial.map((p) => p.lng);
      const lats = initial.map((p) => p.lat);
      const center: [number, number] = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];

      const map = new maplibregl.Map({
        container,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom: initial.length === 1 ? 11 : 7,
        pitch: 55,
        bearing: -12,
        maxPitch: 75,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }),
        "top-right"
      );

      map.on("load", () => {
        if (disposed) return;

        map.setProjection({ type: "globe" });

        // Real 3D relief from the AWS Open Data elevation tiles (no key
        // needed). Capped at z12: deeper tiles are 2-4x slower to fetch with
        // no visual gain at this zoom range.
        map.addSource("terrain-dem", {
          type: "raster-dem",
          encoding: "terrarium",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          maxzoom: 12,
          attribution: "Elevation: AWS Open Data (Terrarium)",
        });

        // Terrain tiles are the slowest part of the load (0.7-2.8s each), so
        // the flat globe paints first and the relief rises in once idle.
        map.once("idle", () => {
          if (disposed) return;
          map.setTerrain({ source: "terrain-dem", exaggeration: 1.3 });
        });

        setLoaded(true);
      });
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
      glRef.current = null;
    };
  }, []);

  // Build one marker per visible point. Re-runs when the filter changes, so the
  // camera is only reframed when the underlying points actually change.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = glRef.current;
    if (!map || !maplibregl || !loaded) return;

    if (framedRef.current !== points) {
      framedRef.current = points;
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      if (points.length > 1) {
        const bounds = new maplibregl.LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)]
        );
        map.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 0 });
      }
    }

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: "species-popup",
    });

    const showPopup = (point: MapPoint) => {
      const meta = [
        APPROVAL_LABELS[point.approvalStatus],
        point.heightCm != null ? `${point.heightCm} cm` : null,
        point.createdAt ? new Date(point.createdAt).toLocaleDateString() : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const rows = [
        `<strong>${escapeHtml(point.label)}</strong>`,
        point.commonName ? escapeHtml(point.commonName) : "",
        point.conservationStatus
          ? `<span style="color:${statusColor(point.conservationStatus)}">${escapeHtml(point.conservationStatus)}</span>`
          : "",
      ].filter(Boolean);

      popup
        .setLngLat([point.lng, point.lat])
        .setHTML(
          `${rows.join("<br/>")}${
            meta
              ? `<br/><span style="color:#6b7568;font-size:11px">${escapeHtml(meta)}</span>`
              : ""
          }`
        )
        .addTo(map);
    };

    // Circular markers: the record's photo when it has one, otherwise a
    // status-coloured dot. Ring colour always encodes conservation status.
    const created: Marker[] = [];
    for (const point of points) {
      if (!matchesFilter(point, filter)) continue;

      const color = statusColor(point.conservationStatus);
      const el = document.createElement("div");
      el.style.width = "28px";
      el.style.height = "28px";
      el.style.borderRadius = "9999px";
      el.style.border = "2px solid #ffffff";
      el.style.background = color;
      el.style.overflow = "hidden";
      el.style.cursor = "pointer";
      el.style.boxShadow = `0 0 0 1.5px ${color}, 0 1px 5px rgba(12, 52, 44, 0.35)`;

      if (point.photoUrl) {
        const img = document.createElement("img");
        img.src = point.photoUrl;
        img.alt = "";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.display = "block";
        img.onerror = () => img.remove();
        el.appendChild(img);
      }

      el.addEventListener("mouseenter", () => showPopup(point));
      el.addEventListener("mouseleave", () => popup.remove());
      el.addEventListener("click", () => {
        const name = point.commonName ?? point.label;
        reportInteraction(`map marker "${name}" -> /records/${point.id}`);
        router.push(`/records/${point.id}`);
      });

      created.push(
        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat([point.lng, point.lat])
          .addTo(map)
      );
    }

    return () => {
      popup.remove();
      for (const marker of created) {
        try {
          marker.remove();
        } catch {
          // The map was already torn down with the markers.
        }
      }
    };
  }, [points, loaded, filter, router]);

  const counts = FILTERS.reduce<Record<ApprovalFilter, number>>(
    (acc, { key }) => {
      acc[key] = points.filter((p) => matchesFilter(p, key)).length;
      return acc;
    },
    { all: 0, approved: 0, pending: 0, rejected: 0 }
  );

  const visible = points.filter((p) => matchesFilter(p, filter));
  const speciesCount = new Set(visible.map((p) => p.label)).size;

  if (points.length === 0) {
    return (
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
        <div className="flex h-full min-h-[420px] items-center justify-center p-8">
          <p className="text-sm text-moss">
            No observations with GPS coordinates yet. Field data syncs here as
            soon as botanists capture it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div
          className="mb-3 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter observations by approval status"
        >
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-moss">
            Filter
          </span>
          {FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-emerald bg-emerald text-cream"
                    : "border-pine/15 bg-white text-moss hover:bg-sprout/50"
                }`}
              >
                {label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active ? "bg-cream/25 text-cream" : "bg-sprout text-pine"
                  }`}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
          <div ref={containerRef} className="h-[420px] w-full" />
          {!loaded && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sprout/60">
              <p className="text-sm text-moss">Loading 3D terrain map…</p>
            </div>
          )}

          <div className="absolute top-4 left-4 flex flex-col gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-moss">
              {visible.length} observations
            </p>
            <p className="text-lg font-bold text-pine">{speciesCount} species</p>
            <p className="text-[11px] text-moss">
              {filter === "all" ? "All statuses" : APPROVAL_LABELS[filter]} · 3D terrain
            </p>
          </div>

          {loaded && visible.length === 0 && (
            <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-center">
              <p className="rounded-full bg-white/90 px-4 py-2 text-sm text-moss shadow-md backdrop-blur">
                No {filter === "all" ? "" : `${APPROVAL_LABELS[filter].toLowerCase()} `}
                observations to show.
              </p>
            </div>
          )}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-2xl border border-pine/10 bg-white p-5">
          <h2 className="font-semibold text-pine">Distribution summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-moss">Observations</dt>
              <dd className="font-semibold text-pine">{visible.length}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-moss">Species</dt>
              <dd className="font-semibold text-pine">{speciesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-moss">Threatened</dt>
              <dd className="font-semibold text-pine">
                {visible.filter((p) => p.conservationStatus).length}
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

        <div className="rounded-2xl border border-pine/10 bg-white p-5 text-xs text-moss">
          Drag to tilt, scroll to zoom, click a marker to open its record.
          Basemap © OpenStreetMap contributors · MapLibre · OpenFreeMap.
        </div>
      </aside>
    </div>
  );
}
