/**
 * Server-side helpers для работы с отзывами ресторанов.
 *
 * Паттерн аналогичен favorites.ts: используем drizzle ORM для простых
 * запросов и raw SQL (через sqlite) для JOIN-запросов.
 */
import { sql } from "drizzle-orm";
import { db } from "./client";
import { reviews } from "./schema";

/* ============================================================
   Types
   ============================================================ */

export interface CreateReviewData {
  userId: string;
  restaurantId: number;
  text: string;
  rating: number;
  receiptImageUrl: string;
  receiptTotal?: number | null;
  receiptDate?: string | null;
  receiptItemsJson?: string | null;
  receiptEstablishmentName?: string | null;
  matchConfidence?: number | null;
}

export interface ReviewRow {
  id: number;
  userId: string;
  restaurantId: number;
  text: string;
  rating: number;
  receiptImageUrl: string;
  receiptTotal: number | null;
  receiptDate: string | null;
  receiptItemsJson: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  /** Joined from users */
  authorName: string | null;
  /** Joined from users */
  authorAvatarUrl: string | null;
}

export interface ReviewStats {
  count: number;
  avgRating: number;
}

/* ============================================================
   createReview
   ============================================================ */

/**
 * Создаёт новый отзыв. Возвращает вставленную запись.
 */
export async function createReview(data: CreateReviewData) {
  const inserted = await db
    .insert(reviews)
    .values({
      userId: data.userId,
      restaurantId: data.restaurantId,
      text: data.text,
      rating: data.rating,
      receiptImageUrl: data.receiptImageUrl,
      receiptTotal: data.receiptTotal ?? null,
      receiptDate: data.receiptDate ?? null,
      receiptItemsJson: data.receiptItemsJson ?? null,
      receiptEstablishmentName: data.receiptEstablishmentName ?? null,
      matchConfidence: data.matchConfidence ?? null,
    })
    .returning()
    .get();

  return inserted;
}

/* ============================================================
   getReviewsByRestaurant
   ============================================================ */

/**
 * Возвращает одобренные отзывы для ресторана с данными автора.
 * Сортировка: новые сверху.
 */
export async function getReviewsByRestaurant(
  restaurantId: number,
  limit = 50,
): Promise<ReviewRow[]> {
  const { sqlite } = await import("./client");

  const rows = sqlite
    .prepare(
      `SELECT r.id, r.user_id AS userId, r.restaurant_id AS restaurantId,
              r.text, r.rating, r.receipt_image_url AS receiptImageUrl,
              r.receipt_total AS receiptTotal, r.receipt_date AS receiptDate,
              r.receipt_items_json AS receiptItemsJson,
              r.status, r.created_at AS createdAt,
              u.name AS authorName, u.avatar_url AS authorAvatarUrl
         FROM reviews r
         JOIN users u ON u.id = r.user_id
        WHERE r.restaurant_id = ? AND r.status = 'approved'
        ORDER BY r.created_at DESC
        LIMIT ?`,
    )
    .all(restaurantId, limit) as {
    id: number;
    userId: string;
    restaurantId: number;
    text: string;
    rating: number;
    receiptImageUrl: string;
    receiptTotal: number | null;
    receiptDate: string | null;
    receiptItemsJson: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
    authorName: string | null;
    authorAvatarUrl: string | null;
  }[];

  return rows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt * 1000),
  }));
}

/* ============================================================
   getRestaurantReviewStats
   ============================================================ */

/**
 * Возвращает количество и средний рейтинг одобренных отзывов ресторана.
 * Для пустой выборки возвращает { count: 0, avgRating: 0 }.
 */
export async function getRestaurantReviewStats(
  restaurantId: number,
): Promise<ReviewStats> {
  const row = await db
    .select({
      count: sql<number>`COUNT(*)`,
      avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
    })
    .from(reviews)
    .where(
      sql`${reviews.restaurantId} = ${restaurantId} AND ${reviews.status} = 'approved'`,
    )
    .get();

  return {
    count: row?.count ?? 0,
    avgRating: row?.avgRating ? Math.round(row.avgRating * 10) / 10 : 0,
  };
}
