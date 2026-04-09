// Idempotent admin upsert скрипт для docker-entrypoint.sh.
//
// Читает DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD из env (приходят из
// docker-compose env_file: .env). Хэширует пароль через @node-rs/argon2
// с теми же OWASP-параметрами, что и src/lib/auth/password.ts.
// Если admin с таким email уже существует — обновляет password_hash
// и role=admin; иначе создаёт нового.
//
// Выполняется при каждом старте контейнера, чтобы после смены пароля
// в .env пересборка контейнера подхватила новый пароль без ручных
// SQL-запросов. Операция быстрая (<200мс) и полностью идемпотентная.

import Database from "better-sqlite3";
import { hash } from "@node-rs/argon2";
import { randomUUID } from "node:crypto";

const OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
};

function resolveDbPath() {
  const raw = process.env.DATABASE_URL ?? "file:./data/lunchhunter.db";
  return raw.startsWith("file:") ? raw.slice("file:".length) : raw;
}

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@lunchhunter.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin12345";

  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("foreign_keys = ON");

  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(email);

  const passwordHash = await hash(password, OPTIONS);

  if (existing) {
    db.prepare(
      "UPDATE users SET password_hash = ?, role = 'admin' WHERE id = ?",
    ).run(passwordHash, existing.id);
    console.log(`[admin-upsert] updated: ${email}`);
  } else {
    const id = randomUUID();
    db.prepare(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, 'admin')",
    ).run(id, email, passwordHash, "Administrator");
    console.log(`[admin-upsert] created: ${email}`);
  }

  db.close();
}

main().catch((err) => {
  console.error("[admin-upsert] FAILED:", err);
  process.exit(1);
});
