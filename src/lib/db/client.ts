import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import * as schema from "./schema";

/**
 * Resolve the SQLite file path from the DATABASE_URL env var.
 * Accepts both `file:./data/lunchhunter.db` and plain paths.
 */
function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? "file:./data/lunchhunter.db";
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

const dbPath = resolveDbPath();
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
// busy_timeout: при конкурентных соединениях (например, параллельные
// воркеры Next.js Collecting page data во время docker build, или
// несколько серверных запросов в WAL-режиме) SQLite ждёт освобождения
// блокировки до N мс вместо мгновенного SQLITE_BUSY. 5с — безопасный
// дефолт для всех сценариев (build + runtime), стандартная рекомендация
// для WAL.
sqlite.pragma("busy_timeout = 5000");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };
export type Db = typeof db;
