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
FROM base AS builder
ARG BUILD_REVISION
ENV BUILD_REVISION=${BUILD_REVISION}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build


# ---- Runner --------------------------------------------------------------
# Минимальный runtime image: только standalone server + статика + public.
# Пользователь nextjs (uid 1001) для безопасности — не root.
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

# Директории для persistent данных (volumes из docker-compose).
RUN mkdir -p /app/data /app/public/uploads \
  && chown -R nextjs:nodejs /app/data /app/public/uploads

USER nextjs

EXPOSE ${PORT}

CMD ["node", "server.js"]
