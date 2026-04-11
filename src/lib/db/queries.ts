/**
 * High-level запросы к БД для server components.
 *
 * Все функции выполняются в server-runtime (Next.js App Router) и возвращают
 * сериализуемые DTO. Используются страницами `(site)/*`.
 */
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, sqlite } from "./client";
import {
  restaurants,
  menuItems,
  businessLunches,
  businessLunchDays,
} from "./schema";
import { haversineDistance } from "@/lib/geo/haversine";

export interface NearbyRestaurant {
  id: number;
  name: string;
  slug: string;
  category: string;
  address: string;
  rating: number | null;
  priceAvg: number | null;
  coverUrl: string | null;
  tags: string[];
  distanceMeters: number | null;
}

function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is string => typeof t === "string");
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Получить список опубликованных ресторанов, опционально с расчётом
 * расстояния от указанной точки (сортировка nearest).
 */
export async function getNearbyRestaurants(
  params: {
    userLat?: number;
    userLng?: number;
    limit?: number;
    category?: string | null;
  } = {},
): Promise<NearbyRestaurant[]> {
  const limit = params.limit ?? 10;
  const conditions = [eq(restaurants.status, "published")];
  if (params.category) {
    conditions.push(eq(restaurants.category, params.category));
  }
  const rows = await db
    .select()
    .from(restaurants)
    .where(and(...conditions))
    .orderBy(desc(restaurants.rating))
    .limit(limit);

  const result: NearbyRestaurant[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    address: r.address,
    rating: r.rating,
    priceAvg: r.priceAvg,
    coverUrl: r.coverUrl,
    tags: parseTags(r.tagsJson),
    distanceMeters:
      params.userLat !== undefined && params.userLng !== undefined
        ? Math.round(
            haversineDistance(params.userLat, params.userLng, r.lat, r.lng),
          )
        : null,
  }));

  if (params.userLat !== undefined && params.userLng !== undefined) {
    result.sort(
      (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
    );
  }

  return result;
}

export interface PopularQuery {
  query: string;
  count: number;
}

/** Самые часто ищемые позиции меню — для секции "Популярные запросы". */
export async function getPopularQueries(limit = 8): Promise<PopularQuery[]> {
  // Для MVP отдаём наиболее часто встречающиеся ключевые слова из имён
  // позиций. На production-фазе заменим на count из search_history.
  const rows = await db
    .select({
      name: menuItems.name,
    })
    .from(menuItems)
    .where(eq(menuItems.status, "active"))
    .orderBy(asc(menuItems.id));

  const counts = new Map<string, number>();
  for (const row of rows) {
    const first = row.name.split(/\s+/)[0];
    if (!first) continue;
    const key = first.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Получить N активных бизнес-ланчей (для баннера Home). */
export async function getFeaturedBusinessLunches(limit = 3): Promise<
  {
    id: number;
    name: string;
    price: number;
    restaurantName: string;
    restaurantSlug: string;
    timeFrom: string;
    timeTo: string;
  }[]
> {
  const rows = sqlite
    .prepare(
      `SELECT bl.id, bl.name, bl.price, bl.time_from, bl.time_to,
              r.name AS restaurant_name, r.slug AS restaurant_slug
       FROM business_lunches bl
       JOIN restaurants r ON r.id = bl.restaurant_id
       WHERE bl.status = 'active' AND r.status = 'published'
       ORDER BY bl.price ASC
       LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    name: string;
    price: number;
    time_from: string;
    time_to: string;
    restaurant_name: string;
    restaurant_slug: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
    timeFrom: row.time_from,
    timeTo: row.time_to,
  }));
}

export interface FeaturedMenuItem {
  id: number;
  name: string;
  price: number;
  photoUrl: string | null;
  restaurantName: string;
  restaurantSlug: string;
}

/**
 * Получить N активных позиций меню с фото, ценой и названием ресторана.
 * Используется для декоративных hero-карточек на главной.
 */
export async function getFeaturedMenuItems(
  limit = 4,
): Promise<FeaturedMenuItem[]> {
  const rows = sqlite
    .prepare(
      `SELECT mi.id, mi.name, mi.price, mi.photo_url,
              r.name AS restaurant_name, r.slug AS restaurant_slug
       FROM menu_items mi
       JOIN restaurants r ON r.id = mi.restaurant_id
       WHERE mi.status = 'active' AND r.status = 'published'
         AND mi.photo_url IS NOT NULL
       ORDER BY mi.price ASC
       LIMIT ?`,
    )
    .all(limit) as {
    id: number;
    name: string;
    price: number;
    photo_url: string | null;
    restaurant_name: string;
    restaurant_slug: string;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    price: row.price,
    photoUrl: row.photo_url,
    restaurantName: row.restaurant_name,
    restaurantSlug: row.restaurant_slug,
  }));
}

/** Минимальная цена среди активных бизнес-ланчей (для «от X ₽»). */
export async function getMinBusinessLunchPrice(): Promise<number | null> {
  const row = await db
    .select({ min: sql<number>`MIN(${businessLunches.price})` })
    .from(businessLunches)
    .where(eq(businessLunches.status, "active"));
  const value = row[0]?.min ?? null;
  return value;
}

/**
 * Вспомогательный запрос: курсы (блюда) бизнес-ланча на сегодняшний день.
 */
export async function getBusinessLunchTodayCourses(
  lunchId: number,
  weekday: number,
): Promise<string[]> {
  const row = await db
    .select({ courses: businessLunchDays.coursesJson })
    .from(businessLunchDays)
    .where(
      sql`${businessLunchDays.lunchId} = ${lunchId} AND ${businessLunchDays.weekday} = ${weekday}`,
    )
    .limit(1);
  const json = row[0]?.courses;
  if (!json) return [];
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
