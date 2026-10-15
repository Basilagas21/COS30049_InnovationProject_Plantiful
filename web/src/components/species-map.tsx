"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  GeoJSONSource,
  Map as MapLibreMap,
  MapLayerMouseEvent,
} from "maplibre-gl";
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

const EMPTY_COLLECTION: GeoJSON.FeatureCollection<GeoJSON.Point, PointProperties> = {
  type: "FeatureCollection",
  features: [],
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

type PointProperties = {
  id: string;
  label: string;
  commonName: string;
  conservationStatus: string;
  approvalStatus: MapApprovalStatus;
  meta: string;
  color: string;
};

function toFeature(point: MapPoint): GeoJSON.Feature<GeoJSON.Point, PointProperties> {
  const meta = [
    APPROVAL_LABELS[point.approvalStatus],
    point.heightCm != null ? `${point.heightCm} cm` : null,
    point.createdAt ? new Date(point.createdAt).toLocaleDateString() : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [point.lng, point.lat] },
    properties: {
      id: point.id,
      label: point.label,
      commonName: point.commonName ?? "",
      conservationStatus: point.conservationStatus ?? "",
      approvalStatus: point.approvalStatus,
      meta,
      color: statusColor(point.conservationStatus),
    },
  };
}

function popupHtml(props: PointProperties): string {
  const rows = [
    `<strong>${escapeHtml(props.label)}</strong>`,
    props.commonName ? escapeHtml(props.commonName) : "",
    props.conservationStatus
      ? `<span style="color:${props.color}">${escapeHtml(props.conservationStatus)}</span>`
      : "",
  ].filter(Boolean);
  const meta = props.meta
    ? `<br/><span style="color:#6b7568;font-size:11px">${escapeHtml(props.meta)}</span>`
    : "";
  return `${rows.join("<br/>")}${meta}`;
}

/** Coordinates are grouped into clusters so overlapping observations stay visible. */
export function SpeciesMap({ points }: Props) {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Initial points are only used to frame the map on first load; later prop
  // changes rebuild the data without moving the camera.
  const pointsRef = useRef(points);
  const framedRef = useRef<MapPoint[] | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<ApprovalFilter>("all");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    import("maplibre-gl").then((maplibregl) => {
      if (disposed) return;

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

      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        className: "species-popup",
      });

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

        // Observations are clustered: records captured at the same or nearby
        // coordinates merge into a counted bubble until the user zooms in.
        map.addSource("observations", {
          type: "geojson",
          data: EMPTY_COLLECTION,
          cluster: true,
          clusterRadius: 45,
          clusterMaxZoom: 15,
        });

        map.addLayer({
          id: "observations-clusters",
          type: "circle",
          source: "observations",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#076653",
            "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 10, 26],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#FFFDEE",
          },
        });

        map.addLayer({
          id: "observations-cluster-count",
          type: "symbol",
          source: "observations",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 12,
            "text-font": ["Noto Sans Regular"],
          },
          paint: { "text-color": "#FFFDEE" },
        });

        map.addLayer({
          id: "observations-points",
          type: "circle",
          source: "observations",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 8,
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
          },
        });

        const setCursor = (value: string) => {
          const canvas = map.getCanvas();
          if (canvas) canvas.style.cursor = value;
        };

        map.on("mouseenter", "observations-clusters", () => setCursor("pointer"));
        map.on("mouseleave", "observations-clusters", () => setCursor(""));

        map.on("mouseenter", "observations-points", (event: MapLayerMouseEvent) => {
          setCursor("pointer");
          const feature = event.features?.[0];
          if (!feature) return;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          hoverPopup
            .setLngLat(coords)
            .setHTML(popupHtml(feature.properties as PointProperties))
            .addTo(map);
        });
        map.on("mouseleave", "observations-points", () => {
          setCursor("");
          hoverPopup.remove();
        });

        map.on("click", "observations-clusters", (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const source = map.getSource("observations") as GeoJSONSource | undefined;
          if (!feature || !source) return;
          const clusterId = feature.properties?.cluster_id as number | undefined;
          const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
          if (clusterId == null) return;
          source
            .getClusterExpansionZoom(clusterId)
            .then((zoom) => {
              if (disposed) return;
              map.easeTo({ center: coords, zoom });
            })
            .catch(() => {
              // Cluster disappeared between click and query; nothing to do.
            });
        });

        map.on("click", "observations-points", (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          if (!feature) return;
          const props = feature.properties as PointProperties;
          reportInteraction(
            `map marker "${props.commonName || props.label}" -> /records/${props.id}`
          );
          routerRef.current.push(`/records/${props.id}`);
        });

        setLoaded(true);
      });
    });

    return () => {
      disposed = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Push the filtered points into the cluster source. Re-runs on filter change;
  // the camera is only reframed when the underlying points actually change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    if (framedRef.current !== points) {
      framedRef.current = points;
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      if (points.length > 1) {
        map.fitBounds(
          [
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)],
          ],
          { padding: 64, maxZoom: 15, duration: 0 }
        );
      }
    }

    const source = map.getSource("observations") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: points.filter((p) => matchesFilter(p, filter)).map(toFeature),
    });
  }, [points, loaded, filter]);

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

        <p className="mt-2 text-xs text-moss">
          Overlapping observations are grouped into numbered clusters — click a
          cluster to zoom in.
        </p>
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
