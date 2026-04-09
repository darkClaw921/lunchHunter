import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, ArrowDownUp } from "lucide-react";
import { sqlite } from "@/lib/db/client";
import { bboxFromRadius, haversineDistance } from "@/lib/geo/haversine";
import { validateSession } from "@/lib/auth/session";
import { recordSearchQuery } from "@/lib/db/search-history";
import { SearchHomeForm } from "../_components/SearchHomeForm";
import { DesktopSearchResults } from "./_components/DesktopSearchResults";
import { MobileSearchResults } from "./_components/MobileSearchResults";
import type { SearchResultItem } from "@/app/api/search/route";

export const dynamic = "force-dynamic";

// Moscow center default
const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;
const DEFAULT_RADIUS = 5000;

type Sort = "cheapest" | "nearest" | "rating";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
  }>;
}

function parseSort(value: string | undefined): Sort {
  if (value === "nearest" || value === "rating") return value;
  return "cheapest";
}

function buildFtsMatchQuery(raw: string): string {
  const tokens = raw
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.replace(/"/g, '""'));
  if (tokens.length === 0) return "";
  return tokens.map((t) => `"${t}"*`).join(" ");
}

interface Row {
  item_id: number;
  item_name: string;
  item_description: string | null;
  price: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_category: string;
  restaurant_cover_url: string | null;
  rating: number | null;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Локальный аналог /api/search — тот же pipeline без fetch для server component.
 */
function searchItems(q: string, sort: Sort): SearchResultItem[] {
  const fts = buildFtsMatchQuery(q);
  if (!fts) return [];

  const bbox = bboxFromRadius(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_RADIUS);
  const rows = sqlite
    .prepare(
      `SELECT
        mi.id AS item_id, mi.name AS item_name, mi.description AS item_description,
        mi.price AS price, r.id AS restaurant_id, r.name AS restaurant_name,
        r.slug AS restaurant_slug, r.category AS restaurant_category,
        r.cover_url AS restaurant_cover_url,
        r.rating AS rating, r.address AS address, r.lat AS lat, r.lng AS lng
      FROM menu_items_fts
      JOIN menu_items  AS mi ON mi.id = menu_items_fts.rowid
      JOIN restaurants AS r  ON r.id  = mi.restaurant_id
      JOIN restaurants_rtree AS rt ON rt.id = r.id
      WHERE menu_items_fts MATCH ?
        AND mi.status = 'active' AND r.status = 'published'
        AND rt.min_lat <= ? AND rt.max_lat >= ?
        AND rt.min_lng <= ? AND rt.max_lng >= ?
      LIMIT 200`,
    )
    .all(fts, bbox.maxLat, bbox.minLat, bbox.maxLng, bbox.minLng) as Row[];

  const results: SearchResultItem[] = rows
    .map((row) => ({
      itemId: row.item_id,
      itemName: row.item_name,
      itemDescription: row.item_description,
      price: row.price,
      restaurantId: row.restaurant_id,
      restaurantName: row.restaurant_name,
      restaurantSlug: row.restaurant_slug,
      restaurantCategory: row.restaurant_category,
      restaurantCoverUrl: row.restaurant_cover_url,
      rating: row.rating,
      address: row.address,
      lat: row.lat,
      lng: row.lng,
      distanceMeters: Math.round(
        haversineDistance(DEFAULT_LAT, DEFAULT_LNG, row.lat, row.lng),
      ),
    }))
    .filter((r) => (r.distanceMeters ?? 0) <= DEFAULT_RADIUS);

  results.sort((a, b) => {
    switch (sort) {
      case "cheapest":
        return a.price - b.price;
      case "nearest":
        return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
      case "rating":
        return (b.rating ?? 0) - (a.rating ?? 0);
    }
  });

  return results.slice(0, 50);
}

const SORT_LABEL: Record<Sort, string> = {
  cheapest: "Сначала дешёвые",
  nearest: "Сначала ближайшие",
  rating: "По рейтингу",
};

export default async function SearchResultsPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sort = parseSort(params.sort);

  const results = q ? searchItems(q, sort) : [];

  // Сохраняем запрос в историю, только если есть сессия и непустой q.
  if (q) {
    const session = await validateSession();
    if (session) {
      try {
        await recordSearchQuery(session.user.id, q);
      } catch {
        // silent fail — history не критична для ответа
      }
    }
  }

  return (
    <>
      <DesktopSearchResults
        query={q}
        sort={sort}
        results={results}
        className="hidden md:flex"
      />
      <div className="flex flex-col md:hidden">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Link
          href="/"
          aria-label="Назад"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <SearchHomeForm initialQuery={q} placeholder="Что ищем?" />
        </div>
        <button
          type="button"
          aria-label="Фильтры"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Filter chips */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterChip href={`/search?q=${encodeURIComponent(q)}&sort=cheapest`} active={sort === "cheapest"}>
            Сортировка
          </FilterChip>
          <FilterChip href={`/search?q=${encodeURIComponent(q)}&sort=cheapest`} active={sort === "cheapest"}>
            Цена
          </FilterChip>
          <FilterChip href={`/search?q=${encodeURIComponent(q)}&sort=nearest`} active={sort === "nearest"}>
            Расстояние
          </FilterChip>
          <FilterChip href={`/search?q=${encodeURIComponent(q)}&sort=rating`} active={sort === "rating"}>
            Рейтинг
          </FilterChip>
        </div>
      </div>

      {/* Sort indicator */}
      <div className="px-5 mt-3 flex items-center gap-1.5 text-[13px] text-fg-secondary">
        <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{SORT_LABEL[sort]}</span>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="px-5 mt-3 py-10 text-center text-fg-muted text-sm">
          {q
            ? `Ничего не найдено по запросу «${q}»`
            : "Введите запрос в строке поиска"}
        </div>
      ) : (
        <MobileSearchResults query={q} results={results} />
      )}
      </div>
    </>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Link
      href={href as never}
      className={
        "inline-flex items-center h-10 px-4 rounded-full text-sm font-medium transition-colors whitespace-nowrap " +
        (active
          ? "bg-accent text-white"
          : "bg-surface-primary border border-border text-fg-primary hover:bg-surface-secondary")
      }
    >
      {children}
    </Link>
  );
}
