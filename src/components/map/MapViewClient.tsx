"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, {
  type Map as MapLibreMap,
  type StyleSpecification,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { formatPrice, formatDistance } from "@/lib/utils/format";

/**
 * One marker rendered on the map.
 */
export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  /** Restaurant name (popup title). */
  label: string;
  /** Optional menu position name. */
  position?: string | null;
  /** Price in rubles (kopecks not used). */
  price?: number | null;
  /** Distance from center in meters. */
  distanceMeters?: number | null;
  /** Link target (e.g. /restaurant/slug). */
  href?: string | null;
  /** Restaurant cover image URL for popup thumbnail. */
  coverUrl?: string | null;
}

export interface MapViewClientProps {
  markers: MapMarker[];
  /** Center of the map (defaults to Moscow). */
  center?: { lat: number; lng: number };
  /** Initial zoom. */
  zoom?: number;
  /**
   * If provided, draws a translucent accent circle of this radius (meters)
   * around the center.
   */
  radiusMeters?: number | null;
  /** Fired when a marker is clicked. */
  onMarkerClick?: (markerId: string | number) => void;
  /** Optional className for the wrapping div. */
  className?: string;
  /** Inline style for the wrapping div. */
  style?: React.CSSProperties;
}

const ACCENT = "#FF5C00";
const ACCENT_FILL = "rgba(255, 92, 0, 0.10)";

const DEFAULT_CENTER = { lat: 55.7558, lng: 37.6173 };
const DEFAULT_ZOOM = 13;

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Approximate a circle polygon around a point with N segments.
 * Used as the geometry for a fill-layer (since MapLibre doesn't support
 * a "circle of N meters" natively for fill layers).
 */
function buildCirclePolygon(
  lat: number,
  lng: number,
  radiusMeters: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6_371_000;
  const angularDistance = radiusMeters / earthRadius;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  for (let i = 0; i <= steps; i++) {
    const bearing = (i * 2 * Math.PI) / steps;
    const sinLat =
      Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing);
    const newLat = Math.asin(sinLat);
    const newLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
        Math.cos(angularDistance) - Math.sin(latRad) * sinLat,
      );
    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPopupHtml(marker: MapMarker): string {
  const title = escapeHtml(marker.label);
  const position = marker.position ? escapeHtml(marker.position) : "";
  const price =
    marker.price !== null && marker.price !== undefined
      ? escapeHtml(formatPrice(marker.price))
      : "";
  const distance =
    marker.distanceMeters !== null && marker.distanceMeters !== undefined
      ? escapeHtml(formatDistance(marker.distanceMeters))
      : "";
  const href = marker.href ? escapeHtml(marker.href) : "";
  const coverUrl = marker.coverUrl ? escapeHtml(marker.coverUrl) : "";

  return `
<div class="lh-map-popup" style="font-family: inherit; min-width: 180px; max-width: 240px;">
  ${coverUrl ? `<img src="${coverUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px 8px 0 0; margin-bottom: 8px;" />` : ""}
  <div style="font-size: 14px; font-weight: 700; color: #111; line-height: 1.3; margin-bottom: 4px;">${title}</div>
  ${position ? `<div style="font-size: 12px; color: #555; margin-bottom: 6px;">${position}</div>` : ""}
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
    ${price ? `<span style="font-size: 14px; font-weight: 700; color: ${ACCENT};">${price}</span>` : ""}
    ${distance ? `<span style="font-size: 11px; color: #777;">${distance}</span>` : ""}
  </div>
  ${href ? `<a href="${href}" style="display: inline-block; font-size: 12px; font-weight: 600; color: ${ACCENT}; text-decoration: none;">Открыть →</a>` : ""}
</div>`;
}

/**
 * Inner client-only MapView. Should be loaded via next/dynamic with ssr:false
 * (see ./MapView.tsx).
 */
export default function MapViewClient({
  markers,
  center,
  zoom,
  radiusMeters,
  onMarkerClick,
  className,
  style,
}: MapViewClientProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const initializedRef = useRef(false);

  const resolvedCenter = useMemo(
    () => center ?? DEFAULT_CENTER,
    [center],
  );
  const resolvedZoom = zoom ?? DEFAULT_ZOOM;

  // Init map exactly once.
  useEffect(() => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [resolvedCenter.lng, resolvedCenter.lat],
      zoom: resolvedZoom,
      attributionControl: { compact: true },
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => {
      // Radius circle source/layers.
      map.addSource("radius-circle", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });
      map.addLayer({
        id: "radius-circle-fill",
        type: "fill",
        source: "radius-circle",
        paint: {
          "fill-color": ACCENT_FILL,
          "fill-opacity": 1,
        },
      });
      map.addLayer({
        id: "radius-circle-outline",
        type: "line",
        source: "radius-circle",
        paint: {
          "line-color": ACCENT,
          "line-width": 2,
          "line-opacity": 0.7,
        },
      });
    });

    mapRef.current = map;
    initializedRef.current = true;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center / zoom on prop change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({
      center: [resolvedCenter.lng, resolvedCenter.lat],
      zoom: resolvedZoom,
    });
  }, [resolvedCenter, resolvedZoom]);

  // Update radius circle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = (): void => {
      const source = map.getSource("radius-circle") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;
      if (radiusMeters && radiusMeters > 0) {
        source.setData({
          type: "FeatureCollection",
          features: [
            buildCirclePolygon(
              resolvedCenter.lat,
              resolvedCenter.lng,
              radiusMeters,
            ),
          ],
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [radiusMeters, resolvedCenter]);

  // Sync markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing markers.
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const marker of markers) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", marker.label);
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "9999px";
      el.style.background = ACCENT;
      el.style.border = "3px solid #ffffff";
      el.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
      el.style.cursor = "pointer";
      el.style.padding = "0";

      const popup = new maplibregl.Popup({
        offset: 16,
        closeButton: true,
        closeOnClick: true,
        maxWidth: "260px",
      }).setHTML(buildPopupHtml(marker));

      const mlMarker = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (onMarkerClick) onMarkerClick(marker.id);
      });

      markersRef.current.push(mlMarker);
    }
  }, [markers, onMarkerClick]);

  return (
    <div
      className={className}
      style={{ width: "100%", height: "100%", ...style }}
    >
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />
    </div>
  );
}
