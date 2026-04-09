"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UtensilsCrossed, Star } from "lucide-react";
import type { SearchResultItem } from "@/app/api/search/route";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { RadiusSelector } from "@/components/map/RadiusSelector";

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


/**
 * Desktop — Search Results (frame pqZ50 в lanchHunter.pen).
 *
 * Split-view:
 * - Левая панель 790px (≈55%) — sort controls + список результатов
 *   (radius-lg, surface-secondary, 72×72 accent-light thumbnail с иконкой
 *   `utensils`, flex-col info).
 * - Правая панель (≈45%) — map-placeholder (#ECEEF1) с 5 оранжевыми
 *   маркерами в псевдослучайных позициях, floating radius row сверху слева.
 *
 * Точки-маркеры projection-based: lat/lng приводятся к относительным
 * координатам в pencil-подобный bbox (центр Москвы). Интеграция реального
 * MapLibre — Phase 5.
 */
export function DesktopSearchResults({
  query,
  sort,
  results,
  className,
}: DesktopSearchResultsProps): React.JSX.Element {
  const [radius, setRadius] = useState<number>(5000);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);

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
              <Link
                key={r.itemId}
                href={{
                  pathname: `/restaurant/${r.restaurantSlug}`,
                  query: { q: query },
                }}
                onMouseEnter={() => setActiveMarkerId(r.itemId)}
                onMouseLeave={() => setActiveMarkerId(null)}
                className={cn(
                  "flex items-center gap-4 rounded-2xl bg-surface-secondary p-4 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-shadow",
                  activeMarkerId === r.itemId && "ring-2 ring-accent",
                )}
              >
                <div className="h-[72px] w-[72px] shrink-0 rounded-xl bg-accent-light grid place-items-center">
                  <UtensilsCrossed className="h-7 w-7 text-accent" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <h3 className="text-[15px] font-semibold text-fg-primary truncate">
                    {r.restaurantName}
                  </h3>
                  <p className="text-[13px] text-fg-secondary truncate">
                    {r.itemName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-3 text-[12px] text-fg-muted">
                    <span className="font-bold text-accent text-[15px]">
                      {formatPrice(r.price)}
                    </span>
                    {r.distanceMeters !== null ? (
                      <span>{formatDistance(r.distanceMeters)}</span>
                    ) : null}
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {formatRating(r.rating)}
                    </span>
                  </div>
                </div>
              </Link>
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
          <RadiusSelector
            value={radius}
            onChange={setRadius}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}

export default DesktopSearchResults;
