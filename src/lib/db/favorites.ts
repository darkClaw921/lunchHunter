/**
 * Server-side helpers для работы с избранным пользователя.
 *
 * Избранное полиморфно: одна таблица `favorites` с (userId, targetType, targetId).
 * targetType ∈ {"restaurant", "menu_item", "lunch"}.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "./client";
import {
  favorites,
  type FavoriteTargetType,
  FAVORITE_TARGET_TYPES,
} from "./schema";

/**
 * Возвращает общее количество избранных элементов пользователя (всех типов).
 */
export async function getUserFavoritesCount(userId: string): Promise<number> {
  const row = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .get();
  return row?.count ?? 0;
}

export function isValidFavoriteTargetType(
  value: unknown,
): value is FavoriteTargetType {
  return (
    typeof value === "string" &&
    (FAVORITE_TARGET_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Проверяет, есть ли у пользователя данный элемент в избранном.
 */
export async function isFavorited(
  userId: string,
  targetType: FavoriteTargetType,
  targetId: number,
): Promise<boolean> {
  const row = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.targetType, targetType),
        eq(favorites.targetId, targetId),
      ),
    )
    .get();
  return row !== undefined;
}

/**
 * Возвращает Set<targetId> для указанного типа — удобно для batch-проверки
 * на списочных страницах и меню.
 */
export async function getFavoritedIds(
  userId: string,
  targetType: FavoriteTargetType,
  targetIds: readonly number[],
): Promise<Set<number>> {
  if (targetIds.length === 0) return new Set<number>();
  const rows = await db
    .select({ targetId: favorites.targetId })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.targetType, targetType),
        inArray(favorites.targetId, [...targetIds]),
      ),
    );
  return new Set(rows.map((r) => r.targetId));
}

/**
 * Добавляет/удаляет элемент из избранного. Возвращает новое состояние.
 * Идемпотентно: повторный вызов с тем же state остаётся консистентным.
 */
export async function toggleFavorite(
  userId: string,
  targetType: FavoriteTargetType,
  targetId: number,
): Promise<{ favorited: boolean }> {
  const existing = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.targetType, targetType),
        eq(favorites.targetId, targetId),
      ),
    )
    .get();

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return { favorited: false };
  }

  await db.insert(favorites).values({ userId, targetType, targetId });
  return { favorited: true };
}

export interface FavoriteRestaurantRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  address: string;
  rating: number | null;
  coverUrl: string | null;
  createdAt: Date;
}

export interface FavoriteMenuItemRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  photoUrl: string | null;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
  createdAt: Date;
}

export interface FavoriteLunchRow {
  id: number;
  name: string;
  price: number;
  timeFrom: string;
  timeTo: string;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
  restaurantCoverUrl: string | null;
  createdAt: Date;
}

export interface UserFavorites {
  restaurants: FavoriteRestaurantRow[];
  menuItems: FavoriteMenuItemRow[];
  lunches: FavoriteLunchRow[];
}

/**
 * Загружает все избранные элементы пользователя, сгруппированные по типам,
 * с присоединением детальной информации. Сортировка: свежие сверху.
 */
export async function getUserFavorites(userId: string): Promise<UserFavorites> {
  const { sqlite } = await import("./client");

  const restaurantRows = sqlite
    .prepare(
      `SELECT r.id, r.slug, r.name, r.category, r.address, r.rating,
              r.cover_url AS coverUrl, f.created_at AS createdAt
         FROM favorites f
         JOIN restaurants r ON r.id = f.target_id
        WHERE f.user_id = ? AND f.target_type = 'restaurant'
        ORDER BY f.created_at DESC`,
    )
    .all(userId) as {
    id: number;
    slug: string;
    name: string;
    category: string;
    address: string;
    rating: number | null;
    coverUrl: string | null;
    createdAt: number;
  }[];

  const menuItemRows = sqlite
    .prepare(
      `SELECT mi.id, mi.name, mi.description, mi.price,
              mi.photo_url AS photoUrl,
              r.id AS restaurantId, r.name AS restaurantName,
              r.slug AS restaurantSlug,
              f.created_at AS createdAt
         FROM favorites f
         JOIN menu_items mi ON mi.id = f.target_id
         JOIN restaurants r ON r.id = mi.restaurant_id
        WHERE f.user_id = ? AND f.target_type = 'menu_item'
        ORDER BY f.created_at DESC`,
    )
    .all(userId) as {
    id: number;
    name: string;
    description: string | null;
    price: number;
    photoUrl: string | null;
    restaurantId: number;
    restaurantName: string;
    restaurantSlug: string;
    createdAt: number;
  }[];

  const lunchRows = sqlite
    .prepare(
      `SELECT bl.id, bl.name, bl.price, bl.time_from AS timeFrom,
              bl.time_to AS timeTo,
              r.id AS restaurantId, r.name AS restaurantName,
              r.slug AS restaurantSlug, r.cover_url AS restaurantCoverUrl,
              f.created_at AS createdAt
         FROM favorites f
         JOIN business_lunches bl ON bl.id = f.target_id
         JOIN restaurants r ON r.id = bl.restaurant_id
        WHERE f.user_id = ? AND f.target_type = 'lunch'
        ORDER BY f.created_at DESC`,
    )
    .all(userId) as {
    id: number;
    name: string;
    price: number;
    timeFrom: string;
    timeTo: string;
    restaurantId: number;
    restaurantName: string;
    restaurantSlug: string;
    restaurantCoverUrl: string | null;
    createdAt: number;
  }[];

  return {
    restaurants: restaurantRows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt * 1000),
    })),
    menuItems: menuItemRows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt * 1000),
    })),
    lunches: lunchRows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt * 1000),
    })),
  };
}
