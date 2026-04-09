#!/bin/sh
# Entrypoint для prod-контейнера lunchHunter.
#
# При первом запуске (пустой volume /app/data) копирует template-базу,
# сгенерированную во время docker build через pnpm db:migrate+seed.
# Template лежит в /app/db-template/lunchhunter.db.
#
# Затем всегда пересоздаёт admin-пользователя с актуальными
# ADMIN_EMAIL / ADMIN_PASSWORD из env (idempotent upsert).
#
# Финальный шаг — exec node server.js (standalone Next.js).

set -eu

DB_PATH="/app/data/lunchhunter.db"
TEMPLATE_PATH="/app/db-template/lunchhunter.db"
ADMIN_SCRIPT="/app/docker/admin-upsert.mjs"

if [ ! -f "$TEMPLATE_PATH" ]; then
  echo "[entrypoint] FATAL: template database missing at $TEMPLATE_PATH" >&2
  exit 1
fi

if [ ! -f "$DB_PATH" ]; then
  echo "[entrypoint] First run — initializing database from template..."
  mkdir -p "$(dirname "$DB_PATH")"
  cp "$TEMPLATE_PATH" "$DB_PATH"
  echo "[entrypoint] Database initialized: $DB_PATH"
else
  echo "[entrypoint] Database already exists: $DB_PATH"
fi

if [ -f "$ADMIN_SCRIPT" ]; then
  echo "[entrypoint] Ensuring admin user is up to date..."
  node "$ADMIN_SCRIPT"
else
  echo "[entrypoint] WARN: admin upsert script not found at $ADMIN_SCRIPT" >&2
fi

echo "[entrypoint] Starting Next.js standalone server on port ${PORT:-3000}..."
exec node server.js
