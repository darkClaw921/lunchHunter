/**
 * Server-side helpers для работы с историей поиска пользователя.
 *
 * Таблица `search_history` хранит сырые запросы (userId, query, createdAt).
 * История — персонализированная: показывается только в /profile/history
 * и накапливается при каждом поисковом запросе залогиненного пользователя.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { searchHistory } from "./schema";

export interface SearchHistoryEntry {
  id: number;
  query: string;
  createdAt: Date;
}

/** Максимум записей истории, которые храним на одного пользователя. */
const MAX_HISTORY_PER_USER = 50;

/**
 * Записывает поисковый запрос пользователя в историю.
 *
 * Если такой же query уже есть в последних 5 записях пользователя — пропускаем
 * (чтобы не дублировать ту же фразу при релоадах). После вставки подрезаем
 * историю до MAX_HISTORY_PER_USER последних записей.
 */
export async function recordSearchQuery(
  userId: string,
  query: string,
): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  const recent = await db
    .select({ query: searchHistory.query })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(5);
  if (recent.some((r) => r.query === trimmed)) return;

  await db.insert(searchHistory).values({ userId, query: trimmed });

  // Подрезаем старые записи за пределами лимита.
  const excess = await db
    .select({ id: searchHistory.id })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .offset(MAX_HISTORY_PER_USER)
    .limit(100);
  if (excess.length > 0) {
    const ids = excess.map((r) => r.id);
    await db
      .delete(searchHistory)
      .where(sql`${searchHistory.id} IN (${sql.join(ids, sql`, `)})`);
  }
}

/**
 * Возвращает историю поиска пользователя, новые сверху.
 */
export async function getUserSearchHistory(
  userId: string,
  limit = MAX_HISTORY_PER_USER,
): Promise<SearchHistoryEntry[]> {
  const rows = await db
    .select({
      id: searchHistory.id,
      query: searchHistory.query,
      createdAt: searchHistory.createdAt,
    })
    .from(searchHistory)
    .where(eq(searchHistory.userId, userId))
    .orderBy(desc(searchHistory.createdAt))
    .limit(limit);
  return rows;
}

/**
 * Удаляет одну запись истории, если она принадлежит пользователю.
 */
export async function deleteSearchHistoryEntry(
  userId: string,
  id: number,
): Promise<void> {
  await db
    .delete(searchHistory)
    .where(and(eq(searchHistory.userId, userId), eq(searchHistory.id, id)));
}

/**
 * Полностью очищает историю поиска пользователя.
 */
export async function clearUserSearchHistory(userId: string): Promise<void> {
  await db.delete(searchHistory).where(eq(searchHistory.userId, userId));
}
