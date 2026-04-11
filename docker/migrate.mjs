// Runtime migration runner for docker-entrypoint.sh.
//
// Применяется к существующей БД в volume при каждом старте контейнера.
// Drizzle migrate() требует drizzle-kit/tsx, которых нет в standalone
// runner-образе, поэтому используется собственный минимальный трекер
// через таблицу __applied_migrations (name PK).
//
// Bootstrap-логика: если таблица-трекер пустая, но в БД уже есть
// сущностные таблицы (users / push_subscriptions / reviews), значит
// соответствующие миграции были применены во время сборки template-базы
// — их нужно записать как applied, чтобы не пытаться накатывать повторно
// (CREATE TABLE на существующей таблице упадёт).
//
// После drizzle-миграций выполняется applyRawMigrations — порт
// src/lib/db/raw-migrations.ts в чистый JS, идемпотентный через
// CREATE IF NOT EXISTS и PRAGMA-проверки.

import Database from "better-sqlite3";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

function resolveDbPath() {
  const raw = process.env.DATABASE_URL ?? "file:./data/lunchhunter.db";
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

function tableExists(db, name) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
    .get(name);
  return Boolean(row);
}

function splitStatements(sql) {
  return sql
    .split(/-->\s*statement-breakpoint/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function ensureTracker(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS __applied_migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
}

function getApplied(db) {
  const rows = db
    .prepare("SELECT name FROM __applied_migrations")
    .all();
  return new Set(rows.map((r) => r.name));
}

function markApplied(db, name) {
  db.prepare(
    "INSERT OR IGNORE INTO __applied_migrations (name) VALUES (?)",
  ).run(name);
}

// Bootstrap: определить какие миграции уже отражены в текущей схеме,
// чтобы не пытаться их накатить повторно на старую БД.
function bootstrapFromSchema(db) {
  const applied = getApplied(db);
  if (applied.size > 0) return;

  // Маркеры существования: имя миграции → таблица, которую она создаёт.
  const markers = [
    { migration: "0000_nervous_mad_thinker.sql", table: "users" },
    { migration: "0001_push_subscriptions.sql", table: "push_subscriptions" },
    { migration: "0002_reviews_receipts.sql", table: "reviews" },
  ];
  for (const { migration, table } of markers) {
    if (tableExists(db, table)) {
      markApplied(db, migration);
      console.log(`[migrate] bootstrap: ${migration} already in schema`);
    }
  }
}

function applyMigration(db, name, sql) {
  const statements = splitStatements(sql);
  const tx = db.transaction(() => {
    for (const stmt of statements) {
      db.exec(stmt);
    }
    markApplied(db, name);
  });
  tx();
  console.log(`[migrate] applied: ${name}`);
}

function runDrizzleMigrations(db) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  ensureTracker(db);
  bootstrapFromSchema(db);

  const applied = getApplied(db);
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    applyMigration(db, file, sql);
  }
}

// Порт src/lib/db/raw-migrations.ts в чистый JS. Идемпотентный.
function applyRawMigrations(db) {
  // Polymorphic favorites (legacy → new schema)
  const favColumns = db.prepare("PRAGMA table_info(favorites)").all();
  const hasLegacyRestaurantId = favColumns.some(
    (c) => c.name === "restaurant_id",
  );
  const hasTargetType = favColumns.some((c) => c.name === "target_type");

  if (favColumns.length > 0 && hasLegacyRestaurantId && !hasTargetType) {
    db.exec(`
      BEGIN;
      CREATE TABLE favorites_new (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id text NOT NULL,
        target_type text NOT NULL,
        target_id integer NOT NULL,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
      );
      INSERT INTO favorites_new (id, user_id, target_type, target_id, created_at)
        SELECT id, user_id, 'restaurant', restaurant_id, created_at FROM favorites;
      DROP TABLE favorites;
      ALTER TABLE favorites_new RENAME TO favorites;
      CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_target_uq
        ON favorites (user_id, target_type, target_id);
      CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites (user_id);
      CREATE INDEX IF NOT EXISTS favorites_target_idx
        ON favorites (target_type, target_id);
      COMMIT;
    `);
  } else if (favColumns.length === 0) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        user_id text NOT NULL,
        target_type text NOT NULL,
        target_id integer NOT NULL,
        created_at integer DEFAULT (unixepoch()) NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
      );
      CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_target_uq
        ON favorites (user_id, target_type, target_id);
      CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites (user_id);
      CREATE INDEX IF NOT EXISTS favorites_target_idx
        ON favorites (target_type, target_id);
    `);
  }

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS favorites_restaurant_ad
      AFTER DELETE ON restaurants BEGIN
      DELETE FROM favorites
       WHERE target_type = 'restaurant' AND target_id = old.id;
    END;
    CREATE TRIGGER IF NOT EXISTS favorites_menu_item_ad
      AFTER DELETE ON menu_items BEGIN
      DELETE FROM favorites
       WHERE target_type = 'menu_item' AND target_id = old.id;
    END;
    CREATE TRIGGER IF NOT EXISTS favorites_lunch_ad
      AFTER DELETE ON business_lunches BEGIN
      DELETE FROM favorites
       WHERE target_type = 'lunch' AND target_id = old.id;
    END;
  `);

  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS menu_items_fts USING fts5(
      name,
      description,
      content='menu_items',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 2'
    );

    CREATE TRIGGER IF NOT EXISTS menu_items_ai AFTER INSERT ON menu_items BEGIN
      INSERT INTO menu_items_fts(rowid, name, description)
      VALUES (new.id, new.name, new.description);
    END;

    CREATE TRIGGER IF NOT EXISTS menu_items_ad AFTER DELETE ON menu_items BEGIN
      INSERT INTO menu_items_fts(menu_items_fts, rowid, name, description)
      VALUES ('delete', old.id, old.name, old.description);
    END;

    CREATE TRIGGER IF NOT EXISTS menu_items_au AFTER UPDATE ON menu_items BEGIN
      INSERT INTO menu_items_fts(menu_items_fts, rowid, name, description)
      VALUES ('delete', old.id, old.name, old.description);
      INSERT INTO menu_items_fts(rowid, name, description)
      VALUES (new.id, new.name, new.description);
    END;

    CREATE VIRTUAL TABLE IF NOT EXISTS restaurants_rtree USING rtree(
      id,
      min_lat, max_lat,
      min_lng, max_lng
    );

    CREATE TRIGGER IF NOT EXISTS restaurants_rtree_ai AFTER INSERT ON restaurants BEGIN
      INSERT INTO restaurants_rtree(id, min_lat, max_lat, min_lng, max_lng)
      VALUES (new.id, new.lat, new.lat, new.lng, new.lng);
    END;

    CREATE TRIGGER IF NOT EXISTS restaurants_rtree_ad AFTER DELETE ON restaurants BEGIN
      DELETE FROM restaurants_rtree WHERE id = old.id;
    END;

    CREATE TRIGGER IF NOT EXISTS restaurants_rtree_au AFTER UPDATE OF lat, lng ON restaurants BEGIN
      UPDATE restaurants_rtree
      SET min_lat = new.lat, max_lat = new.lat,
          min_lng = new.lng, max_lng = new.lng
      WHERE id = old.id;
    END;
  `);
}

function main() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  runDrizzleMigrations(db);
  applyRawMigrations(db);

  db.close();
  console.log("[migrate] done");
}

try {
  main();
} catch (err) {
  console.error("[migrate] FAILED:", err);
  process.exit(1);
}
