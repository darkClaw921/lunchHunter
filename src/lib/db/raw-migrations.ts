import type Database from "better-sqlite3";

/**
 * Raw SQL migrations for features not expressible via Drizzle schema:
 * - FTS5 virtual table for full-text search over menu items
 * - R*Tree virtual table for spatial/radius search over restaurants
 * - Sync triggers to keep both tables in sync with base tables
 *
 * This file is idempotent — safe to run on every boot / migration.
 */
export function applyRawMigrations(db: Database.Database): void {
  /* ==========================================================
     Polymorphic favorites (restaurant | menu_item | lunch)
     ==========================================================
     Старая таблица имела колонку `restaurant_id`. Если обнаружено,
     пересоздаём таблицу с (target_type, target_id), мигрируя данные. */
  const favColumns = db
    .prepare("PRAGMA table_info(favorites)")
    .all() as { name: string }[];
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
    // Fresh DB — создаём сразу новую структуру (если drizzle ещё не создал).
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

  /* Триггеры чистки избранного при удалении целевой сущности */
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
    /* ==========================================================
       FTS5: menu_items_fts
       ========================================================== */
    CREATE VIRTUAL TABLE IF NOT EXISTS menu_items_fts USING fts5(
      name,
      description,
      content='menu_items',
      content_rowid='id',
      tokenize='unicode61 remove_diacritics 2'
    );

    /* Sync triggers — keep FTS5 in sync with menu_items */
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

    /* ==========================================================
       R*Tree: restaurants_rtree
       ========================================================== */
    CREATE VIRTUAL TABLE IF NOT EXISTS restaurants_rtree USING rtree(
      id,
      min_lat, max_lat,
      min_lng, max_lng
    );

    /* Sync triggers — keep R*Tree in sync with restaurants */
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
