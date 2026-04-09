# Docker Setup — Production Deployment

Продакшен-развёртывание lunchHunter через docker compose. Порт, креды и ключи берутся из .env.

## Файлы

### Dockerfile

Multi-stage build на базе node:20-slim (debian, не alpine — для надёжности glibc-линковки нативных модулей better-sqlite3, sharp, @node-rs/argon2).

**Стадии:**

1. **base** — установка pnpm через corepack enable, PNPM_HOME=/pnpm
2. **deps** — apt-get install build-essential + python3 + ca-certificates (нужны для компиляции native модулей если prebuilt недоступен), затем pnpm install --frozen-lockfile с BuildKit cache mount на /pnpm/store для ускорения повторных билдов
3. **builder** — копирует node_modules из deps, весь src, принимает ARG BUILD_REVISION и запускает pnpm build с NEXT_TELEMETRY_DISABLED=1, NODE_ENV=production
4. **runner** — минимальный runtime:
   - Создаёт системного пользователя nextjs:nodejs (uid/gid 1001) — запуск не от root
   - Копирует public/, .next/standalone/, .next/static/ из builder (chown nextjs:nodejs)
   - mkdir /app/data и /app/public/uploads как mount points для volumes
   - ENV HOSTNAME=0.0.0.0 — критично, иначе standalone server слушает только 127.0.0.1 и снаружи контейнера недоступен
   - ENV PORT=3000 — дефолт, переопределяется через docker compose
   - CMD ['node', 'server.js'] — standalone server Next.js

### docker-compose.yml

Один сервис app:

- **build.context: .** + **args.BUILD_REVISION: ${BUILD_REVISION:-}** — пробрасывает git HEAD или любой идентификатор для precache SW
- **image: lunchhunter:latest**, **container_name: lunchhunter**, **restart: unless-stopped**
- **env_file: .env** — ВСЕ runtime-переменные (DATABASE_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL, TELEGRAM_BOT_TOKEN, ADMIN_EMAIL, ADMIN_PASSWORD) читаются из .env, не дублируются
- **environment:**
  - NODE_ENV: production
  - PORT: ${PORT:-3000}
  - HOSTNAME: 0.0.0.0
- **ports: '${PORT:-3000}:${PORT:-3000}'** — host и container маппятся из .env, дефолт 3000
- **volumes:**
  - ./data:/app/data — persistent SQLite база, совпадает с DATABASE_URL=file:./data/lunchhunter.db
  - ./public/uploads:/app/public/uploads — пользовательские загрузки (фото ресторанов, меню)
- **healthcheck:** wget --spider http://localhost:${PORT}/ каждые 30с, timeout 5с, retries 3, start_period 20с

### .dockerignore

Исключения для docker build context:
- node_modules, .next, out, build — артефакты сборки (пересобираются в контейнере)
- data/, public/uploads/, *.db* — persistent данные подключаются volumes
- .env, .env.* (кроме .env.example) — секреты передаются через env_file, не копируются в image
- public/sw.js, public/swe-worker-* — генерируются при build внутри контейнера
- .git, .arhit, .beads, .claude, CLAUDE.md, TODO.md, README.md, architecture.md — не нужны в образе
- *.tsbuildinfo — TypeScript incremental кеш
- сам Dockerfile, docker-compose.yml, .dockerignore

### next.config.ts изменения

- output: 'standalone' — для минимального Docker image
- outputFileTracingIncludes — гарантированное включение .node бинарей native модулей
- revision fallback chain: BUILD_REVISION env → git HEAD → randomUUID

## Использование

### Запуск

```bash
# Копируем пример env-файла и заполняем секретами
cp .env.example .env
$EDITOR .env

# Билд и запуск в фоне
docker compose up -d --build

# Логи
docker compose logs -f app

# Остановка
docker compose down
```

### Смена порта

Достаточно изменить PORT в .env и пересоздать контейнер:

```bash
echo 'PORT=8080' >> .env
docker compose up -d --force-recreate
```

PORT используется:
1. docker-compose.yml для маппинга host:container
2. Standalone server Next.js (PORT env var внутри контейнера)
3. Локальным next start (pnpm start) — значение то же

### BUILD_REVISION для service worker

По умолчанию пустая строка — next.config.ts fallback на git HEAD или UUID. Чтобы явно зафиксировать версию (например, в CI):

```bash
BUILD_REVISION=$(git rev-parse HEAD) docker compose build --no-cache
```

## Почему node:20-slim, а не alpine

- better-sqlite3, @node-rs/argon2, sharp — нативные модули, собираются/загружают prebuilt бинари для glibc (debian). Под musl (alpine) prebuilt часто нет и сборка требует дополнительных зависимостей (apk add python3 make g++ gcc libc-dev)
- Slim-образ (~80 MB) не сильно больше alpine (~50 MB), но надёжнее

## Volumes и persistent state

Критично НЕ терять между пересозданиями контейнера:
- **./data** → /app/data — SQLite база со всеми записями (рестораны, меню, пользователи, сессии, favorites, история поиска)
- **./public/uploads** → /app/public/uploads — загруженные картинки (webp-resized через sharp в /api/admin/upload)

При docker compose down данные сохраняются. docker compose down -v удалит volumes — только для полного reset.