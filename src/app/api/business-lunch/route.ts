import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db/client";
import { bboxFromRadius, haversineDistance } from "@/lib/geo/haversine";

/**
 * GET /api/business-lunch
 *
 * Query params:
 *  - lat, lng (number, optional): координаты пользователя
 *  - radius (number, meters, optional, default 5000)
 *  - active (boolean, optional): если true — только активные сейчас ланчи
 *    (день недели в days_mask и текущее время в диапазоне time_from..time_to)
 *  - maxPrice (number, optional)
 *  - sort ("nearest" | "cheapest", optional, default "nearest")
 *  - limit (number, optional, default 50)
 */

export interface BusinessLunchDto {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  daysMask: number;
  status: "active" | "inactive";
  isServingNow: boolean;
  courses: string[];
  restaurant: {
    id: number;
    name: string;
    slug: string;
    address: string;
    lat: number;
    lng: number;
    rating: number | null;
  };
  distanceMeters: number | null;
}

export interface BusinessLunchResponse {
  count: number;
  now: string;
  results: BusinessLunchDto[];
}

function parseNumber(value: string | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Convert JS Date.getDay() (0=Sun..6=Sat) to app weekday (1=Mon..7=Sun). */
function jsDayToAppWeekday(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/** HH:MM string → minutes since midnight. */
function parseTimeToMinutes(hhmm: string): number {
  const parts = hhmm.split(":");
  const h = Number(parts[0] ?? "0");
  const m = Number(parts[1] ?? "0");
  return h * 60 + m;
}

interface LunchRow {
  id: number;
  name: string;
  price: number;
  time_from: string;
  time_to: string;
  days_mask: number;
  status: "active" | "inactive";
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
}

interface DayRow {
  lunch_id: number;
  weekday: number;
  courses_json: string;
}

function parseCourses(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
  } catch {
    // fall through
  }
  return [];
}

export async function GET(
  request: Request,
): Promise<NextResponse<BusinessLunchResponse>> {
  const url = new URL(request.url);
  const lat = parseNumber(url.searchParams.get("lat"));
  const lng = parseNumber(url.searchParams.get("lng"));
  const radius = parseNumber(url.searchParams.get("radius")) ?? 5000;
  const activeOnly = url.searchParams.get("active") === "true";
  const maxPrice = parseNumber(url.searchParams.get("maxPrice"));
  const sortParam = url.searchParams.get("sort");
  const sort: "nearest" | "cheapest" =
    sortParam === "cheapest" ? "cheapest" : "nearest";
  const limit = Math.min(parseNumber(url.searchParams.get("limit")) ?? 50, 200);

  const useGeo = lat !== null && lng !== null;
  const now = new Date();
  const currentWeekday = jsDayToAppWeekday(now.getDay());
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayBit = 1 << (currentWeekday - 1);

  let lunches: LunchRow[];

  if (useGeo) {
    const bbox = bboxFromRadius(lat, lng, radius);
    const stmt = sqlite.prepare(`
      SELECT
        bl.id          AS id,
        bl.name        AS name,
        bl.price       AS price,
        bl.time_from   AS time_from,
        bl.time_to     AS time_to,
        bl.days_mask   AS days_mask,
        bl.status      AS status,
        r.id           AS restaurant_id,
        r.name         AS restaurant_name,
        r.slug         AS restaurant_slug,
        r.address      AS address,
        r.lat          AS lat,
        r.lng          AS lng,
        r.rating       AS rating
      FROM business_lunches AS bl
      JOIN restaurants      AS r  ON r.id = bl.restaurant_id
      JOIN restaurants_rtree AS rt ON rt.id = r.id
      WHERE bl.status = 'active'
        AND r.status  = 'published'
        AND rt.min_lat <= ? AND rt.max_lat >= ?
        AND rt.min_lng <= ? AND rt.max_lng >= ?
      LIMIT ?
    `);
    lunches = stmt.all(
      bbox.maxLat,
      bbox.minLat,
      bbox.maxLng,
      bbox.minLng,
      limit * 2,
    ) as LunchRow[];
  } else {
    const stmt = sqlite.prepare(`
      SELECT
        bl.id          AS id,
        bl.name        AS name,
        bl.price       AS price,
        bl.time_from   AS time_from,
        bl.time_to     AS time_to,
        bl.days_mask   AS days_mask,
        bl.status      AS status,
        r.id           AS restaurant_id,
        r.name         AS restaurant_name,
        r.slug         AS restaurant_slug,
        r.address      AS address,
        r.lat          AS lat,
        r.lng          AS lng,
        r.rating       AS rating
      FROM business_lunches AS bl
      JOIN restaurants      AS r  ON r.id = bl.restaurant_id
      WHERE bl.status = 'active'
        AND r.status  = 'published'
      LIMIT ?
    `);
    lunches = stmt.all(limit * 2) as LunchRow[];
  }

  if (lunches.length === 0) {
    return NextResponse.json({
      count: 0,
      now: now.toISOString(),
      results: [],
    });
  }

  // Fetch today's courses for all these lunches
  const lunchIds = lunches.map((l) => l.id);
  const placeholders = lunchIds.map(() => "?").join(",");
  const dayRows = sqlite
    .prepare(
      `SELECT lunch_id, weekday, courses_json FROM business_lunch_days WHERE lunch_id IN (${placeholders}) AND weekday = ?`,
    )
    .all(...lunchIds, currentWeekday) as DayRow[];
  const coursesByLunchId = new Map<number, string[]>();
  for (const row of dayRows) {
    coursesByLunchId.set(row.lunch_id, parseCourses(row.courses_json));
  }

  let results: BusinessLunchDto[] = lunches.map((row) => {
    const fromMin = parseTimeToMinutes(row.time_from);
    const toMin = parseTimeToMinutes(row.time_to);
    const dayMatches = (row.days_mask & dayBit) !== 0;
    const timeMatches = currentMinutes >= fromMin && currentMinutes <= toMin;
    const isServingNow = dayMatches && timeMatches;

    return {
      id: row.id,
      name: row.name,
      price: row.price,
      timeFrom: row.time_from,
      timeTo: row.time_to,
      daysMask: row.days_mask,
      status: row.status,
      isServingNow,
      courses: coursesByLunchId.get(row.id) ?? [],
      restaurant: {
        id: row.restaurant_id,
        name: row.restaurant_name,
        slug: row.restaurant_slug,
        address: row.address,
        lat: row.lat,
        lng: row.lng,
        rating: row.rating,
      },
      distanceMeters: useGeo
        ? Math.round(haversineDistance(lat, lng, row.lat, row.lng))
        : null,
    };
  });

  if (useGeo) {
    results = results.filter(
      (r) => r.distanceMeters !== null && r.distanceMeters <= radius,
    );
  }
  if (activeOnly) {
    results = results.filter((r) => r.isServingNow);
  }
  if (maxPrice !== null) {
    results = results.filter((r) => r.price <= maxPrice);
  }

  results.sort((a, b) => {
    if (sort === "cheapest") return a.price - b.price;
    return (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity);
  });

  results = results.slice(0, limit);

  return NextResponse.json({
    count: results.length,
    now: now.toISOString(),
    results,
  });
}
