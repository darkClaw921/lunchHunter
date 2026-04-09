import Link from "next/link";
import { SlidersHorizontal, ArrowDownUp, Clock, Star } from "lucide-react";
import { sqlite } from "@/lib/db/client";
import { bboxFromRadius, haversineDistance } from "@/lib/geo/haversine";
import { formatPrice, formatDistance, formatRating } from "@/lib/utils/format";
import { DesktopBusinessLunch } from "./_components/DesktopBusinessLunch";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;
const DEFAULT_RADIUS = 5000;

interface PageProps {
  searchParams: Promise<{
    active?: string;
    maxPrice?: string;
  }>;
}

interface Row {
  id: number;
  name: string;
  price: number;
  time_from: string;
  time_to: string;
  days_mask: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  cover_url: string | null;
}

interface DayRow {
  lunch_id: number;
  courses_json: string;
}

function jsDayToAppWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

function parseCourses(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    return [];
  }
  return [];
}

function isServingNow(
  now: Date,
  daysMask: number,
  timeFrom: string,
  timeTo: string,
): boolean {
  const weekday = jsDayToAppWeekday(now.getDay());
  const bit = 1 << (weekday - 1);
  if ((daysMask & bit) === 0) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const [fH = 0, fM = 0] = timeFrom.split(":").map(Number);
  const [tH = 0, tM = 0] = timeTo.split(":").map(Number);
  return minutes >= fH * 60 + fM && minutes <= tH * 60 + tM;
}

interface Lunch {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  restaurantName: string;
  restaurantSlug: string;
  rating: number | null;
  distanceMeters: number;
  servingNow: boolean;
  courses: string[];
  coverUrl: string | null;
}

async function loadLunches(): Promise<Lunch[]> {
  const bbox = bboxFromRadius(DEFAULT_LAT, DEFAULT_LNG, DEFAULT_RADIUS);
  const rows = sqlite
    .prepare(
      `SELECT bl.id, bl.name, bl.price, bl.time_from, bl.time_to, bl.days_mask,
              r.id AS restaurant_id, r.name AS restaurant_name, r.slug AS restaurant_slug,
              r.address, r.lat, r.lng, r.rating, r.cover_url
       FROM business_lunches bl
       JOIN restaurants r ON r.id = bl.restaurant_id
       JOIN restaurants_rtree rt ON rt.id = r.id
       WHERE bl.status = 'active' AND r.status = 'published'
         AND rt.min_lat <= ? AND rt.max_lat >= ?
         AND rt.min_lng <= ? AND rt.max_lng >= ?
       LIMIT 50`,
    )
    .all(bbox.maxLat, bbox.minLat, bbox.maxLng, bbox.minLng) as Row[];

  if (rows.length === 0) return [];

  const now = new Date();
  const weekday = jsDayToAppWeekday(now.getDay());
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const dayRows = sqlite
    .prepare(
      `SELECT lunch_id, courses_json FROM business_lunch_days
       WHERE lunch_id IN (${placeholders}) AND weekday = ?`,
    )
    .all(...ids, weekday) as DayRow[];

  const coursesByLunchId = new Map<number, string[]>();
  for (const d of dayRows) {
    coursesByLunchId.set(d.lunch_id, parseCourses(d.courses_json));
  }

  return rows
    .map<Lunch>((row) => ({
      id: row.id,
      name: row.name,
      price: row.price,
      timeFrom: row.time_from,
      timeTo: row.time_to,
      restaurantName: row.restaurant_name,
      restaurantSlug: row.restaurant_slug,
      rating: row.rating,
      distanceMeters: Math.round(
        haversineDistance(DEFAULT_LAT, DEFAULT_LNG, row.lat, row.lng),
      ),
      servingNow: isServingNow(now, row.days_mask, row.time_from, row.time_to),
      courses: coursesByLunchId.get(row.id) ?? [],
      coverUrl: row.cover_url,
    }))
    .filter((l) => l.distanceMeters <= DEFAULT_RADIUS);
}

const PRICE_FILTERS = [
  { key: "350", label: "до 350₽", max: 350 },
  { key: "500", label: "до 500₽", max: 500 },
  { key: "700", label: "до 700₽", max: 700 },
];

function FilterPill({
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
        "inline-flex items-center h-9 px-4 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors " +
        (active
          ? "bg-accent text-white"
          : "bg-surface-primary border border-border text-fg-primary hover:bg-surface-secondary")
      }
    >
      {children}
    </Link>
  );
}

export default async function BusinessLunchListPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const activeOnly = params.active === "true";
  const maxPriceNum =
    params.maxPrice !== undefined && params.maxPrice !== ""
      ? Number(params.maxPrice)
      : null;

  let lunches = await loadLunches();
  if (activeOnly) lunches = lunches.filter((l) => l.servingNow);
  if (maxPriceNum !== null) lunches = lunches.filter((l) => l.price <= maxPriceNum);
  lunches.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const buildHref = (overrides: Record<string, string | null>): string => {
    const sp = new URLSearchParams();
    const mergedActive = overrides.active ?? (activeOnly ? "true" : null);
    const mergedMax =
      "maxPrice" in overrides ? overrides.maxPrice : params.maxPrice ?? null;
    if (mergedActive) sp.set("active", mergedActive);
    if (mergedMax) sp.set("maxPrice", mergedMax);
    const qs = sp.toString();
    return qs ? `/business-lunch?${qs}` : "/business-lunch";
  };

  return (
    <>
      <DesktopBusinessLunch
        lunches={lunches}
        activeOnly={activeOnly}
        maxPrice={maxPriceNum}
        className="hidden md:flex"
      />
      <div className="flex flex-col md:hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-[22px] font-bold text-fg-primary">
          🍽 Бизнес-ланчи
        </h1>
        <button
          type="button"
          aria-label="Фильтры"
          className="h-10 w-10 grid place-items-center rounded-full text-fg-primary hover:bg-surface-secondary"
        >
          <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Filter pills */}
      <div className="px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <FilterPill href={buildHref({ active: activeOnly ? null : "true" })} active={activeOnly}>
            Сейчас подают
          </FilterPill>
          {PRICE_FILTERS.map((pf) => (
            <FilterPill
              key={pf.key}
              href={buildHref({ maxPrice: String(pf.max) })}
              active={maxPriceNum === pf.max}
            >
              {pf.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Sort label */}
      <div className="px-5 mt-3 flex items-center gap-1.5 text-[13px] text-fg-secondary">
        <ArrowDownUp className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Сортировка: Ближайшие</span>
      </div>

      {/* Cards */}
      <div className="px-5 mt-3 flex flex-col gap-3 pb-4">
        {lunches.length === 0 ? (
          <div className="py-10 text-center text-sm text-fg-muted">
            Ничего не найдено
          </div>
        ) : (
          lunches.map((l) => (
            <Link
              key={l.id}
              href={{ pathname: `/business-lunch/${l.id}` }}
              className="block rounded-2xl border border-border bg-surface-primary p-4 shadow-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[16px] font-bold text-fg-primary truncate min-h-[1.375rem]">
                      {l.restaurantName}
                    </h3>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[12px] text-fg-secondary">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {l.timeFrom} — {l.timeTo}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-fg-secondary line-clamp-1">
                    {l.courses.length > 0
                      ? l.courses.join(" · ")
                      : `${l.name}`}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 text-[12px] text-fg-secondary">
                      <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
                      {formatRating(l.rating)}
                    </span>
                    <span className="inline-flex items-center h-5 px-2 rounded-full bg-accent-light text-accent text-[11px] font-medium">
                      {formatDistance(l.distanceMeters)}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {l.servingNow ? (
                    <span className="inline-flex items-center h-5 px-2 rounded-full bg-success/15 text-success text-[10px] font-semibold">
                      Сейчас подают
                    </span>
                  ) : null}
                  <div className="text-[22px] font-bold text-accent leading-none">
                    {formatPrice(l.price)}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
      </div>
    </>
  );
}
