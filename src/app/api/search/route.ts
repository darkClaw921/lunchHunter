import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db/client";
import { bboxFromRadius, haversineDistance } from "@/lib/geo/haversine";

/**
 * GET /api/search
 *
 * Query params:
 *  - q (string, required): search query for menu items (FTS5)
 *  - lat, lng (number, optional): user coordinates for distance/radius filtering
 *  - radius (number, meters, optional, default 3000): search radius
 *  - sort ("cheapest" | "nearest" | "rating", optional, default "cheapest")
 *  - limit (number, optional, default 50)
 *
 * Pipeline:
 *  1. FTS5 MATCH on menu_items_fts (prefix-search friendly)
 *  2. JOIN restaurants
 *  3. Optional R*Tree bbox filter (restaurants_rtree) + haversine precise filter
 *  4. Sort
 */

export interface SearchResultItem {
  itemId: number;
  itemName: string;
  itemDescription: string | null;
  price: number;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
  restaurantCategory: string;
  restaurantCoverUrl: string | null;
  rating: number | null;
  address: string;
  lat: number;
  lng: number;
  distanceMeters: number | null;
}

export interface SearchResponse {
  query: string;
  count: number;
  sort: "cheapest" | "nearest" | "rating";
  results: SearchResultItem[];
}

type Sort = "cheapest" | "nearest" | "rating";

function parseSort(value: string | null): Sort {
  if (value === "nearest" || value === "rating") return value;
  return "cheapest";
}

function parseNumber(value: string | null): number | null {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Sanitize an FTS5 MATCH query: escape double quotes and wrap each token
 * in quotes with trailing * for prefix search. This is the safest way to
 * defend against FTS5 query syntax injection while still allowing multi-word
 * queries.
 */
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

export async function GET(request: Request): Promise<NextResponse<SearchResponse | { error: string }>> {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const lat = parseNumber(url.searchParams.get("lat"));
  const lng = parseNumber(url.searchParams.get("lng"));
  const radius = parseNumber(url.searchParams.get("radius")) ?? 3000;
  const sort = parseSort(url.searchParams.get("sort"));
  const limit = Math.min(parseNumber(url.searchParams.get("limit")) ?? 50, 200);

  if (q.length === 0) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 },
    );
  }

  const ftsQuery = buildFtsMatchQuery(q);
  if (ftsQuery.length === 0) {
    return NextResponse.json({
      query: q,
      count: 0,
      sort,
      results: [],
    });
  }

  const useGeo = lat !== null && lng !== null;
  let rows: Row[];

  if (useGeo) {
    const bbox = bboxFromRadius(lat, lng, radius);
    const stmt = sqlite.prepare(`
      SELECT
        mi.id            AS item_id,
        mi.name          AS item_name,
        mi.description   AS item_description,
        mi.price         AS price,
        r.id             AS restaurant_id,
        r.name           AS restaurant_name,
        r.slug           AS restaurant_slug,
        r.category       AS restaurant_category,
        r.cover_url      AS restaurant_cover_url,
        r.rating         AS rating,
        r.address        AS address,
        r.lat            AS lat,
        r.lng            AS lng
      FROM menu_items_fts
      JOIN menu_items  AS mi ON mi.id = menu_items_fts.rowid
      JOIN restaurants AS r  ON r.id  = mi.restaurant_id
      JOIN restaurants_rtree AS rt ON rt.id = r.id
      WHERE menu_items_fts MATCH ?
        AND mi.status = 'active'
        AND r.status  = 'published'
        AND rt.min_lat <= ? AND rt.max_lat >= ?
        AND rt.min_lng <= ? AND rt.max_lng >= ?
      LIMIT ?
    `);
    rows = stmt.all(
      ftsQuery,
      bbox.maxLat,
      bbox.minLat,
      bbox.maxLng,
      bbox.minLng,
      limit * 2,
    ) as Row[];
  } else {
    const stmt = sqlite.prepare(`
      SELECT
        mi.id            AS item_id,
        mi.name          AS item_name,
        mi.description   AS item_description,
        mi.price         AS price,
        r.id             AS restaurant_id,
        r.name           AS restaurant_name,
        r.slug           AS restaurant_slug,
        r.category       AS restaurant_category,
        r.cover_url      AS restaurant_cover_url,
        r.rating         AS rating,
        r.address        AS address,
        r.lat            AS lat,
        r.lng            AS lng
      FROM menu_items_fts
      JOIN menu_items  AS mi ON mi.id = menu_items_fts.rowid
      JOIN restaurants AS r  ON r.id  = mi.restaurant_id
      WHERE menu_items_fts MATCH ?
        AND mi.status = 'active'
        AND r.status  = 'published'
      LIMIT ?
    `);
    rows = stmt.all(ftsQuery, limit * 2) as Row[];
  }

  let results: SearchResultItem[] = rows.map((row) => ({
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
    distanceMeters: useGeo
      ? Math.round(haversineDistance(lat, lng, row.lat, row.lng))
      : null,
  }));

  if (useGeo) {
    results = results.filter(
      (r) => r.distanceMeters !== null && r.distanceMeters <= radius,
    );
  }

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

  results = results.slice(0, limit);

  return NextResponse.json({
    query: q,
    count: results.length,
    sort,
    results,
  });
}
