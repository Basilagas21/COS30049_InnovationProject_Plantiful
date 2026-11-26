"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

type Props = {
  lat?: number | null;
  lng?: number | null;
  label?: string;
};

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: ["/api/map-tiles/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Tiles © Esri · Data © OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "map-background",
      type: "background",
      paint: { "background-color": "#eef3e8" },
    },
    { id: "basemap-streets", type: "raster", source: "basemap" },
  ],
};

export function RecordMiniMap({ lat, lng, label }: Props) {
  const center = useMemo<[number, number] | null>(() => {
    if (lat == null || lng == null) return null;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lng, lat];
  }, [lat, lng]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !center) return;

    let disposed = false;
    let map: MapLibreMap | null = null;

    import("maplibre-gl").then((maplibregl) => {
      if (disposed) return;

      maplibregl.setWorkerUrl("/maplibre-worker");
      map = new maplibregl.Map({
        container,
        style: MAP_STYLE,
        center,
        zoom: 10,
        interactive: false,
        attributionControl: false,
      });
      new maplibregl.Marker({ color: "#076653" }).setLngLat(center).addTo(map);
      map.on("load", () => {
        if (!disposed) setLoaded(true);
      });
    });

    return () => {
      disposed = true;
      map?.remove();
      map = null;
    };
  }, [center]);

  if (!center) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
        <div
          role="img"
          aria-label="Botanical illustration"
          className="h-48 w-full bg-[url('/botanical.svg')] bg-contain bg-center bg-no-repeat opacity-70"
        />
        <p className="absolute inset-x-4 bottom-4 text-center text-sm font-medium text-pine">
          Coordinates were not recorded.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-3xl border border-pine/10 bg-sprout/50">
      <div ref={containerRef} className="h-full w-full" />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-sprout/60">
          <p className="text-sm text-moss">Loading map...</p>
        </div>
      )}
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-pine shadow-sm backdrop-blur">
        {label ?? "Recorded location"}
      </p>
    </div>
  );
}
