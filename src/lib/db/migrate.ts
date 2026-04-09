import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./client";
import { applyRawMigrations } from "./raw-migrations";

async function main(): Promise<void> {
  console.log("Running drizzle migrations...");
  migrate(db, { migrationsFolder: "./src/lib/db/migrations" });
  console.log("Drizzle migrations applied.");

  console.log("Applying raw SQL migrations (FTS5, R*Tree, triggers)...");
  applyRawMigrations(sqlite);
  console.log("Raw SQL migrations applied.");

  sqlite.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
