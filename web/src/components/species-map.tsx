"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "maplibre-gl/dist/maplibre-gl.css";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  const observations = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [point.lng, point.lat] as [number, number],
        },
        properties: { ...point, color: statusColor(point.conservationStatus) },
      })),
    }),
    [points]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let mapInstance: import("maplibre-gl").Map | null = null;

    import("maplibre-gl").then((maplibregl) => {
      if (disposed) return;

      // Turbopack rewrites import.meta.url, so MapLibre's default worker path
      // 404s; serve the worker from our own route instead.
      maplibregl.setWorkerUrl("/maplibre-worker");

      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      const center: [number, number] = [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ];

      const map = new maplibregl.Map({
        container,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom: points.length === 1 ? 11 : 7,
        pitch: 55,
        bearing: -12,
        maxPitch: 75,
        attributionControl: { compact: true },
      });
      mapInstance = map;

      map.addControl(
        new maplibregl.NavigationControl({ visualizePitch: true, showCompass: true }),
        "top-right"
      );

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 14,
        className: "species-popup",
      });

      map.on("load", () => {
        if (disposed) return;

        map.setProjection({ type: "globe" });

        // Real 3D relief from the AWS Open Data elevation tiles (no key needed).
        map.addSource("terrain-dem", {
          type: "raster-dem",
          encoding: "terrarium",
          tiles: [
            "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          maxzoom: 15,
          attribution: "Elevation: AWS Open Data (Terrarium)",
        });
        map.setTerrain({ source: "terrain-dem", exaggeration: 1.5 });

        map.addSource("observations", { type: "geojson", data: observations });
        map.addLayer({
          id: "observations-circle",
          type: "circle",
          source: "observations",
          paint: {
            "circle-color": ["get", "color"],
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        if (points.length > 1) {
          const bounds = new maplibregl.LngLatBounds(
            [Math.min(...lngs), Math.min(...lats)],
            [Math.max(...lngs), Math.max(...lats)]
          );
          map.fitBounds(bounds, { padding: 64, maxZoom: 12, duration: 0 });
        }

        const showPopup = (feature: GeoJSON.Feature) => {
          const props = feature.properties as Record<string, unknown>;
          const label = String(props.label ?? "Observation");
          const commonName = props.commonName ? String(props.commonName) : null;
          const status = props.conservationStatus
            ? String(props.conservationStatus)
            : null;
          const meta = [
            props.heightCm != null ? `${props.heightCm} cm` : null,
            props.createdAt ? new Date(String(props.createdAt)).toLocaleDateString() : null,
          ]
            .filter(Boolean)
            .join(" · ");

          const rows = [
            `<strong>${escapeHtml(label)}</strong>`,
            commonName ? escapeHtml(commonName) : "",
            status
              ? `<span style="color:${statusColor(status)}">${escapeHtml(status)}</span>`
              : "",
          ].filter(Boolean);

          popup
            .setHTML(
              `${rows.join("<br/>")}${
                meta
                  ? `<br/><span style="color:#6b7568;font-size:11px">${escapeHtml(meta)}</span>`
                  : ""
              }`
            )
            .addTo(map);
        };

        map.on("mouseenter", "observations-circle", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const feature = e.features?.[0];
          if (!feature) return;
          popup.setLngLat(e.lngLat);
          showPopup(feature);
        });

        map.on("mousemove", "observations-circle", (e) => {
          if (popup.isOpen()) popup.setLngLat(e.lngLat);
        });

        map.on("mouseleave", "observations-circle", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });

        map.on("click", "observations-circle", (e) => {
          const feature = e.features?.[0];
          if (!feature?.properties) return;
          router.push(`/records/${String(feature.properties.id)}`);
        });

        setLoaded(true);
      });
    });

    return () => {
      disposed = true;
      mapInstance?.remove();
      mapInstance = null;
    };
  }, [observations, points, router]);

  const speciesCount = new Set(points.map((p) => p.label)).size;

  if (points.length === 0) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
        <div ref={containerRef} className="h-[420px] w-full" />
        {!loaded && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sprout/60">
            <p className="text-sm text-moss">Loading 3D terrain map…</p>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-1 rounded-2xl bg-white/90 px-4 py-3 shadow-md backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">
            {points.length} observations
          </p>
          <p className="text-lg font-bold text-pine">{speciesCount} species</p>
          <p className="text-[11px] text-moss">3D terrain · OSM</p>
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

        <div className="rounded-2xl border border-pine/10 bg-white p-5 text-xs text-moss">
          Drag to tilt, scroll to zoom, click a marker to open its record.
          Basemap © OpenStreetMap contributors · MapLibre · OpenFreeMap.
        </div>
      </aside>
    </div>
  );
}
