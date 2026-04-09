"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { RadiusSelector } from "@/components/map/RadiusSelector";
import { navigate, supportsViewTransitions } from "@/lib/transitions";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";
import { formatPrice, formatDistance } from "@/lib/utils/format";

export interface MobileMapItem {
  /** Уникальный id пункта меню (ключ React list). */
  id: number;
  /** Numeric restaurant id — используется для `viewTransitionName` shared
   * element morph к hero на странице `/restaurant/[id]`. */
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
  /** Hi-res cover URL ресторана — используется для image prefetch через
   * usePrefetchImage() на hover/pointerdown, чтобы VT morph не flash'ил. */
  restaurantCoverUrl: string | null;
  itemName: string;
  price: number;
  distanceMeters: number;
  lat: number;
  lng: number;
}

export interface MobileMapViewProps {
  query: string;
  radius: number;
  centerLat: number;
  centerLng: number;
  items: MobileMapItem[];
}

/**
 * Mobile /map page client wrapper.
 *
 * Renders a fullscreen-ish MapView with:
 *   • RadiusSelector floating at the top — navigates to a new URL on change
 *     (server reruns the geo query and re-renders).
 *   • Restaurant markers with clickable popups.
 *   • Bottom sheet with the 2 closest results — каждая карточка это чистый
 *     {@link Link} из `next/link` + shared-element morph через
 *     `viewTransitionName: 'restaurant-image-${id}'` (если `restaurantId`
 *     задан). Fallback для Telegram Mini App — `handleClick` +
 *     `navigate()` из `@/lib/transitions` (manualFlipMorph).
 */
export function MobileMapView({
  query,
  radius,
  centerLat,
  centerLng,
  items,
}: MobileMapViewProps): React.JSX.Element {
  const router = useRouter();
  const [isPending, startRouteTransition] = useTransition();

  const markers: MapMarker[] = items.map((item) => ({
    id: item.id,
    lat: item.lat,
    lng: item.lng,
    label: item.restaurantName,
    position: item.itemName,
    price: item.price,
    distanceMeters: item.distanceMeters,
    href: `/restaurant/${item.restaurantSlug}?q=${encodeURIComponent(query)}`,
  }));

  const handleRadiusChange = (next: number): void => {
    const url = `/map?q=${encodeURIComponent(query)}&radius=${next}`;
    startRouteTransition(() => {
      router.push(url as never);
    });
  };

  const top2 = items.slice(0, 2);

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Map area */}
      <div className="relative flex-1 min-h-[55vh]">
        <MapView
          markers={markers}
          center={{ lat: centerLat, lng: centerLng }}
          zoom={13}
          radiusMeters={radius}
          className="absolute inset-0"
        />

        {/* Radius selector floating top */}
        <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-full bg-surface-primary shadow-md px-2 py-1.5 border border-border">
            <RadiusSelector
              value={radius}
              onChange={handleRadiusChange}
              size="sm"
            />
          </div>
        </div>

        {isPending ? (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-[11px] text-fg-muted bg-surface-primary/90 px-2 py-1 rounded">
            Обновление…
          </div>
        ) : null}
      </div>

      {/* Bottom sheet — 2 nearest */}
      <div className="px-5 pt-4 pb-6 flex flex-col gap-2 bg-surface-primary border-t border-border-light">
        {top2.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface-primary p-4 text-center text-sm text-fg-muted">
            В этом радиусе ничего не найдено
          </div>
        ) : (
          top2.map((item) => (
            <MobileMapResultCard key={item.id} item={item} query={query} />
          ))
        )}
      </div>
    </div>
  );
}

function MobileMapResultCard({
  item,
  query,
}: {
  item: MobileMapItem;
  query: string;
}): React.JSX.Element {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetchImage = usePrefetchImage();
  const href = `/restaurant/${item.restaurantSlug}?q=${encodeURIComponent(query)}`;

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>): void => {
    if (supportsViewTransitions()) return;
    event.preventDefault();
    navigate(router, href, {
      sourceEl: linkRef.current,
      targetSelector: `[data-vt-target="restaurant-image-${item.restaurantId}"]`,
    });
  };

  const handlePrefetch = (): void => {
    prefetchImage(item.restaurantCoverUrl);
  };

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onPointerEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      style={{ viewTransitionName: `restaurant-image-${item.restaurantId}` }}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-primary p-3 shadow-hover"
    >
      <div className="min-w-0 flex-1">
        <div
          style={{
            viewTransitionName: `restaurant-title-${item.restaurantId}`,
          }}
          className="text-[14px] font-semibold text-fg-primary truncate min-h-[1.125rem]"
        >
          {item.restaurantName}
        </div>
        <div className="text-[12px] text-fg-secondary truncate">
          {item.itemName} · {formatPrice(item.price)}
        </div>
      </div>
      <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full bg-accent-light text-accent text-[11px] font-medium">
        {formatDistance(item.distanceMeters)}
      </span>
    </Link>
  );
}

export default MobileMapView;
