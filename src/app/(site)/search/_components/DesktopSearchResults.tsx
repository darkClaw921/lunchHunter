"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { UtensilsCrossed, Star } from "lucide-react";
import type { SearchResultItem } from "@/app/api/search/route";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { RadiusSelector } from "@/components/map/RadiusSelector";
import { navigate, supportsViewTransitions } from "@/lib/transitions";
import { usePrefetchImage } from "@/lib/hooks/usePrefetchImage";
import {
  useActiveVT,
  ACTIVE_RESTAURANT_VT_STORAGE_KEY,
} from "@/lib/hooks/useActiveVT";

const MOSCOW_CENTER = { lat: 55.7558, lng: 37.6173 };

export type DesktopSort = "cheapest" | "nearest" | "rating";

export interface DesktopSearchResultsProps {
  query: string;
  sort: DesktopSort;
  results: SearchResultItem[];
  className?: string;
}

interface SortChipProps {
  label: string;
  active: boolean;
  href: string;
}

function SortChip({ label, active, href }: SortChipProps): React.JSX.Element {
  return (
    <Link
      href={href as never}
      className={cn(
        "inline-flex items-center h-8 px-3.5 rounded-full text-[13px] font-medium transition-colors",
        active
          ? "bg-accent text-white"
          : "bg-surface-secondary text-fg-secondary hover:bg-surface-secondary/80",
      )}
    >
      {label}
    </Link>
  );
}

interface SearchResultCardProps {
  result: SearchResultItem;
  query: string;
  activeMarkerId: number | null;
  isActive: boolean;
  onActivate: () => void;
  onHoverEnter: () => void;
  onHoverLeave: () => void;
}

/**
 * Отдельный компонент карточки результата. `viewTransitionName` ставится
 * **только** если `isActive === true` (§9.5.3). На устройствах с VT API
 * клик просто пропускается и браузер сам делает morph через
 * `@view-transition { navigation: auto }`.
 */
function SearchResultCard({
  result: r,
  query,
  activeMarkerId,
  isActive,
  onActivate,
  onHoverEnter,
  onHoverLeave,
}: SearchResultCardProps): React.JSX.Element {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const prefetchImage = usePrefetchImage();
  const href = `/restaurant/${r.restaurantSlug}?q=${encodeURIComponent(query)}`;

  const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>): void => {
    onActivate();
    if (supportsViewTransitions()) return;
    event.preventDefault();
    navigate(router, href, {
      sourceEl: linkRef.current,
      targetSelector: `[data-vt-target="restaurant-image-${r.restaurantId}"]`,
    });
  };

  const handlePrefetch = (): void => {
    prefetchImage(r.restaurantCoverUrl);
  };

  const imageVtStyle = isActive
    ? { viewTransitionName: `restaurant-image-${r.restaurantId}` }
    : undefined;
  const titleVtStyle = isActive
    ? { viewTransitionName: `restaurant-title-${r.restaurantId}` }
    : undefined;

  return (
    <Link
      ref={linkRef}
      href={href}
      onClick={handleClick}
      onMouseEnter={onHoverEnter}
      onMouseLeave={onHoverLeave}
      onPointerEnter={handlePrefetch}
      onPointerDown={handlePrefetch}
      className={cn(
        "flex items-center gap-4 rounded-2xl bg-surface-secondary p-4 shadow-hover",
        activeMarkerId === r.itemId && "ring-2 ring-accent",
      )}
    >
      <div
        style={imageVtStyle}
        className="h-[72px] w-[72px] shrink-0 rounded-xl bg-accent-light grid place-items-center overflow-hidden"
      >
        <UtensilsCrossed
          className="h-7 w-7 text-accent"
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3
          style={titleVtStyle}
          className="text-[15px] font-semibold text-fg-primary truncate min-h-[1.25rem]"
        >
          {r.restaurantName}
        </h3>
        <p className="text-[13px] text-fg-secondary truncate">{r.itemName}</p>
        <div className="mt-0.5 flex items-center gap-3 text-[12px] text-fg-muted">
          <span className="font-bold text-accent text-[15px]">
            {formatPrice(r.price)}
          </span>
          {r.distanceMeters !== null ? (
            <span>{formatDistance(r.distanceMeters)}</span>
          ) : null}
          <span className="inline-flex items-center gap-0.5">
            <Star
              className="h-3 w-3 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            {formatRating(r.rating)}
          </span>
        </div>
      </div>
    </Link>
  );
}


/**
 * Desktop — Search Results (frame pqZ50 в lanchHunter.pen).
 *
 * Split-view:
 * - Левая панель 790px (≈55%) — sort controls + список результатов
 *   (radius-lg, surface-secondary, 72×72 accent-light thumbnail с иконкой
 *   `utensils`, flex-col info).
 * - Правая панель (≈45%) — MapLibre GL карта с маркерами.
 *
 * shared-element morph по ANIMATIONS_GUIDE §9.5.3 — `viewTransitionName`
 * ставится только на активной карточке через `useActiveVT` + `flushSync`.
 * В Telegram WebView (без VT API) используется manual FLIP через `navigate()`.
 */
export function DesktopSearchResults({
  query,
  sort,
  results,
  className,
}: DesktopSearchResultsProps): React.JSX.Element {
  const [radius, setRadius] = useState<number>(5000);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const { activate, isActive } = useActiveVT<number>(
    ACTIVE_RESTAURANT_VT_STORAGE_KEY,
  );

  const filteredResults = useMemo(
    () =>
      results.filter(
        (r) => r.distanceMeters === null || (r.distanceMeters ?? 0) <= radius,
      ),
    [results, radius],
  );

  const markers: MapMarker[] = useMemo(
    () =>
      filteredResults.map((r) => ({
        id: r.itemId,
        lat: r.lat,
        lng: r.lng,
        label: r.restaurantName,
        position: r.itemName,
        price: r.price,
        distanceMeters: r.distanceMeters,
        href: `/restaurant/${r.restaurantSlug}?q=${encodeURIComponent(query)}`,
      })),
    [filteredResults, query],
  );

  return (
    <div className={cn("flex h-[calc(100vh-64px)]", className)}>
      {/* Left panel */}
      <div className="w-[55%] max-w-[790px] flex flex-col bg-surface-primary">
        {/* Sort row */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-border-light">
          <span className="text-[13px] font-medium text-fg-secondary">
            Сортировка:
          </span>
          <SortChip
            label="Цена"
            active={sort === "cheapest"}
            href={`/search?q=${encodeURIComponent(query)}&sort=cheapest`}
          />
          <SortChip
            label="Расстояние"
            active={sort === "nearest"}
            href={`/search?q=${encodeURIComponent(query)}&sort=nearest`}
          />
          <SortChip
            label="Рейтинг"
            active={sort === "rating"}
            href={`/search?q=${encodeURIComponent(query)}&sort=rating`}
          />
          <div className="flex-1" />
          <span className="text-[13px] text-fg-muted">
            {filteredResults.length} результатов
          </span>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
          {filteredResults.length === 0 ? (
            <div className="py-10 text-center text-fg-muted text-sm">
              {query
                ? `Ничего не найдено по запросу «${query}»`
                : "Введите запрос в строке поиска"}
            </div>
          ) : (
            filteredResults.map((r) => (
              <SearchResultCard
                key={r.itemId}
                result={r}
                query={query}
                activeMarkerId={activeMarkerId}
                isActive={isActive(r.restaurantId)}
                onActivate={() => activate(r.restaurantId)}
                onHoverEnter={() => setActiveMarkerId(r.itemId)}
                onHoverLeave={() => setActiveMarkerId(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel — MapLibre GL */}
      <div className="flex-1 relative bg-surface-secondary overflow-hidden">
        <MapView
          markers={markers}
          center={MOSCOW_CENTER}
          zoom={12}
          radiusMeters={radius}
          onMarkerClick={(id) =>
            setActiveMarkerId(typeof id === "number" ? id : null)
          }
          className="absolute inset-0"
        />

        {/* Radius pill row (floating) */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 h-10 px-3 rounded-2xl bg-surface-primary shadow-md">
          <span className="text-[13px] font-medium text-fg-secondary">
            Радиус:
          </span>
          <RadiusSelector value={radius} onChange={setRadius} size="sm" />
        </div>
      </div>
    </div>
  );
}

export default DesktopSearchResults;
