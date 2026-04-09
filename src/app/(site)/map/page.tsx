import { sqlite } from "@/lib/db/client";
import { bboxFromRadius, haversineDistance } from "@/lib/geo/haversine";
import { SearchHomeForm } from "../_components/SearchHomeForm";
import { MobileMapView } from "./_components/MobileMapView";

export const dynamic = "force-dynamic";

const DEFAULT_LAT = 55.7558;
const DEFAULT_LNG = 37.6173;

interface PageProps {
  searchParams: Promise<{
    q?: string;
    radius?: string;
  }>;
}

interface NearRow {
  menu_item_id: number;
  restaurant_id: number;
  restaurant_name: string;
  restaurant_slug: string;
  restaurant_cover_url: string | null;
  item_name: string;
  price: number;
  lat: number;
  lng: number;
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

function findNearby(q: string, radius: number): {
  id: number;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
  restaurantCoverUrl: string | null;
  itemName: string;
  price: number;
  distanceMeters: number;
  lat: number;
  lng: number;
}[] {
  const fts = buildFtsMatchQuery(q);
  if (!fts) return [];
  const bbox = bboxFromRadius(DEFAULT_LAT, DEFAULT_LNG, radius);
  const rows = sqlite
    .prepare(
      `SELECT mi.id AS menu_item_id, r.id AS restaurant_id,
              r.name AS restaurant_name, r.slug AS restaurant_slug,
              r.cover_url AS restaurant_cover_url,
              mi.name AS item_name, mi.price AS price, r.lat, r.lng
       FROM menu_items_fts
       JOIN menu_items AS mi ON mi.id = menu_items_fts.rowid
       JOIN restaurants AS r ON r.id = mi.restaurant_id
       JOIN restaurants_rtree AS rt ON rt.id = r.id
       WHERE menu_items_fts MATCH ?
         AND mi.status = 'active' AND r.status = 'published'
         AND rt.min_lat <= ? AND rt.max_lat >= ?
         AND rt.min_lng <= ? AND rt.max_lng >= ?
       LIMIT 50`,
    )
    .all(fts, bbox.maxLat, bbox.minLat, bbox.maxLng, bbox.minLng) as NearRow[];

  return rows
    .map((row) => ({
      id: row.menu_item_id,
      restaurantId: row.restaurant_id,
      restaurantName: row.restaurant_name,
      restaurantSlug: row.restaurant_slug,
      restaurantCoverUrl: row.restaurant_cover_url,
      itemName: row.item_name,
      price: row.price,
      distanceMeters: Math.round(
        haversineDistance(DEFAULT_LAT, DEFAULT_LNG, row.lat, row.lng),
      ),
      lat: row.lat,
      lng: row.lng,
    }))
    .filter((r) => r.distanceMeters <= radius)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export default async function MapPage({
  searchParams,
}: PageProps): Promise<React.JSX.Element> {
  const params = await searchParams;
  const q = (params.q ?? "Пиво").trim();
  const selectedMeters = Number(params.radius) || 1000;

  const items = findNearby(q, selectedMeters);

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-64px)]">
      <div className="px-5 pt-4">
        <SearchHomeForm initialQuery={q} placeholder="Пиво, суши, кофе..." />
      </div>

      <MobileMapView
        query={q}
        radius={selectedMeters}
        centerLat={DEFAULT_LAT}
        centerLng={DEFAULT_LNG}
        items={items}
      />
    </div>
  );
}
