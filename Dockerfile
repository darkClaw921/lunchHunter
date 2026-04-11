# syntax=docker/dockerfile:1.7

# ---- Base image ----------------------------------------------------------
# node:20-slim (debian) вместо alpine: нативные модули (better-sqlite3,
# sharp, @node-rs/argon2) собираются/загружают prebuilt бинари надёжнее
# под glibc, чем под musl.
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app


# ---- Dependencies --------------------------------------------------------
# Отдельный stage для установки зависимостей — кэш переиспользуется пока
# не меняются package.json / pnpm-lock.yaml. build-essential + python3
# нужны для компиляции better-sqlite3 и @node-rs/argon2 если prebuilt
# бинарь не найден.
FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# .npmrc нужен до install: он содержит public-hoist-pattern для bindings
# и file-uri-to-path — без этого better-sqlite3 не находит нативный binding
# в standalone output Next.js.
COPY package.json pnpm-lock.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ---- Builder -------------------------------------------------------------
# Выполняет next build с output: "standalone". BUILD_REVISION пробрасывается
# из docker-compose build args, чтобы precache revision в SW совпадал с
# конкретной версией образа.
#
# Также создаёт template-базу ./data/lunchhunter.db: применяет drizzle
# миграции + raw FTS5/R*Tree + seed (6 ресторанов, меню, бизнес-ланчи,
# admin). Entrypoint runner-стадии скопирует её в volume при первом
# запуске контейнера — на prod-хосте не нужны ни node, ни pnpm, ни tsx.
FROM base AS builder
ARG BUILD_REVISION
ENV BUILD_REVISION=${BUILD_REVISION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# DATABASE_URL явно фиксируем на время билда — иначе фоллбэк в client.ts
# создаёт относительный путь, который может конфликтовать с WORKDIR при
# параллельных воркерах Collecting page data.
ENV DATABASE_URL=file:./data/lunchhunter.db
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 1) Template-база: drizzle migrate + raw (FTS5/R*Tree/triggers) + seed.
#    tsx и drizzle-kit доступны из devDependencies deps-стадии.
RUN pnpm db:migrate \
 && pnpm db:seed
# 2) Сборка Next.js. Collecting page data теперь открывает валидную
#    template-базу (таблицы есть). busy_timeout=5000 в client.ts спасает
#    от SQLITE_BUSY при параллельных воркерах.
RUN pnpm build
# 3) Чистим WAL-артефакты, чтобы template был self-contained single-file.
RUN rm -f data/lunchhunter.db-wal data/lunchhunter.db-shm


# ---- Runner --------------------------------------------------------------
# Минимальный runtime image: только standalone server + статика + public.
# Пользователь nextjs (uid 1001) для безопасности — не root.
#
# На prod-хосте не требуется ничего, кроме docker engine. Все зависимости,
# бинари нативных модулей, template-база и entrypoint-скрипт уже внутри.
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# HOSTNAME=0.0.0.0 — иначе standalone server слушает только 127.0.0.1 и
# снаружи контейнера будет недоступен. PORT переопределяется из .env
# через docker compose.
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone output не копирует public/ и .next/static — копируем вручную
# согласно официальному гайду Next.js.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Template-база из builder-стадии — копируется в volume при первом запуске
# через docker/entrypoint.sh. Single-file (WAL-артефакты удалены в builder).
COPY --from=builder --chown=nextjs:nodejs /app/data/lunchhunter.db /app/db-template/lunchhunter.db

# Entrypoint + admin upsert + runtime migrations. Все .mjs используют
# better-sqlite3 и @node-rs/argon2 из standalone node_modules.
# migrate.mjs читает SQL из /app/docker/migrations — папка копируется
# отдельно, чтобы runtime-миграции работали на старых volume-БД.
COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/docker/entrypoint.sh
COPY --chown=nextjs:nodejs docker/admin-upsert.mjs /app/docker/admin-upsert.mjs
COPY --chown=nextjs:nodejs docker/migrate.mjs /app/docker/migrate.mjs
COPY --chown=nextjs:nodejs src/lib/db/migrations /app/docker/migrations
RUN chmod +x /app/docker/entrypoint.sh

# Директории для persistent данных (volumes из docker-compose).
RUN mkdir -p /app/data /app/public/uploads \
  && chown -R nextjs:nodejs /app/data /app/public/uploads /app/db-template /app/docker

# Контейнер стартует под root — это намеренно. entrypoint.sh в фазе 1
# chown'ит bind mount volumes (host UID может не совпадать с nextjs) и
# через runuser переключается на nextjs для фазы 2 (init DB + node).
# Финальный `node server.js` работает уже от имени nextjs uid=1001.

EXPOSE ${PORT}

ENTRYPOINT ["/app/docker/entrypoint.sh"]
