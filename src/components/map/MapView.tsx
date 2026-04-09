"use client";

import dynamic from "next/dynamic";
import type { MapViewClientProps, MapMarker } from "./MapViewClient";

/**
 * SSR-safe wrapper around MapViewClient.
 *
 * MapLibre GL touches `window` at module level, so we load it only on the
 * client via next/dynamic with ssr:false. Importers should use this file
 * (`MapView`) — never `MapViewClient` directly.
 */
const MapView = dynamic(() => import("./MapViewClient"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full bg-surface-secondary animate-pulse"
      aria-label="Загрузка карты"
    />
  ),
});

export default MapView;
export { MapView };
export type { MapViewClientProps as MapViewProps, MapMarker };
