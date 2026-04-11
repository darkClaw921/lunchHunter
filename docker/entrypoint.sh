#!/bin/sh
# Entrypoint для prod-контейнера lunchHunter.
#
# Двухфазный скрипт с re-exec через setpriv:
#   Фаза 1 (root): чинит права на bind-mount volumes (host UID на Linux
#          не совпадает с nextjs uid=1001) и re-exec'ится через setpriv.
#   Фаза 2 (nextjs): копирует template-базу в volume при первом запуске,
#          обновляет admin-пользователя из ADMIN_EMAIL/ADMIN_PASSWORD,
#          и exec'ит node server.js.
#
# setpriv (util-linux, есть в node:20-slim) делает чистый exec без fork:
# PID 1 в итоге становится node server.js под nextjs, что даёт правильную
# семантику signal handling для docker compose stop / SIGTERM.

set -eu

DB_PATH="/app/data/lunchhunter.db"
TEMPLATE_PATH="/app/db-template/lunchhunter.db"
ADMIN_SCRIPT="/app/docker/admin-upsert.mjs"
MIGRATE_SCRIPT="/app/docker/migrate.mjs"

# ---------- Фаза 1: запуск под root ----------
if [ "$(id -u)" = "0" ]; then
  # chown volumes — idempotent при каждом старте. Bind mount на Linux
  # сохраняет host UID директорий; без этого nextjs (1001) не может
  # писать в /app/data и /app/public/uploads.
  chown -R nextjs:nodejs /app/data /app/public/uploads 2>/dev/null || true
  # Template-база и её директория тоже должны быть доступны на чтение
  # со стороны nextjs (они уже chown'ены в Dockerfile, но перестраховка).
  chown -R nextjs:nodejs /app/db-template 2>/dev/null || true
  # Re-exec этого же скрипта под nextjs:nodejs через setpriv. --init-groups
  # устанавливает supplementary groups согласно /etc/group. exec заменяет
  # процесс → PID 1 остаётся тем же, signals корректно доставляются.
  exec setpriv --reuid=nextjs --regid=nodejs --init-groups -- "$0" "$@"
fi

# ---------- Фаза 2: запуск под nextjs ----------
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

if [ -f "$MIGRATE_SCRIPT" ]; then
  echo "[entrypoint] Applying pending migrations..."
  node "$MIGRATE_SCRIPT"
else
  echo "[entrypoint] WARN: migrate script not found at $MIGRATE_SCRIPT" >&2
fi

if [ -f "$ADMIN_SCRIPT" ]; then
  echo "[entrypoint] Ensuring admin user is up to date..."
  node "$ADMIN_SCRIPT"
else
  echo "[entrypoint] WARN: admin upsert script not found at $ADMIN_SCRIPT" >&2
fi

echo "[entrypoint] Starting Next.js standalone server on port ${PORT:-3000}..."
exec node server.js
