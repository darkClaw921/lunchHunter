/**
 * Server-side helpers для работы с чеками пользователей.
 *
 * CRUD, статистика, лидерборд и процентили.
 * Паттерн аналогичен favorites.ts.
 */
import { db } from "./client";
import { receipts } from "./schema";
import { categorizeItem } from "./receipt-categories";

/* ============================================================
   Types
   ============================================================ */

export interface CreateReceiptData {
  userId: string;
  restaurantId?: number | null;
  imageUrl: string;
  total?: number | null;
  date?: string | null;
  itemsJson?: string | null;
  establishmentName?: string | null;
}

export interface ReceiptRow {
  id: number;
  userId: string;
  restaurantId: number | null;
  imageUrl: string;
  total: number | null;
  date: string | null;
  itemsJson: string | null;
  establishmentName: string | null;
  createdAt: Date;
}

export interface UserReceiptStats {
  totalSpent: number;
  visitCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  avatarUrl: string | null;
  totalAmount: number;
}

/* ============================================================
   createReceipt
   ============================================================ */

/**
 * Создаёт новый чек. Возвращает вставленную запись.
 */
export async function createReceipt(data: CreateReceiptData) {
  const inserted = await db
    .insert(receipts)
    .values({
      userId: data.userId,
      restaurantId: data.restaurantId ?? null,
      imageUrl: data.imageUrl,
      total: data.total ?? null,
      date: data.date ?? null,
      itemsJson: data.itemsJson ?? null,
      establishmentName: data.establishmentName ?? null,
    })
    .returning()
    .get();

  return inserted;
}

/* ============================================================
   getUserReceipts
   ============================================================ */

/**
 * Возвращает список чеков пользователя, сортировка по дате DESC.
 */
export async function getUserReceipts(userId: string): Promise<ReceiptRow[]> {
  const { sqlite } = await import("./client");

  const rows = sqlite
    .prepare(
      `SELECT id, user_id AS userId, restaurant_id AS restaurantId,
              image_url AS imageUrl, total, date,
              items_json AS itemsJson,
              establishment_name AS establishmentName,
              created_at AS createdAt
         FROM receipts
        WHERE user_id = ?
        ORDER BY created_at DESC`,
    )
    .all(userId) as {
    id: number;
    userId: string;
    restaurantId: number | null;
    imageUrl: string;
    total: number | null;
    date: string | null;
    itemsJson: string | null;
    establishmentName: string | null;
    createdAt: number;
  }[];

  return rows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt * 1000),
  }));
}

/* ============================================================
   getUserReceiptStats
   ============================================================ */

interface ReceiptItem {
  name: string;
  price?: number;
  quantity?: number;
}

/**
 * Парсит JSON-массив позиций чека.
 */
function parseItems(itemsJson: string | null): ReceiptItem[] {
  if (!itemsJson) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Агрегированная статистика чеков пользователя:
 * - totalSpent: общая сумма
 * - visitCount: количество чеков (визитов)
 * - categoryBreakdown: сумма по категориям из keyword-словаря
 */
export async function getUserReceiptStats(
  userId: string,
): Promise<UserReceiptStats> {
  const { sqlite } = await import("./client");

  // Получаем агрегат из БД
  const agg = sqlite
    .prepare(
      `SELECT COALESCE(SUM(total), 0) AS totalSpent,
              COUNT(*) AS visitCount
         FROM receipts
        WHERE user_id = ?`,
    )
    .get(userId) as { totalSpent: number; visitCount: number } | undefined;

  // Получаем все itemsJson для категоризации
  const itemRows = sqlite
    .prepare(
      `SELECT items_json AS itemsJson FROM receipts WHERE user_id = ?`,
    )
    .all(userId) as { itemsJson: string | null }[];

  // Категоризация
  const categoryBreakdown: Record<string, number> = {};
  for (const row of itemRows) {
    const items = parseItems(row.itemsJson);
    for (const item of items) {
      const category = categorizeItem(item.name);
      if (category) {
        const amount = (item.price ?? 0) * (item.quantity ?? 1);
        categoryBreakdown[category] = (categoryBreakdown[category] ?? 0) + amount;
      }
    }
  }

  return {
    totalSpent: agg?.totalSpent ?? 0,
    visitCount: agg?.visitCount ?? 0,
    categoryBreakdown,
  };
}

/* ============================================================
   getLeaderboard
   ============================================================ */

/**
 * Топ пользователей по сумме расходов в определённой категории.
 * Если category = "total" — суммируем по полю total всех чеков.
 * Иначе — суммируем позиции чеков, попадающие в указанную категорию.
 */
export async function getLeaderboard(
  category: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const { sqlite } = await import("./client");

  if (category === "total") {
    // Простая агрегация по total
    const rows = sqlite
      .prepare(
        `SELECT r.user_id AS userId, u.name AS userName,
                u.avatar_url AS avatarUrl,
                COALESCE(SUM(r.total), 0) AS totalAmount
           FROM receipts r
           JOIN users u ON u.id = r.user_id
          GROUP BY r.user_id
          ORDER BY totalAmount DESC
          LIMIT ?`,
      )
      .all(limit) as LeaderboardEntry[];

    return rows;
  }

  // Для конкретной категории — нужно парсить itemsJson
  // Получаем все чеки со всеми itemsJson
  const allReceipts = sqlite
    .prepare(
      `SELECT r.user_id AS userId, r.items_json AS itemsJson,
              u.name AS userName, u.avatar_url AS avatarUrl
         FROM receipts r
         JOIN users u ON u.id = r.user_id`,
    )
    .all() as {
    userId: string;
    itemsJson: string | null;
    userName: string | null;
    avatarUrl: string | null;
  }[];

  // Агрегируем по пользователям
  const userTotals = new Map<
    string,
    { userName: string | null; avatarUrl: string | null; totalAmount: number }
  >();

  for (const receipt of allReceipts) {
    const items = parseItems(receipt.itemsJson);
    let userAmount = 0;
    for (const item of items) {
      const itemCategory = categorizeItem(item.name);
      if (itemCategory === category) {
        userAmount += (item.price ?? 0) * (item.quantity ?? 1);
      }
    }
    if (userAmount > 0) {
      const existing = userTotals.get(receipt.userId);
      if (existing) {
        existing.totalAmount += userAmount;
      } else {
        userTotals.set(receipt.userId, {
          userName: receipt.userName,
          avatarUrl: receipt.avatarUrl,
          totalAmount: userAmount,
        });
      }
    }
  }

  // Сортируем и ограничиваем
  return Array.from(userTotals.entries())
    .map(([userId, data]) => ({ userId, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
}

/* ============================================================
   getUserPercentile
   ============================================================ */

/**
 * Процентиль пользователя среди всех пользователей по категории.
 * Возвращает число 0–100 (100 = топ, 0 = самый низ).
 * Если category = "total" — по общей сумме чеков.
 */
export async function getUserPercentile(
  userId: string,
  category: string,
): Promise<number> {
  const { sqlite } = await import("./client");

  if (category === "total") {
    // По общей сумме
    const rows = sqlite
      .prepare(
        `SELECT user_id AS userId, COALESCE(SUM(total), 0) AS totalAmount
           FROM receipts
          GROUP BY user_id
          ORDER BY totalAmount ASC`,
      )
      .all() as { userId: string; totalAmount: number }[];

    if (rows.length === 0) return 0;

    const userIdx = rows.findIndex((r) => r.userId === userId);
    if (userIdx === -1) return 0;

    // percentile = (number of people below) / (total - 1) * 100
    if (rows.length === 1) return 100;
    return Math.round((userIdx / (rows.length - 1)) * 100);
  }

  // По конкретной категории — парсим itemsJson
  const allReceipts = sqlite
    .prepare(
      `SELECT user_id AS userId, items_json AS itemsJson FROM receipts`,
    )
    .all() as { userId: string; itemsJson: string | null }[];

  const userTotals = new Map<string, number>();
  for (const receipt of allReceipts) {
    const items = parseItems(receipt.itemsJson);
    let amount = 0;
    for (const item of items) {
      if (categorizeItem(item.name) === category) {
        amount += (item.price ?? 0) * (item.quantity ?? 1);
      }
    }
    if (amount > 0) {
      userTotals.set(
        receipt.userId,
        (userTotals.get(receipt.userId) ?? 0) + amount,
      );
    }
  }

  const sorted = Array.from(userTotals.entries())
    .sort((a, b) => a[1] - b[1]);

  if (sorted.length === 0) return 0;

  const userIdx = sorted.findIndex(([uid]) => uid === userId);
  if (userIdx === -1) return 0;

  if (sorted.length === 1) return 100;
  return Math.round((userIdx / (sorted.length - 1)) * 100);
}
