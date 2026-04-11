# LunchHunter — Архитектура проекта

Web-приложение для поиска бизнес-ланчей и ресторанов рядом. Next.js 15 App Router + TypeScript strict + Tailwind v4 + Drizzle ORM + SQLite (better-sqlite3).

## Структура проекта

```
lunchHunter/
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (site)/           # Публичный сайт (mobile-shell) — route group
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # Home/Search
│   │   │   ├── _components/                # Общие client-компоненты сайта
│   │   │   ├── search/page.tsx             # Search Results List
│   │   │   ├── map/page.tsx                # Search Map (MapLibre GL)
│   │   │   ├── map/_components/            # MobileMapView client wrapper
│   │   │   ├── restaurant/page.tsx         # Restaurant Index (все опубликованные)
│   │   │   ├── restaurant/[id]/            # Restaurant Detail (+ RestaurantMenu)
│   │   │   ├── business-lunch/page.tsx     # Business Lunch List
│   │   │   ├── business-lunch/[id]/        # Business Lunch Detail
│   │   │   ├── favorites/page.tsx          # Избранное (server, validateSession)
│   │   │   ├── leaderboard/                 # Лидерборд (page + LeaderboardTable)
│   │   │   └── profile/                    # Профиль (root) + history/city/about/receipts
│   │   ├── (admin)/admin/                   # Protected admin route group
│   │   │   ├── layout.tsx                   # Session guard + AdminShell
│   │   │   ├── _components/AdminShell.tsx
│   │   │   ├── page.tsx                     # Dashboard
│   │   │   ├── restaurants/                 # List + Add + Edit [id]
│   │   │   ├── menu/                        # Menu management
│   │   │   ├── business-lunch/              # List + 3-step wizard
│   │   │   └── settings/                    # Admin settings (static UI)
│   │   ├── (admin-auth)/admin/login/        # Unprotected login page
│   │   └── api/
│   │       ├── search/route.ts              # FTS5 + R*Tree + haversine
│   │       ├── restaurants/[id]/route.ts    # Ресторан + фото + меню
│   │       ├── business-lunch/route.ts      # Список ланчей + фильтры
│   │       ├── favorites/route.ts           # Toggle/Get избранного (polymorphic)
│   │       ├── profile/city/route.ts        # POST — сохранить users.city
│   │       ├── profile/search-history/route.ts            # DELETE — очистить всю историю
│   │       ├── profile/search-history/[id]/route.ts       # DELETE — удалить одну запись
│   │       └── admin/                       # Admin API (auth, CRUD, upload)
│   │           ├── auth/login/route.ts
│   │           ├── auth/logout/route.ts
│   │           ├── restaurants/route.ts
│   │           ├── restaurants/[id]/route.ts # PATCH/DELETE ресторана
│   │           ├── menu/route.ts
│   │           ├── menu/ocr/route.ts        # LLM OCR меню (Phase 7)
│   │           ├── business-lunch/route.ts
│   │           ├── business-lunch/ocr/route.ts # Weekly lunch OCR (Phase 7)
│   │           └── upload/route.ts          # Sharp webp resize
│   │       ├── dev-sw/route.ts              # Stub /dev-sw.js (rewrite в next.config)
│   │       ├── auth/telegram/route.ts       # Telegram WebApp initData login
│   ├── components/
│   │   ├── ui/               # UI-примитивы (Button, Input, Chip, Card, Tabs, Badge, Skeleton, RouteProgress)
│   │   ├── mobile/           # Mobile-specific компоненты (BottomTabBar)
│   │   ├── desktop/          # Desktop-specific компоненты (TopNav, FeatureCard)
│   │   ├── map/              # MapLibre GL обёртки (MapView, RadiusSelector)
│   │   └── admin/            # Admin-specific компоненты (Sidebar)
│   └── lib/
│       ├── auth/             # Session/password helpers (argon2 + httpOnly cookie)
│       ├── db/               # База данных (Drizzle + SQLite) + queries.ts
│       ├── geo/              # Геопространственные утилиты
│       ├── hooks/            # Client React hooks (useHaptics, useMounted, usePrefersReducedMotion, useViewTransition, useFlipMorph, usePrefetchImage, useActiveVT)
│       ├── llm/              # OpenRouter + Vercel AI SDK — OCR меню (vision)
│       ├── utils/            # Общие утилиты (cn, format)
│       ├── morph.ts          # Manual shared-element FLIP morph через Web Animations API (Telegram Mini App fallback)
│       └── transitions.ts    # Навигация: navigate, navigateBack, prefersReducedMotion, supportsViewTransitions
├── data/                     # SQLite database file (gitignored)
├── public/                   # Статические ассеты
├── e2e/                      # Playwright e2e-спеки
├── tests/unit/               # Vitest unit-тесты
├── drizzle.config.ts         # Конфигурация drizzle-kit
├── next.config.ts            # Конфигурация Next.js
├── postcss.config.mjs        # PostCSS + Tailwind v4 plugin
├── tsconfig.json             # TypeScript strict config
├── vitest.config.ts          # Конфигурация Vitest
├── playwright.config.ts      # Конфигурация Playwright
├── Dockerfile                # Multi-stage build для production-образа
├── docker-compose.yml        # Prod-compose (порт из .env, volumes: data/uploads)
├── .dockerignore             # Исключения для docker build context
├── .npmrc                    # pnpm public-hoist-pattern для native subpackages
├── docker/
│   ├── entrypoint.sh         # Runner entrypoint: init DB + admin upsert + node server.js
│   └── admin-upsert.mjs      # Idempotent upsert admin из ADMIN_EMAIL/ADMIN_PASSWORD
├── README.md                 # Инструкции установки/запуска/тестов
└── package.json              # pnpm + скрипты
```

## Конфигурационные файлы

### [package.json](./package.json)
Манифест проекта с зависимостями и npm-скриптами:
- `pnpm dev` — запуск dev-сервера Next.js
- `pnpm build` / `pnpm start` — production-сборка
- `pnpm typecheck` — `tsc --noEmit`, strict-проверка
- `pnpm lint` — ESLint (next/core-web-vitals + next/typescript)
- `pnpm db:generate` — генерация Drizzle SQL-миграций
- `pnpm db:migrate` — применение миграций + raw FTS5/R*Tree
- `pnpm db:seed` — наполнение БД тестовыми данными
- `pnpm db:studio` — drizzle-kit studio UI
- `pnpm test` — Vitest (unit-тесты из `tests/unit/`)
- `pnpm test:watch` — Vitest в watch-режиме
- `pnpm test:e2e` — Playwright e2e (из `e2e/`), webServer поднимает `pnpm dev`

Ключевые зависимости: next 15.1, react 19, drizzle-orm, better-sqlite3, tailwindcss 4, lucide-react, @radix-ui/react-tabs, class-variance-authority, clsx, tailwind-merge, maplibre-gl.

### [tsconfig.json](./tsconfig.json)
TypeScript strict-конфиг:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- Пути: `@/*` → `./src/*`
- Module: `esnext` / Resolution: `bundler`

### [next.config.ts](./next.config.ts)
Конфиг Next.js: `reactStrictMode`, typed routes, `output: "standalone"` (минимальный self-contained артефакт в `.next/standalone` для Docker), `serverExternalPackages: ["better-sqlite3"]` (нативный binding — нельзя бандлить), `outputFileTracingIncludes` для гарантированного включения `.node`-бинарей `better-sqlite3`, `sharp`, `@node-rs/argon2` во все роуты standalone-сборки. Обёрнут в `withSerwistInit` из `@serwist/next` — генерирует `public/sw.js` из `src/app/sw.ts`, включены опции `cacheOnNavigation: true`, `reloadOnOnline: false`, `disable` в dev-режиме, а также `additionalPrecacheEntries: [{ url: "/offline", revision }]` для precache fallback-страницы. `revision` берётся по приоритету: `process.env.BUILD_REVISION` (передаётся через Docker build arg) → `git rev-parse HEAD` → `randomUUID()`. Так precache инвалидируется при каждом коммите/билде и не ссылается на старые чанки после rebuild'а.

### [next-env.d.ts](./next-env.d.ts)
Автогенерируемые TypeScript-декларации Next.js.

### [drizzle.config.ts](./drizzle.config.ts)
Конфиг drizzle-kit: schema → `src/lib/db/schema.ts`, миграции → `src/lib/db/migrations`, dialect SQLite, `DATABASE_URL` из env (fallback `file:./data/lunchhunter.db`).

### [postcss.config.mjs](./postcss.config.mjs)
PostCSS pipeline с `@tailwindcss/postcss` (Tailwind v4).

### [.eslintrc.json](./.eslintrc.json)
ESLint: `next/core-web-vitals` + `next/typescript`.

### [.env.example](./.env.example)
Пример переменных окружения: `PORT=3000` (порт standalone-сервера и docker-compose port mapping), `DATABASE_URL=file:./data/lunchhunter.db`, admin seed credentials, `OPENROUTER_API_KEY`/`OPENROUTER_MODEL`, `TELEGRAM_BOT_TOKEN`.

### [.gitignore](./.gitignore)
Игнорирует `node_modules`, `.next`, `data/`, `*.db`, `public/uploads`, env-файлы.

### [Dockerfile](./Dockerfile)
Multi-stage production-образ на базе `node:20-slim` (debian, не alpine — для надёжности glibc-линковки нативных модулей). Полностью автономен: на prod-хосте не требуется ничего, кроме docker engine. Стадии:
- `base` — установка `pnpm` через `corepack enable`, `PNPM_HOME=/pnpm`.
- `deps` — установка `build-essential` + `python3` + `ca-certificates`, копирование `package.json`/`pnpm-lock.yaml`/`.npmrc`, затем `pnpm install --frozen-lockfile` с BuildKit cache mount на `/pnpm/store` (ускоряет повторные билды).
- `builder` — копирует `node_modules` из `deps`, весь исходный код, принимает `ARG BUILD_REVISION`. Последовательно: (1) `pnpm db:migrate && pnpm db:seed` с `DATABASE_URL=file:./data/lunchhunter.db` — генерирует **template-базу** со схемой drizzle, raw migrations (FTS5, R\*Tree, триггеры) и seed-данными (6 ресторанов, меню, бизнес-ланчи, admin); (2) `pnpm build` — Next.js standalone build (`busy_timeout` в client.ts защищает от `SQLITE_BUSY` в параллельных воркерах Collecting page data); (3) `rm -f data/lunchhunter.db-wal data/lunchhunter.db-shm` — чистит WAL-артефакты, оставляя single-file template.
- `runner` — минимальный runtime: создаёт системного пользователя `nextjs:nodejs` (uid/gid 1001), копирует `public/`, `.next/standalone/`, `.next/static/`, **template-базу в `/app/db-template/lunchhunter.db`**, `docker/entrypoint.sh` и `docker/admin-upsert.mjs`. Директории `/app/data` и `/app/public/uploads` создаются как volume mount points с правами `nextjs:nodejs`. `HOSTNAME=0.0.0.0` (иначе standalone слушает только 127.0.0.1), `PORT=3000` (переопределяется через `docker compose`). `ENTRYPOINT ["/app/docker/entrypoint.sh"]` — см. описание ниже.

### [docker/entrypoint.sh](./docker/entrypoint.sh)
Runner entrypoint-скрипт. При старте контейнера:
1. Проверяет `$TEMPLATE_PATH=/app/db-template/lunchhunter.db` — FATAL если нет.
2. Если `$DB_PATH=/app/data/lunchhunter.db` не существует (пустой volume на первом запуске) → `cp` template в volume. Иначе — сохраняет existing.
3. `node /app/docker/admin-upsert.mjs` — пересоздаёт/обновляет admin-пользователя из `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars (идемпотентно, выполняется каждый старт — поддерживает ротацию пароля через `.env` без ручных SQL).
4. `exec node server.js` — запуск Next.js standalone-сервера.

### [docker/admin-upsert.mjs](./docker/admin-upsert.mjs)
Standalone Node.js ESM-скрипт для admin upsert. Читает `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` из env. Хэширует пароль через `@node-rs/argon2` с теми же OWASP-параметрами, что и `src/lib/auth/password.ts` (`memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1`). UPSERT по email: если админ есть — обновляет `password_hash` + `role='admin'`, иначе INSERT с UUID id. Использует `better-sqlite3` и `@node-rs/argon2` из standalone `node_modules` — никаких дополнительных зависимостей или tsx/tsc в runner не требуется.

### [docker-compose.yml](./docker-compose.yml)
Production compose-файл с одним сервисом `app`:
- `build.context: .` + `args.BUILD_REVISION` — пробрасывает git HEAD для precache SW.
- `image: lunchhunter:latest`, `container_name: lunchhunter`, `restart: unless-stopped`.
- `env_file: .env` — все runtime-переменные (`DATABASE_URL`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN` и т.д.) читаются из корневого `.env`, не дублируются в compose.
- `environment` — `NODE_ENV=production`, `PORT=${PORT:-3000}`, `HOSTNAME=0.0.0.0`.
- `ports: "${PORT:-3000}:${PORT:-3000}"` — host и container порты берутся из `.env`, дефолт 3000.
- `volumes` — `./data:/app/data` (persistent SQLite) и `./public/uploads:/app/public/uploads` (пользовательские загрузки).
- `healthcheck` — `wget --spider http://localhost:${PORT}/` с интервалом 30с, `start_period: 20s`.

### [.dockerignore](./.dockerignore)
Исключения для docker build context: `node_modules`, `.next`, `data/`, `public/uploads/`, `*.db`, env-файлы (кроме `.env.example`), service worker артефакты, `.git`, `.arhit`, `.beads`, `.claude`, документация, TypeScript incremental кеши, сами Docker-файлы.

### [.npmrc](./.npmrc)
pnpm-конфигурация для хостинга нативных зависимостей в корневой `node_modules`:
- `public-hoist-pattern[]=bindings` + `file-uri-to-path` + `node-gyp-build` — транзитивные зависимости `better-sqlite3`, загружаются динамически.
- `public-hoist-pattern[]=@node-rs/argon2-*` — платформо-специфичные subpackages (`@node-rs/argon2-linux-arm64-gnu`, `-x64-gnu`, и т.д.), резолвятся через `require(process.arch/platform)`.
- `public-hoist-pattern[]=@img/sharp-*` + `@img/sharp-libvips-*` — платформо-специфичные subpackages `sharp`.

Без этих хостингов Next.js standalone output трассировщик не захватывает transitive/optional dependencies: они живут только в `.pnpm/` и не симлинкованы в корневой `node_modules/<pkg>/`. С хостингом pnpm создаёт симлинки `node_modules/<pkg> → .pnpm/...`, и статический трассировщик корректно резолвит их в финальный standalone bundle.

### [package.json](./package.json) — секция pnpm
`pnpm.onlyBuiltDependencies`: `["@node-rs/argon2", "@serwist/sw", "better-sqlite3", "esbuild", "sharp"]`. pnpm v10+ по умолчанию блокирует lifecycle-скрипты (`postinstall`, `preinstall`) всех зависимостей для безопасности. Без этой секции в Docker-билде нативные модули не компилируются под linux/arm64 и падает `next build` на стадии `Collecting page data` (`Could not locate the bindings file`). Локально на macOS prebuilt бинари уже есть, поэтому эффекта нет — секция нужна для воспроизводимых CI/Docker-билдов.

## Приложение (App Router)

### [src/app/layout.tsx](./src/app/layout.tsx)
Корневой layout. Подключает:
- Шрифты `Geist` / `Geist_Mono` через `next/font/google` с CSS-переменными `--font-geist-sans` и `--font-geist-mono`.
- `globals.css`.
- Метаданные (`Metadata`): `title`, `description`, `applicationName`, `appleWebApp` (capable + title + statusBarStyle), `formatDetection.telephone: false`, `icons.icon` (192/512 PNG) и `icons.apple` (`/icons/apple-touch-icon.png`).
- Viewport (`Viewport`) с `themeColor: "#FF5C00"`, `width: device-width`, `initialScale: 1`, `maximumScale: 1`.
- `lang="ru"`, классы шрифтов на `<html>`.

Функции: `RootLayout({ children }): React.JSX.Element` — единственный экспорт.

### [src/app/manifest.ts](./src/app/manifest.ts) (Phase 8)
Next.js Metadata API manifest route — отдаёт `/manifest.webmanifest`. Экспортирует default-функцию `manifest(): MetadataRoute.Manifest` с полями:
- `name: "LunchHunter"`, `short_name: "LunchHunter"`, `description`, `lang: "ru"`
- `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `orientation: "portrait"`
- `background_color: "#FFFFFF"`, `theme_color: "#FF5C00"`
- `categories: ["food", "lifestyle", "navigation"]`
- `icons[]` — 192/512 PNG с `purpose: "any"` и 192/512 maskable (`purpose: "maskable"`)

### [src/app/sw.ts](./src/app/sw.ts) (Phase 8)
Исходник service worker'а, собираемый Serwist'ом в `public/sw.js`. Структура:

- `new Serwist({ precacheEntries: self.__SW_MANIFEST, skipWaiting, clientsClaim, navigationPreload, runtimeCaching: defaultCache, fallbacks: { entries: [{ url: "/offline", matcher: request.destination === "document" }] } })` — precache shell + `/offline`, стандартный runtime-кэш `@serwist/next/worker`, document-fallback на `/offline`.
- `serwist.addEventListeners()` — подключает precache/fetch-обработчики.
- Web Push handler (`push` event): парсит `event.data.json() as PushPayload = { title, body, icon?, url?, data? }`, фолбэк на `event.data.text()` если не JSON. Вызывает `showNotification(title, { body, icon: payload.icon ?? "/icons/icon-192.png", badge: "/icons/icon-192.png", data: { url: payload.url ?? "/", ...payload.data } })`.
- `notificationclick` handler: закрывает нотификацию, ищет существующее окно через `clients.matchAll({ type: "window", includeUncontrolled: true })`, если найдено — `client.navigate(url)` + `client.focus()`, иначе `clients.openWindow(url)`.
- `message` handler: при `event.data.type === "SKIP_WAITING"` вызывает `self.skipWaiting()` для prompt-for-update flow.

Объявляет типизацию `WorkerGlobalScope.__SW_MANIFEST` через глобальный `declare`.

### [src/app/offline/page.tsx](./src/app/offline/page.tsx) (Phase 8)
Статическая fallback-страница, отдаваемая service worker'ом когда навигационный запрос падает по сети и нет закэшированной копии целевого маршрута. Precache-запись регистрируется через `additionalPrecacheEntries` в `next.config.ts` и как document fallback в `src/app/sw.ts`. Функция: `OfflinePage(): React.JSX.Element` — бренд-иконка `WifiOff`, заголовок «Нет соединения», ссылка-кнопка на `/` для повторной попытки. Никаких client-only / data-fetching операций.

### [src/app/page.tsx](./src/app/page.tsx)
Корневая страница `/` — плейсхолдер. Функция: `HomePage()`.

### [src/app/globals.css](./src/app/globals.css)
Глобальные стили и дизайн-токены:
- Директива `@import "tailwindcss"` (Tailwind v4).
- Блок `@theme` с CSS-переменными из pencil: accent/surface/fg/semantic colors + radius + fonts + animation tokens.
- Цвета: `--color-accent #ff5c00`, `--color-accent-dark #cc4a00`, `--color-accent-light #fff0e6`, `--color-surface-primary #ffffff` (карточки/модали), `--color-surface-secondary #f5f1ec` (тёплый второстепенный), `--color-surface-inverse`, `--color-page-bg #fbf8f4` (тёплый кремовый фон всей страницы, применяется к `body` в globals.css), `--color-fg-primary/secondary/muted/inverse`, `--color-success #22c55e`, `--color-warning #f59e0b`, `--color-error #ef4444`, `--color-border #e5e7eb`.
- Radius: `--radius-sm 6`, `--radius-md 10`, `--radius-lg 16`, `--radius-xl 24`, `--radius-full 9999`.
- **Animation tokens (ANIMATIONS_GUIDE §1.1):** длительности `--dur-instant 80ms` (touch feedback), `--dur-fast 160ms` (hover/focus), `--dur-base 240ms` (fade-in, root cross-fade), `--dur-slow 400ms` (shared-element morph, hero); easing `--ease-out-quart cubic-bezier(0.25,1,0.5,1)`, `--ease-in-quart cubic-bezier(0.5,0,0.75,0)`, `--ease-in-out cubic-bezier(0.4,0,0.2,1)`, `--ease-spring cubic-bezier(0.34,1.56,0.64,1)`, `--ease-snappy cubic-bezier(0.2,0.9,0.3,1.2)`; animation utilities `--animate-fade-in`, `--animate-pop-in`, `--animate-skeleton`, `--animate-hero-enter` (Tailwind 4 автоматически генерирует классы `animate-fade-in`, `animate-pop-in`, `animate-skeleton`, `animate-hero-enter`).
- `@layer base` — baseline для `html`/`body`/box-sizing, `touch-action: manipulation` для интерактивных элементов, **глобальное press-feedback правило** для `button`/`a`/`[role="button"]`: `transition` на `transform`/`opacity`/`background-color`/`color` с `--dur-instant`/`--dur-fast`/`--ease-out-quart`/`--ease-in-out`, `:active` → `transform: scale(0.97)`. Это правило заменяет все локальные `transition-transform duration-100 active:scale-*` в компонентах.
- `@layer utilities` — `.no-scrollbar` для горизонтальных рядов и `.shadow-hover` utility класс: `position: relative` + `::after` с `inset:0`, `border-radius:inherit`, `box-shadow:0 8px 24px -8px rgba(0,0,0,0.15)`, `opacity:0→1` на hover, `pointer-events:none`, `transition: opacity var(--dur-fast) var(--ease-out-quart)` (заменяет анти-паттерн `animate box-shadow`).
- **Keyframes (только transform+opacity, GPU-friendly):** `@keyframes fade-in` (opacity 0→1 + translateY 8px→0), `@keyframes pop-in` (opacity 0→1 + scale 0.92→1), `@keyframes hero-enter` (opacity 0→1 + translateY 16px→0 + scale 0.96→1), `@keyframes skeleton-shimmer` (background-position -200%→200%). Класс `.skeleton` (linear-gradient 90deg #eeeeee 0%/#f5f5f5 50%/#eeeeee 100%, background-size 200% 100%, animation `var(--animate-skeleton)`, border-radius 8px) используется компонентом `<Skeleton />`.
- **View Transitions API блок (ANIMATIONS_GUIDE §3):** `@view-transition { navigation: auto }` — автоматический VT для всех Next.js навигаций без ручного `startViewTransition`. `::view-transition-old/new(root)` с `animation-duration: var(--dur-base)`, `animation-timing-function: var(--ease-out-quart)`, `animation-name: vt-fade-out/vt-fade-in`. `@keyframes vt-fade-out { to { opacity: 0 } }` и `@keyframes vt-fade-in { from { opacity: 0 } }`. `::view-transition-group(*)` с `animation-duration: var(--dur-slow)`, `animation-timing-function: var(--ease-spring)` — применяется ко всем shared-element group по wildcard. `::view-transition-image-pair(*)` с `isolation: auto` — обязательно для корректного cross-fade картинок разного aspect-ratio.
- **Универсальный `@media (prefers-reduced-motion: reduce)` в конце файла** (ANIMATIONS_GUIDE §4): `*, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }` — одним правилом покрывает ВСЕ элементы и заменяет все точечные `@media (prefers-reduced-motion)`.

## База данных

### [src/lib/db/client.ts](./src/lib/db/client.ts)
Инициализация клиента Drizzle + better-sqlite3. Резолвит `DATABASE_URL` (поддерживает префикс `file:`), создаёт директорию `data/` при необходимости, включает `journal_mode = WAL`, `busy_timeout = 5000` (SQLite ждёт до 5с освобождения лока вместо мгновенного `SQLITE_BUSY` — критично для параллельных воркеров Next.js Collecting page data при docker build и для конкурентных серверных запросов в WAL-режиме) и `foreign_keys = ON`.

Экспорты:
- `db` — Drizzle instance с подключённой схемой.
- `sqlite` — сырой `Database` instance для raw-запросов.
- `Db` — тип клиента.
- `resolveDbPath()` — внутренняя функция резолва пути.

### [src/lib/db/schema.ts](./src/lib/db/schema.ts)
Drizzle-схема БД. Таблицы:

| Таблица | Назначение |
|---|---|
| `users` | Пользователи (email, password_hash, tg_id, tg_username, name, avatar, city, role) |
| `sessions` | Сессии Lucia Auth (id, user_id, expires_at) |
| `restaurants` | Рестораны (name, slug, category, address, lat, lng, phone, website, description, hours_json, price_avg, rating, cover_url, status, tags_json) |
| `restaurant_photos` | Фотогалерея ресторана (restaurant_id, url, sort_order) |
| `menu_categories` | Категории меню (restaurant_id, name, sort_order) |
| `menu_items` | Позиции меню (restaurant_id, category_id, name, description, price, photo_url, status) |
| `business_lunches` | Бизнес-ланчи (restaurant_id, name, price, time_from, time_to, days_mask, status) |
| `business_lunch_days` | Состав бизнес-ланча по дням недели (lunch_id, weekday, courses_json) |
| `favorites` | Полиморфное избранное пользователя (user_id, target_type ∈ {restaurant,menu_item,lunch}, target_id) |
| `search_history` | История поиска (user_id, query) |
| `push_subscriptions` | Web Push подписки (user_id, endpoint, keys_json) |
| `reviews` | Отзывы пользователей с подтверждением чеком (user_id, restaurant_id, text, rating 1-5, receipt_image_url, receipt_total, receipt_date, receipt_items_json, receipt_establishment_name, match_confidence, status pending/approved/rejected) |
| `receipts` | Standalone загрузки чеков для статистики (user_id, restaurant_id nullable, image_url, total, date, items_json, establishment_name) |

Также экспортирует `*Relations` для Drizzle query-API (joins через `db.query.*.findMany({ with: ... })`).

Индексы: уникальные на `users.email`, `users.tg_id`, `restaurants.slug`, `favorites(user_id, target_type, target_id)`, `business_lunch_days(lunch_id, weekday)`; обычные на `restaurants(lat, lng)`, `menu_items.restaurant_id`, `business_lunches.restaurant_id`, `favorites(user_id)`, `favorites(target_type, target_id)` и др.

Экспортирует константу `FAVORITE_TARGET_TYPES` и тип `FavoriteTargetType` для дискриминатора избранного.

### [src/lib/db/raw-migrations.ts](./src/lib/db/raw-migrations.ts)
Raw SQL-миграции для фич, не выражаемых через Drizzle. Идемпотентны (`IF NOT EXISTS`).

Функция: `applyRawMigrations(db: Database.Database): void`.

Создаёт:
- **FTS5** — `menu_items_fts` (external content table для `menu_items`, `tokenize='unicode61 remove_diacritics 2'`). Sync-триггеры `menu_items_ai/ad/au` держат индекс в синхронизации при INSERT/DELETE/UPDATE.
- **R*Tree** — `restaurants_rtree` (id + min_lat/max_lat/min_lng/max_lng). Sync-триггеры `restaurants_rtree_ai/ad/au` обновляют rtree при изменении координат.
- **Favorites polymorphic migration** — при обнаружении легаси-колонки `favorites.restaurant_id` пересоздаёт таблицу с `(target_type, target_id)`, перенося существующие записи как `target_type='restaurant'`. Создаёт уникальный индекс `favorites_user_target_uq` и вспомогательные индексы. Идемпотентно.
- **Favorites cleanup-триггеры** — `favorites_restaurant_ad`, `favorites_menu_item_ad`, `favorites_lunch_ad`: каскадно удаляют связанные записи избранного при удалении ресторана / позиции меню / бизнес-ланча.

### [src/lib/db/migrate.ts](./src/lib/db/migrate.ts)
CLI-скрипт миграций: `pnpm db:migrate`. Последовательно применяет Drizzle-миграции из `src/lib/db/migrations`, затем `applyRawMigrations()` для FTS5/R*Tree.

### [src/lib/db/favorites.ts](./src/lib/db/favorites.ts)
Server-side helpers для работы с полиморфным избранным. Экспортирует:
- `isValidFavoriteTargetType(value)` — type guard для `FavoriteTargetType`.
- `isFavorited(userId, targetType, targetId)` — проверка одного элемента.
- `getFavoritedIds(userId, targetType, targetIds)` — batch-проверка, возвращает `Set<number>` для подсветки на списочных страницах / меню.
- `toggleFavorite(userId, targetType, targetId)` — idempotent toggle, возвращает `{favorited: boolean}`.
- `getUserFavorites(userId)` — возвращает все избранные элементы пользователя, сгруппированные по трём типам: `{restaurants, menuItems, lunches}` с присоединёнными деталями (raw SQL через `sqlite.prepare`).
- `getUserFavoritesCount(userId)` — возвращает общее число избранных элементов пользователя (одним COUNT-запросом, используется на `/profile`).
- Типы: `FavoriteRestaurantRow`, `FavoriteMenuItemRow`, `FavoriteLunchRow`, `UserFavorites`.

### [src/lib/db/reviews.ts](./src/lib/db/reviews.ts)
Server-side helpers для работы с отзывами ресторанов. Экспортирует:
- `createReview(data: CreateReviewData)` — вставляет новый отзыв, возвращает inserted record.
- `getReviewsByRestaurant(restaurantId, limit?)` — одобренные отзывы с JOIN users (authorName, authorAvatarUrl), ORDER BY createdAt DESC.
- `getRestaurantReviewStats(restaurantId)` — агрегация `{ count, avgRating }` по одобренным отзывам. Для пустой выборки возвращает `{ count: 0, avgRating: 0 }`.
- Типы: `CreateReviewData`, `ReviewRow`, `ReviewStats`.

### [src/lib/db/receipt-categories.ts](./src/lib/db/receipt-categories.ts)
Keyword-словарь категоризации позиций чека. Экспортирует:
- `categorizeItem(name: string)` — классифицирует позицию чека по названию (поиск подстроки, case-insensitive). Возвращает `ReceiptItemCategory | null`.
- `CATEGORY_LABELS` — читабельные русские названия категорий для UI.
- Тип `ReceiptItemCategory` — 11 категорий: beer, wine, cocktail, spirits, soft_drink, coffee, tea, food, dessert, tips, hookah.
- Поддерживает русские и английские ключевые слова.

### [src/lib/db/receipts.ts](./src/lib/db/receipts.ts)
Server-side helpers для работы с чеками пользователей. Экспортирует:
- `createReceipt(data: CreateReceiptData)` — вставляет чек, возвращает inserted record.
- `getUserReceipts(userId)` — список чеков пользователя, ORDER BY createdAt DESC.
- `getUserReceiptStats(userId)` — агрегация: `{ totalSpent, visitCount, categoryBreakdown }`. Breakdown строится через `categorizeItem()` по позициям из `itemsJson`.
- `getLeaderboard(category, limit?)` — топ пользователей. Для `category="total"` — по сумме чеков (SQL агрегация). Для конкретной категории — парсит `itemsJson` и суммирует через `categorizeItem()`.
- `getUserPercentile(userId, category)` — процентиль пользователя (0–100). 100 = топ, 0 = низ. При отсутствии данных возвращает 0.
- Типы: `CreateReceiptData`, `ReceiptRow`, `UserReceiptStats`, `LeaderboardEntry`.

### [src/lib/db/seed.ts](./src/lib/db/seed.ts)
CLI-скрипт seed: `pnpm db:seed`. Идемпотентный (очищает таблицы перед наполнением).

Содержит:
- `RESTAURANTS: SeedRestaurant[]` — 6 ресторанов Москвы (Жаровня, Тануки, Osteria Mario, Хинкальная №1, Burger Heroes, Pho Bo Café) с меню.
- `BUSINESS_LUNCHES: SeedBusinessLunch[]` — 3 бизнес-ланча с недельным расписанием (Mon-Fri).
- `MON_FRI_MASK = 0b0011111` — битовая маска пн-пт для `days_mask`.
- `flickr(tags, lock, w, h)` — helper, возвращает LoremFlickr URL
  (`https://loremflickr.com/{w}/{h}/{tags}?lock={lock}`) для стабильных
  placeholder-фото по тегам. Используется для генерации обложек
  ресторанов и фото блюд.
- `RESTAURANT_IMAGE_TAGS: Record<slug, tags>` — маппинг slug ресторана
  на поисковые теги для LoremFlickr (напр. `zharovnya → "russian,food"`,
  `tanuki-arbat → "sushi,japanese"`).
- Функция `main()` — вставляет рестораны (с `coverUrl`) → категории
  меню → позиции (с `photoUrl`, сгенерированными через монотонный
  `menuPhotoSeed` для уникальности) → бизнес-ланчи → дни.

Интерфейсы: `SeedCategory`, `SeedRestaurant`, `SeedBusinessLunch`.

### [src/lib/db/migrations/](./src/lib/db/migrations/)
Автогенерируемые SQL-миграции Drizzle:
- `0000_nervous_mad_thinker.sql` — все начальные таблицы схемы + индексы
- `0001_push_subscriptions.sql` — таблица push_subscriptions для Web Push/VAPID
- `0002_reviews_receipts.sql` — таблицы reviews и receipts с FK constraints и индексами

## Геоутилиты

### [src/lib/geo/haversine.ts](./src/lib/geo/haversine.ts)
Расчёт расстояний и bounding-boxов для радиусного поиска.

Экспорты:
- `haversineDistance(lat1, lng1, lat2, lng2): number` — great-circle расстояние в метрах (формула Haversine, `EARTH_RADIUS_METERS = 6_371_000`).
- `bboxFromRadius(lat, lng, radiusMeters): BoundingBox` — прямоугольник для pre-фильтрации через R*Tree (`latDelta = R/111000`, `lngDelta = R/(111000·cos(lat))`).
- `BoundingBox` — интерфейс `{ minLat, maxLat, minLng, maxLng }`.

Типичное использование: `bboxFromRadius()` → SELECT из `restaurants_rtree` по bbox → точная фильтрация результатов через `haversineDistance()`.

## Данные и артефакты

### [data/lunchhunter.db](./data/lunchhunter.db)
SQLite-файл БД (gitignored). Создаётся автоматически при первом запуске `db:migrate`. WAL-режим включён.

### [public/](./public/)
Статические ассеты, обслуживаемые Next.js. Поддиректория `public/uploads/` зарезервирована под загрузки ресторанных фото (gitignored).

### [public/icons/](./public/icons/) (Phase 8)
PWA-иконки, сгенерированные скриптом `scripts/generate-pwa-icons.ts`:
- `icon-192.png`, `icon-512.png` — иконки «any» purpose
- `icon-maskable-192.png`, `icon-maskable-512.png` — иконки «maskable» purpose с safe-area padding для OS masks
- `apple-touch-icon.png` (180x180) — apple-touch-icon, на который ссылается `metadata.icons.apple`

### [public/sw.js](./public/sw.js) (Phase 8, build artifact)
Собранный Serwist'ом service worker. Генерируется из `src/app/sw.ts` во время `next build` **и в dev-режиме** (Serwist включён всегда, чтобы Push API работал локально). Отключить можно `DISABLE_PWA=1`.

### [public/manifest.webmanifest](./public/manifest.webmanifest) (Phase 8, runtime route)
Фактический манифест отдаётся Next.js-роутом `src/app/manifest.ts` по URL `/manifest.webmanifest`.

### [scripts/generate-pwa-icons.ts](./scripts/generate-pwa-icons.ts) (Phase 8)
Одноразовый TS-скрипт для генерации PWA-иконок. Запуск: `pnpm tsx scripts/generate-pwa-icons.ts`. Использует `sharp` для растеризации инлайнового SVG с брендовым оранжевым фоном (`#FF5C00`) и белым «utensils-crossed» глифом.

Функции:
- `buildIconSvg({ size, safeAreaRatio }): string` — строит SVG-строку заданного размера с контролем safe-area (glyph занимает `safeAreaRatio` от canvas)
- `renderIcon({ size, safeAreaRatio, fileName }): Promise<void>` — растеризует SVG в PNG через `sharp(...).resize().png()` и пишет в `public/icons/`
- `main()` — генерирует 192/512 «any», 192/512 maskable (с меньшим `safeAreaRatio`), и apple-touch-icon (180x180)

## Общие утилиты

### [src/lib/utils/cn.ts](./src/lib/utils/cn.ts)
Хелпер `cn(...inputs: ClassValue[]): string` — объединяет Tailwind-классы через `clsx` + разрешает конфликты через `tailwind-merge`. Используется всеми UI-компонентами для композиции className.

### [src/lib/transitions.ts](./src/lib/transitions.ts)
Утилиты плавной навигации между маршрутами.

Стратегия:
- Если браузер поддерживает View Transitions API → используется нативный `@view-transition { navigation: auto }` (см. `globals.css`). Wrapper нужен только для `startTransition`, чтобы Next.js не блокировал UI на async route.
- Если VT API недоступен (Telegram Mini App, старые WebView) и переданы `sourceEl` + `targetSelector` → manual FLIP morph через `manualFlipMorph` из `morph.ts`.
- `prefers-reduced-motion: reduce` → мгновенный `router.push` без анимаций.

Экспорты:
- `prefersReducedMotion(): boolean` — SSR-safe синхронная проверка `prefers-reduced-motion: reduce` (на сервере возвращает `false`, в браузере читает `window.matchMedia(...)`). Для реактивного отслеживания есть отдельный хук `usePrefersReducedMotion`.
- `supportsViewTransitions(): boolean` — feature detection нативного View Transitions API. SSR-safe. Chrome/Edge 111+, Safari 18+.
- `interface NavigateOptions { sourceEl?: HTMLElement | null; targetSelector?: string }` — опции для FLIP morph fallback на устройствах без VT API.
- `navigate(router, href, options?): void` — навигация с гарантированным морфом. Четыре ветки: reduced-motion → `router.push`; VT API → `startTransition(() => router.push(href))`; FLIP fallback с source+target → `manualFlipMorph`; иначе — просто `startTransition(() => router.push(href))`.
- `navigateBack(router, fallbackHref): void` — back-навигация. Проверяет `window.history.length`: если пусто → делегирует на `navigate(router, fallbackHref)`. Reduced motion → `router.back()`. Иначе → `startTransition(() => router.back())` (VT API сам подхватит history navigation).

Используется в `BackButton`, `useHaptics` (импорт `prefersReducedMotion`), и во всех клиентских списках-консьюмерах shared-element morph: `NearbyRestaurantsRow`, `DesktopPopularRestaurantsGrid`, `DesktopSearchResults`, `MobileSearchResults`, `MobileMapView`. Эти компоненты импортируют `navigate` + `supportsViewTransitions` и вызывают их в собственном `onClick` handler как fallback для Telegram WebView без VT API.

### [src/lib/morph.ts](./src/lib/morph.ts)
Manual shared-element morph через FLIP-технику и Web Animations API — используется как fallback в Telegram Mini App и старых WebView, где нативный View Transitions API недоступен.

Алгоритм FLIP (First, Last, Invert, Play):
1. **First**: `resolveMorphSource(sourceEl)` выбирает между вложенным `[data-vt-morph-source]` (cover-обёрткой) и всей карточкой, затем `getBoundingClientRect` для snapshot начальной позиции.
2. `createOverlayClone(sourceEl, rect)` клонирует элемент в `position: fixed` overlay на `body`, применяет inline-стили (`left/top/width/height/zIndex/overflow: hidden/boxSizing: border-box`), отключает CSS-transitions на клоне и всех потомках, чтобы не конфликтовать с Web Animations API.
3. Оригинал скрывается через `visibility: hidden` — React потом всё равно размонтирует sourceEl при `router.push`.
4. Вызывается `navigate()` (обёртка над `router.push`), начинается рендер новой страницы (loading.tsx → page.tsx).
5. **Last**: `waitForElement(targetSelector, timeoutMs)` через `MutationObserver` ждёт появления DOM-элемента с `[data-vt-target="..."]`. Сначала синхронный `querySelector`, потом подписка на мутации body (childList, subtree, attributeFilter: data-vt-target). Если не появляется за `DEFAULT_TARGET_TIMEOUT_MS` (1500мс) — fade-out clone и выход.
6. **Invert + Play**: WAAPI `clone.animate([...])` анимирует `left/top/width/height/borderRadius` напрямую (НЕ transform: scale — это даёт img object-cover пересчёт crop без деформации). Offset-keyframes: source→target на offset `CLONE_FADE_OUT_OFFSET` (0.6), затем opacity 1→0 на offset 1.
7. Параллельно: `targetEl.animate([...])` — opacity 0→1 в последние 40% (cross-fade). Оба `Promise.all(cloneAnimation.finished, targetAnimation.finished)`.
8. Cleanup: `clone.remove()`, восстанавливаются inline-стили target и (на всякий случай) source.

Экспорты:
- `manualFlipMorph(opts: ManualFlipMorphOptions): Promise<void>` — главная функция. `opts = { sourceEl, targetSelector, navigate, duration?, easing?, timeoutMs? }`. Ранее называлась `manualMorph` (переименована в Phase 2).

Константы: `DEFAULT_DURATION_MS = 380`, `DEFAULT_TARGET_TIMEOUT_MS = 1500`, `CLONE_FADE_OUT_OFFSET = 0.6`. Easing по умолчанию читается из CSS-токена `--ease-out-quart` через `getDefaultEasing()` — `getComputedStyle(document.documentElement).getPropertyValue("--ease-out-quart").trim()` с fallback на literal `cubic-bezier(0.25, 1, 0.5, 1)` для SSR.

Используется в `navigate()` из `transitions.ts` и в хуке `useFlipMorph`.

### [src/lib/hooks/useHaptics.ts](./src/lib/hooks/useHaptics.ts)
Client-only React хук для тактильной обратной связи (`"use client"`). Кросс-платформенно: сначала детектит `window.Telegram.WebApp.HapticFeedback` (основной канал в Telegram Mini App), иначе `navigator.vibrate(...)` на Web, иначе no-op. Уважает `prefers-reduced-motion` (подавляет `navigator.vibrate`).

Экспорты:
- Тип `HapticKind = "tap" | "light" | "selection" | "success" | "warning" | "error"`.
- Интерфейс `HapticsApi` — объект с методами `tap`, `light`, `selection`, `success`, `warning`, `error` (все `() => void`).
- `useHaptics(): HapticsApi` — возвращает стабильный (useMemo + useCallback) объект. Внутри каждого метода вызывается приватная `triggerHaptic(kind)`, которая мапит `HapticKind` на `impactOccurred('medium'|'light')`, `notificationOccurred(kind)` или `selectionChanged()` в Telegram API, а в web-fallback — `navigator.vibrate([8,40,8])` для `success` или `navigator.vibrate(8)` для остальных.

Типы Telegram API (`TelegramHapticFeedback`, `TelegramWebApp`, `TelegramNamespace`) задаются локально в файле — без внешних зависимостей и без `any`. Используется в `Button`, `Chip`, `FavoriteButton`, `RadiusSelector`, `BottomTabBar`.

### [src/lib/hooks/useMounted.ts](./src/lib/hooks/useMounted.ts)
Task hydration helper хук (`"use client"`). Возвращает `boolean`: `false` на первом (SSR/первом клиентском) рендере и `true` после монтирования компонента через `useState(false) + useEffect(() => setMounted(true), [])`. Используется для предотвращения SSR/CSR mismatch в компонентах, которые зависят от `window`/`document` или запускают анимации только после гидратации.

Экспорты:
- `useMounted(): boolean` — no args, возвращает флаг монтирования.

### [src/lib/hooks/usePrefersReducedMotion.ts](./src/lib/hooks/usePrefersReducedMotion.ts)
Реактивный хук (`"use client"`) для отслеживания `prefers-reduced-motion: reduce`. В отличие от синхронной `prefersReducedMotion()` из `transitions.ts`, подписывается на `change` event у `MediaQueryList` и перерисовывает компонент при смене настройки — анимации мгновенно отключаются без перезагрузки страницы. `addEventListener`/`removeEventListener` поддержаны Safari 14+, устаревший `addListener` не нужен. SSR-safe: первый рендер возвращает `false`, после `useEffect` читает реальное значение.

Экспорты:
- `usePrefersReducedMotion(): boolean` — реактивный флаг reduced motion.

### [src/lib/hooks/useViewTransition.ts](./src/lib/hooks/useViewTransition.ts)
Обёртка над `document.startViewTransition` для НЕ-навигационных state-переходов (theme switch, accordion expand/collapse, tab switch, filter apply). Использует `flushSync` из `react-dom` чтобы форсировать синхронный flush React updates внутри VT-коллбэка — без этого React в concurrent mode может отложить state update, и VT API снимет snapshot до применения нового состояния.

Graceful fallback: если `document.startViewTransition` недоступен (Telegram Mini App, старые WebView), коллбэк вызывается напрямую без анимации. SSR-safe. Для НАВИГАЦИОННЫХ переходов этот хук НЕ нужен — там работает `@view-transition { navigation: auto }` в CSS + `startTransition` в `navigate()`.

Экспорты:
- `useViewTransition(): (callback: () => void) => void` — возвращает функцию, оборачивающую callback в `document.startViewTransition(() => flushSync(callback))`.

### [src/lib/hooks/useFlipMorph.ts](./src/lib/hooks/useFlipMorph.ts)
Тонкая React-обёртка (`"use client"`) над `manualFlipMorph` из `@/lib/morph`. Возвращает стабильный `useCallback([])` async функцию. Инкапсулирует guard: если `sourceEl == null` (например, ref ещё не разрешился) — просто вызывает `opts.navigate()` без попытки морфа.

Используется в консьюмерах (начиная с Phase 3+) для Telegram Mini App fallback когда нативный View Transitions API недоступен. На устройствах с VT API обычно предпочтительнее использовать `navigate()` из `@/lib/transitions`, который сам разберётся с выбором стратегии.

Экспорты:
- `interface UseFlipMorphOptions { sourceEl: HTMLElement | null; targetSelector: string; navigate: () => void }` — опции вызова.
- `useFlipMorph(): (opts: UseFlipMorphOptions) => Promise<void>` — возвращает стабильную async функцию.

### [src/lib/hooks/usePrefetchImage.ts](./src/lib/hooks/usePrefetchImage.ts)
Client-only hook для предзагрузки hi-res картинки в browser image cache (long-press prefetch, ANIMATIONS_GUIDE §9). Возвращает callback, который создаёт `new window.Image()` и присваивает `img.src = url` — браузер обрабатывает это как обычный image request и кладёт байты в HTTP/Image cache, так что последующий `<img src={sameUrl}>` на destination-странице читает ответ без network round-trip.

Используется на карточках ресторанов в списочных компонентах в связке с `onPointerEnter` (desktop hover) и `onPointerDown` (mobile touch start), чтобы к моменту морфа через View Transitions API hi-res обложка уже была закеширована — это убирает flash of loading в shared-element transition.

SSR-safe: на сервере (`typeof window === "undefined"`) возвращает noop. Null/undefined URL игнорируется — удобно, когда `coverUrl` опциональное поле модели ресторана.

Экспорты:
- `usePrefetchImage(): (url: string | null | undefined) => void` — возвращает стабильный `useCallback([])` prefetch callback.

Консьюмеры: [NearbyRestaurantsRow](./src/app/(site)/_components/NearbyRestaurantsRow.tsx), [DesktopPopularRestaurantsGrid](./src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx), [DesktopSearchResults](./src/app/(site)/search/_components/DesktopSearchResults.tsx), [MobileSearchResults](./src/app/(site)/search/_components/MobileSearchResults.tsx), [MobileMapView](./src/app/(site)/map/_components/MobileMapView.tsx), [FavoriteRestaurantCards](./src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx), [RestaurantIndexCards](./src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx).

### [src/lib/hooks/useActiveVT.ts](<./src/lib/hooks/useActiveVT.ts>)
Хук (`"use client"`) для управления «активной» карточкой в списке — той, на которую кликнули, и которой нужно выставить `view-transition-name`. Реализует паттерн из ANIMATIONS_GUIDE §9.5.3: `view-transition-name` не должен дублироваться в момент snapshot'а, иначе Chrome/Safari бросают `InvalidStateError`. Решение — держать имя **только на активной** карточке, остальные без имени.

Внутри: `useState<TId | null>`, `activate(id)` через `flushSync(() => setActiveId(id))` (чтобы React закоммитил до VT snapshot'а браузера), `isActive(id)` для сравнения. При монтировании `useEffect` читает sessionStorage[storageKey] и сразу очищает — это нужно для back-навигации, когда detail-страница перед `router.back()` кладёт id в storage через `rememberActiveForBack`.

Экспорты:
- `useActiveVT<TId>(storageKey): { activeId, activate, isActive }` — хук для списка.
- `rememberActiveForBack(storageKey, id)` — вызывается в detail-страницах перед back.
- `ACTIVE_RESTAURANT_VT_STORAGE_KEY` = `"lh:vt-active-restaurant"` — стандартный ключ для VT активной карточки ресторана.

Консьюмеры: все списочные компоненты, где карточки ведут на `/restaurant/[id]` — `NearbyRestaurantsRow`, `DesktopPopularRestaurantsGrid`, `MobileSearchResults`, `DesktopSearchResults`, `MobileMapView`, плюс `BackButton` (для `rememberActiveForBack`).

## Переходы и анимации

Система нативных анимаций навигации и тактильной обратной связи построена
из трёх независимых слоёв, каждый из которых работает без другого и не
ломает UX при отсутствии соответствующего API.

### Слой 1 — Мгновенный отклик

Пользователь видит и чувствует результат нажатия сразу:
- **Press feedback:** единое глобальное правило в
  [globals.css](./src/app/globals.css) для селектора `button, a, [role="button"]`
  даёт `transition: transform var(--dur-instant) var(--ease-out-quart)` и
  `transform: scale(0.97)` на `:active` — это покрывает
  [Button](./src/components/ui/Button.tsx),
  [Chip](./src/components/ui/Chip.tsx),
  [FavoriteButton](./src/components/ui/FavoriteButton.tsx),
  [RadiusSelector pills](./src/components/map/RadiusSelector.tsx),
  [BottomTabBar links](./src/components/mobile/BottomTabBar.tsx). Для
  [Card interactive](./src/components/ui/Card.tsx) компонент автоматически
  проставляет `role="button"` + `tabIndex={0}`, поэтому попадает под то же
  глобальное правило. Локальные `active:scale-*` / `duration-*` классы
  удалены.
- **Хаптики:** `useHaptics().tap() / selection() / success() / light()` —
  кросс-платформенный хук ([src/lib/hooks/useHaptics.ts](./src/lib/hooks/useHaptics.ts)),
  работающий через Telegram Mini App HapticFeedback API или `navigator.vibrate`.
  Уважает `prefers-reduced-motion`.

### Слой 2 — Скелет + прогресс-полоска (Фаза 2, 3)

Чтобы переход между страницами не выглядел как «зависание», мы заполняем
два промежутка времени:
- **`loading.tsx`** — Next.js App Router автоматически отдаёт server-компонент-
  скелет на время, пока целевая страница ещё рендерится на сервере. Все
  тяжёлые сегменты в `(site)` имеют свой `loading.tsx` с точным повтором
  финальной сетки, чтобы не было layout-shift при подстановке реального
  контента. Файлы: [site loading.tsx](<./src/app/(site)/loading.tsx>),
  [search](<./src/app/(site)/search/loading.tsx>), [map](<./src/app/(site)/map/loading.tsx>),
  [restaurant/[id]](<./src/app/(site)/restaurant/[id]/loading.tsx>),
  [business-lunch](<./src/app/(site)/business-lunch/loading.tsx>),
  [profile](<./src/app/(site)/profile/loading.tsx>), [favorites](<./src/app/(site)/favorites/loading.tsx>).
  Примитив: [Skeleton.tsx](./src/components/ui/Skeleton.tsx) + `.skeleton` CSS.
- **`<RouteProgress />`** — тонкая (2px) accent-полоска сверху окна, слушает
  `CustomEvent('routeprogress:start')`, который диспатчит
  `dispatchRouteProgressStart()` из любого клиентского потребителя
  навигации (обёртки над `<Link>`, `BackButton`, программные `router.push`),
  и гасит по смене `usePathname()`. Смонтирована как глобальный индикатор
  в [src/app/(site)/layout.tsx](./src/app/(site)/layout.tsx). Файл:
  [src/components/ui/RouteProgress.tsx](./src/components/ui/RouteProgress.tsx).
- **Нативный cross-fade переходов** — `@view-transition { navigation: auto }`
  в [globals.css](./src/app/globals.css). Браузер автоматически делает
  snapshot старой страницы и кроссфейдит root между маршрутами без
  участия JS. [template.tsx](./src/app/(site)/template.tsx) — минимальный
  pass-through wrapper без собственных CSS-анимаций.

### Слой 3 — Shared-element morph (Phase 3)

Нативная пара элементов «улетает» из списка в hero страницы ресторана через
View Transitions API по паттерну из ANIMATIONS_GUIDE §9.5.3:

**Стратегия «имя только на активной карточке».** До клика ни у одной карточки
нет `view-transition-name`. В момент клика `useActiveVT.activate(id)` через
`flushSync` **синхронно** проставляет имя `restaurant-image-${id}` на выбранную
карточку и `restaurant-title-${id}` на её заголовок — ДО того, как браузер
снимет snapshot «до» навигации. Страница детали `/restaurant/[id]` всегда
рендерит hero с тем же именем. В snapshot'ах «до» и «после» имя существует
ровно в одном месте каждый — дубликатов нет, `InvalidStateError` невозможен.

Для back-навигации (`detail → list`) `BackButton` получает `restaurantId` из
page и перед `router.back()` вызывает `rememberActiveForBack(key, id)` —
id кладётся в `sessionStorage`. `useActiveVT` на списке в `useEffect` читает
storage при монтировании, сразу очищает и применяет id в state. Снимок VT API
«после» на возврате содержит карточку с нужным именем → morph работает в
обратную сторону.

Браузеры с VT API (Chrome/Edge 111+, Safari 18+) автоматически находят парный
элемент через `@view-transition { navigation: auto }` в
[globals.css](./src/app/globals.css) и делают shared-element morph.

**Fallback для Telegram Mini App / WebView без VT API.** Каждый клиентский
консьюмер импортирует `navigate` + `supportsViewTransitions` из
[src/lib/transitions.ts](./src/lib/transitions.ts) и кладёт `onClick` handler
на корневой `<Link>`:
```tsx
const handleClick = (e) => {
  if (supportsViewTransitions()) return; // VT API сам сработает через Link
  e.preventDefault();
  navigate(router, href, {
    sourceEl: linkRef.current,
    targetSelector: `[data-vt-target="restaurant-image-${r.id}"]`,
  });
};
```
`navigate()` вызывает `manualFlipMorph` из `morph.ts`, который клонирует
source-элемент в overlay через Web Animations API и анимирует к позиции
target-элемента (найденного через `querySelector`). На странице-приёмнике
hero имеет `data-vt-target="restaurant-image-${restaurant.id}"` — это
атрибут поиска для FLIP, дополняющий `viewTransitionName` для VT API.

- **Целевые hero-элементы:**
  - [restaurant/[id]/page.tsx](<./src/app/(site)/restaurant/[id]/page.tsx>)
    (mobile hero 220px — `md:hidden`);
  - [DesktopRestaurantDetail.tsx](<./src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx>)
    (desktop hero 220px — `hidden md:flex`);
  - [business-lunch/[id]/page.tsx](<./src/app/(site)/business-lunch/[id]/page.tsx>)
    (hero 180px — использует `restaurant.id` для совместимости с ресторанными
    консьюмерами);
  - [restaurant/[id]/loading.tsx](<./src/app/(site)/restaurant/[id]/loading.tsx>)
    (client component, использует `useParams()` для построения VT name;
    если URL — slug, а консьюмеры используют numeric id, имя не совпадёт
    и VT API деградирует в root cross-fade — это приемлемо).
- **Mobile ↔ Desktop коллизия:** обе hero-версии рендерятся в одном JSX
  через `md:hidden` / `hidden md:flex` (т.е. `display: none` у скрытой).
  Элементы с `display: none` НЕ участвуют в снимке VT API, поэтому никаких
  коллизий `view-transition-name` между мобильным и десктопным hero нет.
- **Консьюмеры-списки:**
  - [NearbyRestaurantsRow](<./src/app/(site)/_components/NearbyRestaurantsRow.tsx>) —
    мобильная секция "Рядом с вами" на главной. Карточка вынесена в
    `NearbyRestaurantCard` с `useRef<HTMLAnchorElement>` + `useRouter()` +
    `handleClick`.
  - [DesktopPopularRestaurantsGrid](<./src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx>) —
    десктопная сетка "Популярные рестораны" на главной. Карточка вынесена
    в `DesktopPopularRestaurantCard`.
  - [MobileSearchResults](<./src/app/(site)/search/_components/MobileSearchResults.tsx>) —
    мобильные результаты поиска. Карточка вынесена в
    `MobileSearchResultCard` с двумя рефами: `cardRef` (внешний div, на
    него повешен `viewTransitionName`, чтобы морфить весь визуальный
    прямоугольник целиком, включая MapThumbnail) и `linkRef` (абсолютный
    overlay-`<Link>` слева). `sourceEl = cardRef.current` в `navigate()`.
  - [DesktopSearchResults](<./src/app/(site)/search/_components/DesktopSearchResults.tsx>) —
    десктопные результаты поиска в split-view. Карточка вынесена в
    `SearchResultCard`. VT name использует `restaurantId` (не `itemId`),
    чтобы несколько результатов одного ресторана не ломали уникальность.
  - [MobileMapView](<./src/app/(site)/map/_components/MobileMapView.tsx>) —
    bottom-sheet на мобильной `/map` странице. Карточка вынесена в
    `MobileMapResultCard`. Требует `MobileMapItem.restaurantId: number` —
    [map/page.tsx](<./src/app/(site)/map/page.tsx>) селектит
    `r.id AS restaurant_id`.
- **BottomTabBar shared-element:** помимо `restaurant-image-${id}` в
  проекте используется отдельный shared-element — `bottom-tab-indicator`.
  Активный таб в [BottomTabBar](./src/components/mobile/BottomTabBar.tsx)
  имеет `style={{ viewTransitionName: 'bottom-tab-indicator' }}` — ТОЛЬКО
  один в дереве в любой момент. При клике по другому табу VT API морфит
  скользящий pill-индикатор. `BottomTabBar` использует чистый `<Link>` из
  `next/link` + `haptics.selection()` через `onClick`.

### Дисциплина уникальных `view-transition-name`

Ключевое ограничение View Transitions API: в момент снимка каждый
`view-transition-name` должен встречаться **ровно один раз** в видимом DOM
(элементы с `display: none` не считаются). Нарушение приводит к отказу
всей анимации с warning в console. Используемые в проекте имена:
- `restaurant-image-${id}` — inline на обложке карточки ресторана и на
  hero на странице детали. Per-restaurant-id значит: уникальность
  гарантирована, пока каждый ресторан встречается в списке не более 1 раза
  (в будущем, при группировке меню-блюд по ресторану, нужно будет следить
  чтобы один restaurantId не дублировался в снимке);
- `restaurant-title-${id}` — аналогично, для заголовка h3/h1;
- `bottom-tab-indicator` — inline на активном табе BottomTabBar (один
  активный по определению);
- `root` — неявное имя корня страницы (управляется стилями
  `::view-transition-old/new(root)` в `globals.css`).

## UI-kit (Phase 2)

Библиотека UI-примитивов в `src/components/ui/`. Все компоненты соответствуют дизайну из `lanchHunter.pen`, типизированы строго (strict TS), используют `forwardRef` где применимо, стили через Tailwind v4 + дизайн-токены из `globals.css`. Класс-варианты реализованы через `class-variance-authority` (CVA).

### [src/components/ui/Button.tsx](./src/components/ui/Button.tsx)
Client component (`"use client"`). Кнопка с вариантами `primary` (accent #FF5C00), `secondary` (surface-secondary), `ghost`, `accent-soft` (accent-light fill), `danger`. Размеры `sm`/`md`/`lg`, опц. `fullWidth`, `leftIcon`/`rightIcon` слоты под lucide-иконки. Экспортирует `Button`, `ButtonProps`, `buttonVariants` (CVA factory).

**Press feedback:** Scale-эффект `scale(0.97)` на `:active` обеспечивается глобальным правилом в `globals.css` для селектора `button, a, [role="button"]` — локальные `active:scale-*` классы в CVA не нужны. В `forwardRef`-обёртке `onClick` обёрнут через `handleClick`, который перед пользовательским коллбэком вызывает `useHaptics().tap()` — тактильный отклик ощущается мгновенно, даже если асинхронный onClick. `disabled:pointer-events-none` гарантирует что disabled-кнопки не дают хаптика.

### [src/components/ui/Input.tsx](./src/components/ui/Input.tsx)
Текстовое поле и специализированный `SearchInput` с иконкой `Search` из lucide-react. Поддерживает `leftIcon`, `rightSlot`, состояние `error`, размеры `sm`/`md`/`lg`. Реализованы через `forwardRef`, совместимы с React Hook Form. Экспортирует `Input`, `SearchInput`, `InputProps`, `SearchInputProps`.

### [src/components/ui/Chip.tsx](./src/components/ui/Chip.tsx)
Client component (`"use client"`). Pill-chip для фильтров категорий и популярных запросов. Варианты `default`, `active` (accent solid), `soft` (accent-light + accent text). Размеры `sm`/`md`, проп `active` переключает вариант, проп `leftIcon` для иконки. Экспортирует `Chip`, `ChipProps`, `chipVariants`.

**Press feedback:** Chip рендерится как `<button>`, поэтому scale-эффект на `:active` применяется автоматически через глобальное правило в `globals.css` — локальные `active:scale-*` в CVA не нужны. `onClick` обёрнут через `handleClick`, который перед пользовательским коллбэком вызывает `useHaptics().selection()` — хаптик «изменения выбора», уместный для фильтр-чипов. `data-active` атрибут для CSS-селекторов.

### [src/components/ui/Card.tsx](./src/components/ui/Card.tsx)
Базовая поверхность карточки: `bg-surface-primary`, border `#E5E7EB`, `radius-lg` (16px), лёгкая тень. Пропы `noPadding`, `interactive` (hover + cursor). Подкомпоненты: `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter`. Используется для ResultCard, LunchCard, StatCard.

**Press feedback + a11y при `interactive=true`:** на корневой `<div>` проставляются `role="button"` и `tabIndex={0}` (если caller не передал свои значения через пропсы). Это делает Card доступным как кнопку и активирует глобальное правило `globals.css` `button, a, [role="button"]` → scale(0.97) на `:active`. Хаптик в самой Card НЕ вызывается — карточки обычно оборачиваются в `<Link>` снаружи, а haptics шлёт потребитель в собственном `onClick` через `useHaptics()`. Пропсы `role` и `tabIndex` можно переопределить.

**Hover-тень (Phase 7):** при `interactive=true` применяется utility `.shadow-hover` из `globals.css` — hover-тень через `::after` с `opacity` transition, вместо анти-паттерна `transition-shadow` + `hover:shadow-[...]`. Перерисовывается только зона `::after`, не вся карточка. Локальные `transition-shadow`/`hover:shadow-*` в Card удалены.

### [src/components/ui/Tabs.tsx](./src/components/ui/Tabs.tsx)
Клиентский компонент (`"use client"`). Обёртка вокруг `@radix-ui/react-tabs` со стилями в pill-style: неактивная вкладка — text-fg-secondary, активная — `bg-accent` + белый текст. Экспортирует `Tabs` (Root), `TabsList`, `TabsTrigger`, `TabsContent`.

### [src/components/ui/Badge.tsx](./src/components/ui/Badge.tsx)
Компактный статус/count индикатор. Варианты `success`, `warning`, `error`, `neutral`, `accent`, `accent-soft`. Размеры `sm`/`md`/`lg`. Опц. `dot` — маленький круглый индикатор слева. Экспортирует `Badge`, `BadgeProps`, `badgeVariants`.

### [src/components/ui/FavoriteButton.tsx](./src/components/ui/FavoriteButton.tsx)
Клиентский (`"use client"`) универсальный компонент добавления/удаления в избранное. Пропсы: `targetType` (`"restaurant"|"menu_item"|"lunch"`), `targetId`, `initialFavorited`, `isAuthenticated`, опциональный `variant` (`"icon"`, `"button"`, `"iconFloating"`), `label`/`labelActive`/`ariaLabel`/`className`. Оптимистично обновляет состояние, делает `POST /api/favorites`; на ошибку откатывается. Гостя редиректит в `/profile` через `useRouter().push()`. Используется на страницах детали ресторана (mobile и desktop), в `RestaurantMenu` на каждой позиции меню, на странице детали бизнес-ланча.

**Press feedback:** подключён `useHaptics`. Перед API-запросом (мгновенно) дёргается разный паттерн в зависимости от направления: `haptics.success()` при добавлении (next=true, «положительный» паттерн), `haptics.light()` при удалении (next=false, мягкий тап). Scale-эффект на `:active` обеспечивается глобальным правилом в `globals.css` (`button, a, [role="button"]` → `scale(0.97)`) — все три варианта (`button`/`icon`/`iconFloating`) рендерятся как обычный `<button>`, локальные `active:scale-*` не нужны.

### [src/components/ui/Skeleton.tsx](./src/components/ui/Skeleton.tsx)
Server-compatible примитив-плейсхолдер с shimmer-эффектом. Используется в `loading.tsx` на каждом тяжёлом сегменте (`search`, `map`, `restaurant/[id]`, `business-lunch`, `profile`, `favorites`) для мгновенного каркаса контента во время SSR.

Интерфейс `SkeletonProps` расширяет `Omit<React.HTMLAttributes<HTMLDivElement>, "style">` и добавляет пропсы: `width?: number | string`, `height?: number | string`, `rounded?: number | string` (переопределяет дефолтный `borderRadius` из `.skeleton`), `style?: React.CSSProperties`. Компонент рендерит `<div className={cn("skeleton", className)} style={mergedStyle} aria-hidden />`, где `mergedStyle` собирается из `width`/`height`/`rounded` + переданного `style`. Базовый класс `.skeleton` (линейный градиент + анимация `skeleton-shimmer 1.4s ease-in-out infinite`) определён в `src/app/globals.css`.

Экспорты: `Skeleton`, `SkeletonProps`. Реэкспортирован из `src/components/ui/index.ts`.

### [src/components/ui/RouteProgress.tsx](./src/components/ui/RouteProgress.tsx)
Client component (`"use client"`) — тонкая accent-полоска (2px, `fixed inset-x-0 top-0`, `z-50`, `pointer-events-none`), показывающая прогресс навигации между маршрутами. Смонтирован в `src/app/(site)/layout.tsx` как глобальный индикатор.

Механика:
- Слушает глобальное `CustomEvent('routeprogress:start')`, которое диспатчит `dispatchRouteProgressStart()` из любого клиентского потребителя навигации — обёртки над `<Link>`, `BackButton`, программные `router.push` в формах и т.п.
- Внутренняя state-машина: `idle → delayed → active → finishing → idle`.
- `PROGRESS_DELAY_MS = 120` мс — задержка перед показом, чтобы не мелькать на кеш-хитах Next.js.
- В фазе `active` запускает `requestAnimationFrame`-цикл, который постепенно поднимает прогресс до `PROGRESS_CAP = 85%` по кривой насыщения (замедление при приближении к cap).
- При смене `usePathname()` переходит в фазу `finishing`: прогресс скачком до 100%, `opacity` → 0, через 260 мс сброс в `idle`.
- Если pathname поменялся, пока state был `idle/delayed` (кеш-хит) — полоску не показывает.
- Прогресс реализован через `transform: scaleX(...)` + `origin-left` для плавности; цвет `bg-accent`.

Экспорты:
- `RouteProgress({ className? })` — основной компонент, пропс `className` опц. для переопределения z-index.
- `dispatchRouteProgressStart(): void` — helper, который может вызвать любой клиентский триггер навигации, чтобы стартовать прогресс. SSR-safe.
- `ROUTE_PROGRESS_START_EVENT: string` — имя CustomEvent (экспортируется для внешних слушателей).
- Тип `RouteProgressProps`.

### [src/components/ui/index.ts](./src/components/ui/index.ts)
Barrel-экспорт UI-kit: `Button`, `Input`, `SearchInput`, `Chip`, `Card` + подкомпоненты, `Tabs` + подкомпоненты, `Badge`, `FavoriteButton`, `Skeleton`, `RouteProgress` (+ `dispatchRouteProgressStart`, `ROUTE_PROGRESS_START_EVENT`) и все типы/CVA-фабрики. Импорт через `@/components/ui`.

### [src/components/mobile/BottomTabBar.tsx](./src/components/mobile/BottomTabBar.tsx)
Клиентский компонент (`"use client"`). Fixed-bottom навигация для mobile-варианта сайта. 6 вкладок: Поиск (`/`), Бизнес-ланч (`/business-lunch`), Карта (`/map`), Избранное (`/favorites`), Рейтинг (`/leaderboard`), Профиль (`/profile`). Иконки из lucide-react (`Search`, `UtensilsCrossed`, `Map`, `Heart`, `Trophy`, `User`). Активное состояние определяется через `usePathname()` и `matchPrefixes`. Поддержка `env(safe-area-inset-bottom)`. Активный таб — pill с `bg-accent-light` и `text-accent`.

**Route transitions + haptics + VT:**
- Использует чистый `<Link>` из `next/link`. View Transitions API включён глобально через `@view-transition { navigation: auto }` в `globals.css` — браузеры с поддержкой (Chrome/Edge/Safari) делают кросс-фейд при смене маршрута автоматически.
- В `onClick` вызывается `useHaptics().selection()` — тактильный отклик «переключения выбора», корректнее для навигационных табов, чем medium impact.
- Scale-эффект на `:active` обеспечивается глобальным правилом в `globals.css` (`button, a, [role="button"]`) — `<Link>` рендерится как `<a>`, локальные `active:scale-*` не нужны. `transition-colors` сохраняется для плавного переключения цвета активного/неактивного таба.
- `style={{ viewTransitionName: 'bottom-tab-indicator' }}` — CRITICAL: вешается ТОЛЬКО на активный таб. Браузер делает morph скользящего pill-индикатора через View Transitions API. Имя уникально на всё дерево, иначе VT API падает.

Экспорты: `BottomTabBar`, `BottomTabItem`, `BottomTabBarProps`, `DEFAULT_TABS`.

### [src/components/admin/Sidebar.tsx](./src/components/admin/Sidebar.tsx)
Клиентский компонент (`"use client"`). Боковая навигация админки: ширина 240px, фон `#0A0A0A` (`bg-surface-inverse`), sticky top-0, full-height. Лого `LH` (accent bg) + "LunchHunter" заголовок. Навигация: Дашборд (`/admin`), Рестораны (`/admin/restaurants`), Меню (`/admin/menu`), Бизнес-ланчи (`/admin/business-lunch`), Пользователи (`/admin/users`), Настройки (`/admin/settings`). Активный пункт — `bg-[rgba(255,92,0,0.12)]` + `text-accent`. Опц. `onLogout` — кнопка "Выйти" внизу с иконкой `LogOut`.

Экспорты: `AdminSidebar`, `SidebarNavItem`, `AdminSidebarProps`, `ADMIN_NAV`.

## Публичный сайт (Phase 3 — Mobile)

Все страницы mobile-варианта сайта лежат в route group `src/app/(site)`.
Shell централизован в `layout.tsx`: центрирует контент в колонке 430px и
добавляет fixed `BottomTabBar` внизу. На Phase 4 тот же route group будет
расширен десктопным split-layout через адаптивные классы.

### [src/app/(site)/layout.tsx](./src/app/(site)/layout.tsx)
Адаптивный shell публичного сайта. На mobile (<md) — колонка max-w 430px
+ fixed `BottomTabBar`, на desktop (≥md) — sticky `TopNav` 64px сверху,
полноширинный контент. Страницы внутри (site) рендерят и mobile, и desktop
варианты как siblings (`<DesktopXXX className="hidden md:flex" />`
+ `<div className="md:hidden">...mobile...</div>`), данные БД запрашиваются
один раз. Первым элементом shell смонтирован глобальный client-компонент
`<RouteProgress />` — тонкая прогресс-полоска, видимая во время pending-
навигации (слушает `CustomEvent('routeprogress:start')` и `usePathname`).
Экспортирует `SiteLayout` и `metadata`.

### [src/app/(site)/template.tsx](./src/app/(site)/template.tsx)
Client component (`"use client"`) — Next.js route template для группы `(site)`.
В отличие от `layout.tsx` шаблон ремонтируется на каждой навигации внутри
той же route group. После Phase 9 реализация сведена к минимальному
pass-through wrapper `<>{children}</>` — собственные CSS-анимации
переходов удалены. Cross-fade между маршрутами обеспечивается нативно
через `@view-transition { navigation: auto }` в
[globals.css](./src/app/globals.css): браузер делает snapshot старой
страницы, монтирует новую и кроссфейдит root между ними без участия JS.
Под `prefers-reduced-motion: reduce` браузер автоматически отключает VT
анимации (настроено в globals.css).

Экспорт: `default SiteTemplate({ children })`.

### Loading fallbacks для (site) (Phase 3 transitions)

Next.js App Router автоматически подхватывает файлы `loading.tsx` как
fallback для соответствующего route segment, пока server component
страницы ещё рендерится. В этой группе `(site)` все тяжёлые сегменты
имеют свой собственный `loading.tsx`, повторяющий финальную сетку
(та же ширина колонки, те же высоты блоков, те же количества карточек) —
чтобы при переходе `skeleton → реальный контент` не было layout-shift.
Все файлы — server components, используют примитив `<Skeleton />` из
`@/components/ui`.

#### [src/app/(site)/loading.tsx](<./src/app/(site)/loading.tsx>)
Общий fallback для всех сегментов `(site)`, если у сегмента нет своего
`loading.tsx`. Mobile — top bar placeholder (логотип + иконка) + 3 крупных
Skeleton блока 120px rounded 16. Desktop — расширенная версия с более
крупными блоками (160px rounded 20) и padding px-12. Оба варианта
выводятся одновременно через `md:hidden` / `hidden md:flex`.

#### [src/app/(site)/search/loading.tsx](<./src/app/(site)/search/loading.tsx>)
Скелет страницы /search. Mobile — header (back button + SearchHomeForm
высота 48 + filter button), filter chips row (4 pills), sort indicator,
6 карточек в колонку — каждая min-h 140px с левым контентом и
прямоугольной map-thumbnail 110px справа (повторяет `MobileSearchResults`).
Desktop — split-view: левая панель 55% (sort row + 6 результатов с
72×72 thumbnail, повторяют `DesktopSearchResults`), правая панель 45%
(серый прямоугольник вместо `MapView`).

#### [src/app/(site)/map/loading.tsx](<./src/app/(site)/map/loading.tsx>)
Скелет страницы /map (mobile-first — desktop-варианта у /map нет).
Повторяет раскладку `MobileMapView`: строка поиска сверху (SearchHomeForm
высота 48), серый прямоугольник карты в `flex-1 min-h-[55vh]` с
floating RadiusSelector pill вверху, bottom-sheet с 2 строками
ближайших результатов (border-t, rounded 12).

#### [src/app/(site)/restaurant/[id]/loading.tsx](<./src/app/(site)/restaurant/[id]/loading.tsx>)
Client component (`"use client"`) — скелет страницы ресторана, использует
`useParams()` из `next/navigation` чтобы получить URL-параметр `id` и
построить `viewTransitionName: 'restaurant-image-${id}'` на hero. Это
landing target для shared-element VT: если URL — numeric id (совпадает
с `r.id` в консьюмерах-списках), браузер делает morph между карточкой
и hero-скелетом в момент перехода. Если URL — slug, а консьюмеры
используют numeric id, имена не совпадут и VT API деградирует в root
cross-fade (приемлемо для fallback).

Mobile — hero-блок `aspect-[4/3]` со Skeleton, back button placeholder,
info блок (название + rating + адрес), заголовок «Меню», Tabs chips row
(4), 4 карточки блюд. Desktop — back button row, hero 220px c title
placeholder внизу слева, info row (rating pill + address + hours + phone),
2-колоночный layout: левая колонка меню (Tabs + 4 items), правая 420px
aside («Местоположение» 200px mini-map + 3 отзыва).

#### [src/app/(site)/business-lunch/loading.tsx](<./src/app/(site)/business-lunch/loading.tsx>)
Скелет страницы /business-lunch. Mobile — header «Бизнес-ланчи» +
filter pills row (4 chips) + sort label + 5 карточек в колонку
(rounded 2xl, border, p-4: левая колонка название/часы/курсы/rating+distance,
правая — цена + «сейчас подают» badge). Desktop — hero-баннер 260px
(серый placeholder вместо orange→amber gradient) + filter row 56px
(5 chips + sort) + grid-cols-3 × 2 rows = 6 карточек с cover 180px и
body (название + цена 28px + часы + курсы + distance/rating).

#### [src/app/(site)/profile/loading.tsx](<./src/app/(site)/profile/loading.tsx>)
Скелет страницы /profile. Avatar 80×80 rounded-full по центру + имя
(22px) + subtitle (14px) + 6 SettingRow строк (каждая — rounded-xl
border bg-surface-primary px-4 h-14, с 36×36 rounded icon placeholder
+ label + chevron 20×20) + logout button placeholder 48px. Используется
один layout и для mobile, и для desktop (в shell колонка max-w 430px).

#### [src/app/(site)/favorites/loading.tsx](<./src/app/(site)/favorites/loading.tsx>)
Скелет страницы /favorites (эмулирует состояние «с данными»; у реального
`page.tsx` есть ещё состояния guest/empty). Mobile — header (Избранное +
count subtitle) + 6 inline-карточек (rounded-2xl border: 96×96 thumb
слева + body справа с названием/категорией/адресом). Desktop —
bg-surface-secondary большой header (44px title + 18px subtitle) + одна
секция с заголовком (section title + count) и grid 2×3 = 6 карточек
(h-40 cover + body: название/rating/badge/address).

### [src/app/(site)/page.tsx](<./src/app/(site)/page.tsx>)
Home/Search. Server component. Параллельно подтягивает 4 источника:
`getNearbyRestaurants`, `getPopularQueries`, `getFeaturedBusinessLunches`,
`getMinBusinessLunchPrice`. Секции: header с логотипом LH и колокольчиком,
`SearchHomeForm` (client), горизонтальные категории-пилюли, «Популярные
запросы» (Link-chips с lucide Search), баннер «Бизнес-ланчи рядом» (accent,
3 превью-карточки), карусель «Рядом с вами» через client-компонент
`<NearbyRestaurantsRow />` (Фаза 5 — shared-element VT morph в hero
ресторана). Константы `DEFAULT_LAT/LNG = Москва`. Экспортирует
`HomePage` и массив `CATEGORIES`. PWA install-prompt не рендерится вручную —
браузер показывает нативный install-UI (иконка в адресной строке на desktop,
mini-infobar на Chromium mobile) автоматически, когда manifest + SW
удовлетворяют install-критериям.

### [src/app/(site)/login/page.tsx](<./src/app/(site)/login/page.tsx>) + [_components/LoginForm.tsx](<./src/app/(site)/login/_components/LoginForm.tsx>)
Страница `/login`. Server component: `validateSession()` → `redirect('/profile')` если уже авторизован; иначе карточка с `<LoginForm />` внутри `Suspense` (требуется для `useSearchParams`). `LoginForm` — client: `react-hook-form` + zod (`{email, password:min 6}`), `POST /api/auth/login`, при успехе `router.replace(redirect || '/profile')` + `refresh()`. Ссылка на `/register`.

### [src/app/(site)/register/page.tsx](<./src/app/(site)/register/page.tsx>) + [_components/RegisterForm.tsx](<./src/app/(site)/register/_components/RegisterForm.tsx>)
Страница `/register`. Server component: `validateSession()` → `redirect('/profile')` если авторизован; иначе карточка с `<RegisterForm />`. `RegisterForm` — client: RHF + zod (`{name:1-64, email, password:min 6}`), `POST /api/auth/register`, success → `router.replace('/profile')` + `refresh()`. Обрабатывает серверные ошибки (409 при дубликате email).

### [src/app/(site)/profile/_components/LogoutButton.tsx](<./src/app/(site)/profile/_components/LogoutButton.tsx>)
Client-кнопка выхода. `POST /api/auth/logout` → `router.replace('/')` + `router.refresh()`. Иконка `LogOut`, disabled во время запроса.

### [src/app/(site)/_components/NearbyRestaurantsRow.tsx](<./src/app/(site)/_components/NearbyRestaurantsRow.tsx>)
Client component (`"use client"`). Горизонтальный скролл-список карточек
"Рядом с вами" для мобильной главной — выделен в отдельный компонент,
чтобы изолировать client-логику shared-element morph из server-компонента
`page.tsx`. Принимает `items: NearbyRestaurantsRowItem[]`. Рендерит внутри
отдельный `NearbyRestaurantCard` на каждый элемент — каждая карточка
имеет собственный `useRef<HTMLAnchorElement>` (для Telegram FLIP fallback)
и `useRouter()`. Обёртка — чистый `<Link>` из `next/link` с вложенной
`<Card noPadding interactive>` (cover 4:3, title, rating, category,
distance, price-avg).

**Shared-element morph (Phase 3):** на `<img>` обложки карточки inline
`style={{ viewTransitionName: 'restaurant-image-${r.id}' }}`, на `<h3>`
заголовке — `restaurant-title-${r.id}`. Имена уникальны per-id — браузер
с VT API автоматически находит парный элемент на странице детали
`/restaurant/[slug]` (где `restaurant.id` из DB совпадает) через
`@view-transition { navigation: auto }` в globals.css и делает morph.
Для Telegram WebView без VT API внутри `handleClick` вызывается
`navigate(router, href, { sourceEl: linkRef.current, targetSelector:
'[data-vt-target="restaurant-image-${r.id}"]' })` — запускает
`manualFlipMorph` с клонированием source в overlay.

Экспорты: `NearbyRestaurantsRow`, `NearbyRestaurantsRowProps`,
`NearbyRestaurantsRowItem`.

### [src/app/(site)/_components/SearchHomeForm.tsx](<./src/app/(site)/_components/SearchHomeForm.tsx>)
Client component. Обёртка над `SearchInput`, по submit делает
`router.push('/search?q=...')`. Пропсы: `placeholder`, `initialQuery`.

### [src/app/(site)/search/page.tsx](<./src/app/(site)/search/page.tsx>)
Search Results List. Server component. Читает `q` и `sort` из
`searchParams`. Локальная функция `searchItems(q, sort)` — тот же pipeline
что `/api/search` (FTS5 + R*Tree + haversine), без HTTP-roundtrip. Рендерит:
шапку с `ArrowLeft`, `SearchHomeForm` (initialQuery), иконкой фильтров;
фильтр-чипсы (Link pill-кнопки) — переключают sort; индикатор «Сначала
дешёвые» и т.д.; список карточек результата (ресторан, название позиции,
рейтинг, badge расстояния, крупная accent-цена). Ссылка с карточки —
`/restaurant/[slug]?q=...` для подсветки позиции. Компонент `FilterChip` —
внутренний хелпер для активной/неактивной фильтр-пилюли. При наличии
непустого `q` и валидной сессии вызывает `recordSearchQuery(userId, q)`
из `@/lib/db/search-history`, чтобы запрос попал в
`/profile/history`.

### [src/app/(site)/map/page.tsx](<./src/app/(site)/map/page.tsx>)
Search Map. Server component. Читает `q` и `radius` из URL. Выполняет
`findNearby(q, radius)` (FTS5 MATCH + bbox через `restaurants_rtree` +
haversine refine + сортировка по расстоянию) и передаёт результат в
`MobileMapView` client wrapper вместе с центром Москвы (55.7558, 37.6173).
Сверху рендерит `SearchHomeForm`.

### [src/app/(site)/map/_components/MobileMapView.tsx](<./src/app/(site)/map/_components/MobileMapView.tsx>)
Client component (`"use client"`). Mobile fullscreen MapView wrapper.
Рендерит `MapView` (MapLibre GL) с маркерами ресторанов, кругом радиуса
и центром Москвы. Сверху floating `RadiusSelector` (size sm) — на change
делает `router.push(/map?q=...&radius=...)` через `useTransition` (показывает
индикатор «Обновление…»). Снизу bottom sheet с двумя ближайшими карточками
(border-top, surface-primary) — каждая рендерится через `MobileMapResultCard`
подкомпонент: чистый `<Link>` с собственным `linkRef` и `useRouter()`.
Маркеры кликабельны, popup содержит название ресторана, позицию, цену,
расстояние и ссылку «Открыть».

**Shared-element morph (Phase 3):** на `<Link>` карточки inline
`style={{ viewTransitionName: 'restaurant-image-${item.restaurantId}' }}`,
на названии — `restaurant-title-${item.restaurantId}`. `MobileMapItem`
требует numeric `restaurantId` — `src/app/(site)/map/page.tsx` селектит
`r.id AS restaurant_id` (отдельно от `mi.id`). Для Telegram WebView
`handleClick` вызывает `navigate(router, href, { sourceEl, targetSelector:
'[data-vt-target="restaurant-image-${item.restaurantId}"]' })`.

Экспорты: `MobileMapView`, `MobileMapItem`, `MobileMapViewProps`.

### [src/app/(site)/restaurant/page.tsx](<./src/app/(site)/restaurant/page.tsx>)
Restaurant Index. Server component, `dynamic = "force-dynamic"`. Использует
`getNearbyRestaurants({ userLat, userLng, limit: 50 })` для получения списка
опубликованных ресторанов с расчётом расстояния от Moscow center.
Двухвариантный layout: mobile (`<md`) — вертикальный список карточек
(image 96×96 + name + rating + category badge + address), desktop (`md+`) —
hero-секция «Все рестораны» + сетка `md:grid-cols-2 xl:grid-cols-4` с
полноформатными карточками (cover 160px, name, rating, category, address).
Каждая карточка ведёт на `/restaurant/{slug}`. Карточки делегированы в
client-компоненты [RestaurantIndexCards](<./src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx>),
которые используют `usePrefetchImage` для предзагрузки обложки на
`onPointerEnter`/`onPointerDown`. Используется ссылкой «Рестораны» из TopNav.

### [src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx](<./src/app/(site)/restaurant/_components/RestaurantIndexCards.tsx>)
Клиентский файл (`"use client"`) с карточками страницы /restaurant. Вынесен из
серверного `restaurant/page.tsx` чтобы можно было использовать client-only
`usePrefetchImage`. Экспорты:
- `RestaurantIndexItem` — тип `{id, slug, name, category, address, rating, coverUrl}`.
- `RestaurantIndexCardDesktop({r})` — 16:10 hero + title + rating + category badge
  + address. Hover: `group-hover` scale transform. `onPointerEnter`/`onPointerDown` →
  `prefetchImage(r.coverUrl)`.
- `RestaurantIndexCardMobile({r})` — 96×96 thumb + title/rating/category/address
  в правой колонке. Те же prefetch-обработчики.

### [src/app/(site)/favorites/page.tsx](<./src/app/(site)/favorites/page.tsx>)
Favorites. Server component, `dynamic = "force-dynamic"`. Через
`validateSession()` определяет три состояния: гость → `GuestState` (Heart
icon, CTA на /profile для Telegram login); залогинен без избранных →
`EmptyState` (CTA на /); залогинен с избранными → вызывает
`getUserFavorites(userId)` из `src/lib/db/favorites.ts` и рендерит до трёх
секций: «Рестораны», «Блюда», «Бизнес-ланчи» (каждая только если непуста).
Mobile — вертикальные карточки с photo 96×96, desktop — сеточные карточки
(`md:grid-cols-2 xl:grid-cols-4` для ресторанов, `md:grid-cols-2 xl:grid-cols-3`
для блюд и ланчей). Карточки ресторанов делегированы в
[FavoriteRestaurantCards](<./src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx>)
(client, `usePrefetchImage` на hover/pointerdown). Карточки блюд и бизнес-ланчей
обёрнуты в `PrefetchRestaurantLink` из того же файла, чтобы при hover prefetch'ить
hi-res обложку ресторана. Используется ссылкой «Избранное» из BottomTabBar.

### [src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx](<./src/app/(site)/favorites/_components/FavoriteRestaurantCards.tsx>)
Клиентский файл (`"use client"`) с карточками избранного, вынесенный из
серверного `favorites/page.tsx` чтобы можно было использовать client-only
`usePrefetchImage`. Экспорты:
- `FavoriteRestaurant` — тип `{id, slug, name, category, address, rating, coverUrl}`.
- `FavoriteRestaurantCardDesktop({r})` — 16:10 hero + title + rating + category badge
  + address. Hover: `group-hover` scale transform. `onPointerEnter`/`onPointerDown` →
  `prefetchImage(r.coverUrl)`.
- `FavoriteRestaurantCardMobile({r})` — 96×96 thumb + title/rating/category/address
  в правой колонке. Те же prefetch-обработчики.
- `PrefetchRestaurantLink({href, restaurantCoverUrl, className, children})` —
  универсальный Link wrapper, который догружает hi-res обложку ресторана на
  hover/pointerdown. Используется в secondary секциях (Блюда, Бизнес-ланчи) где
  thumbnail — не hero, но destination грузит тот же cover как hero.

### [src/app/(site)/restaurant/[id]/page.tsx](<./src/app/(site)/restaurant/[id]/page.tsx>)
Restaurant Detail. Server component. Параметр `id` может быть числовым
primary key или slug — резолвится в двух ветках. Загружает ресторан, фото,
меню-категории, позиции меню параллельно. Hero 220px (мобильный вариант)
с inline `style={{ viewTransitionName: 'restaurant-image-${restaurant.id}' }}`
и `data-vt-target="restaurant-image-${restaurant.id}"` — landing target
для shared-element View Transitions API (парный элемент к карточкам из
`NearbyRestaurantsRow`, `MobileSearchResults`, `DesktopSearchResults`,
`MobileMapView`, `DesktopPopularRestaurantsGrid`, где та же численная
`r.id` используется в VT-имени). На `<img>` hero — `width={1200}`,
`height={700}`, `fetchPriority="high"` без `loading="lazy"`
(Phase 5 — CLS-fix + LCP priority). На `<h1>` c названием — также
`viewTransitionName: 'restaurant-title-${restaurant.id}'`. `data-vt-target`
используется `manualFlipMorph` как querySelector target на устройствах
без VT API. Оверлей «назад», блок информации (название, звёзды, рейтинг,
адрес, расстояние), `Меню` заголовок + `RestaurantMenu` (client),
полноширинная кнопка «Добавить в избранное», `ReviewSection` с реальными
отзывами из БД. Server-side fetch через `getReviewsByRestaurant()` и
`getRestaurantReviewStats()`. Передаёт `highlightQuery` из `?q=`,
`reviews`, `reviewStats`, `isAdmin`. Mobile и desktop
(`DesktopRestaurantDetail`) рендерятся siblings через `md:hidden` /
`hidden md:flex` — `display: none` скрытого варианта исключает его из
снимка VT API, коллизии VT-name между mobile- и desktop-hero нет.

### [src/app/(site)/restaurant/[id]/_components/RestaurantMenu.tsx](<./src/app/(site)/restaurant/[id]/_components/RestaurantMenu.tsx>)
Client component. Использует `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`.
По умолчанию выбирает категорию, в которой есть позиция, совпадающая с
`highlightQuery`. Позиции, matching query, выделяются фоном `accent-light`,
border `accent`, accent-текстом. Экспортирует `RestaurantMenu`,
`RestaurantMenuProps`, `MenuItem`, `MenuCategory`.

### [src/app/(site)/restaurant/[id]/_components/BackButton.tsx](<./src/app/(site)/restaurant/[id]/_components/BackButton.tsx>)
Client component. Кнопка «Назад» для страницы детали ресторана. Делегирует клик на `navigateBack(router, fallbackHref)` из `@/lib/transitions` — эта функция сама проверяет `window.history.length`, reduced-motion, и оборачивает `router.back()` в `startTransition` для совместимости с `@view-transition { navigation: auto }`. Два визуальных варианта через проп `variant`: `icon` (круглая 40×40 поверх hero, absolute top-left) — используется на mobile page; `pill` (rounded-full pill с текстом) — используется в `DesktopRestaurantDetail` (back-button row). Пропсы: `variant`, `fallbackHref`, `className`, `label`, `ariaLabel`.

### [src/app/(site)/business-lunch/page.tsx](<./src/app/(site)/business-lunch/page.tsx>)
Business Lunch List. Server component. Читает `searchParams.active` и
`searchParams.maxPrice`. `loadLunches()` — raw SQL (bbox + join с
`restaurants_rtree`), затем дополняет курсы сегодняшнего дня из
`business_lunch_days`. Локальный `isServingNow()` проверяет `days_mask` +
диапазон времени. Фильтры: «Сейчас подают» + ценовые «до 350/500/700 ₽».
Сортировка по расстоянию. Карточка ланча: ресторан, время подачи, состав
(совмещённые курсы дня), рейтинг, badge расстояния, badge «Сейчас подают»,
крупная accent-цена. Хелперы `buildHref`, `FilterPill`.

### [src/app/(site)/business-lunch/[id]/page.tsx](<./src/app/(site)/business-lunch/[id]/page.tsx>)
Business Lunch Detail. Server component. Загружает lunch + restaurant +
days параллельно. Агрегирует варианты курсов по позиции (1-й курс =
объединение `weekday[*][0]` и т.д.), группирует под метками Первое/Второе/
Основное/Напиток. Hero 180px с inline `viewTransitionName:
'restaurant-image-${restaurant.id}'` и `data-vt-target="restaurant-image-
${restaurant.id}"` на `<img>` (Phase 3 — совместим с consumer'ами VT
name `r.id` в карточках ресторана; при переходе из списков ресторанов
сработает shared-element morph). На `<img>` — также `width={1200}`,
`height={700}`, `fetchPriority="high"` без `loading="lazy"`
(Phase 5 — CLS-fix + LCP priority). Оверлей «назад» + «поделиться»,
название ресторана, accent info-card (цена 38px, время, дни через
`daysMaskToLabel`, badge «Сейчас подают»), раздел «Что входит:», адрес +
расстояние, две кнопки «Маршрут»/«Забронировать». Функции
`daysMaskToLabel`, `isServingNow`, `parseCourses`.

### [src/app/(site)/profile/page.tsx](<./src/app/(site)/profile/page.tsx>)
Profile (server component, `dynamic = "force-dynamic"`). Читает текущего
пользователя через `validateSession()` из `src/lib/auth/session`. Если
`user.tgId` заполнен — показывает Telegram-имя и `@username`, аватар из
`avatarUrl` (через `next/image` с `unoptimized`), бейдж "Telegram". Если
сессии нет — гостевой placeholder с предложением войти через Telegram-бота.
Для залогиненного пользователя дополнительно читает
`getUserFavoritesCount(userId)` и `users.city` из БД, чтобы отобразить
актуальные значения в списке настроек. Список настроек — `SettingRow`-ы,
обёрнутые в `next/link` c href-ами: «Избранные заведения» → `/favorites`,
«История поиска» → `/profile/history`, «Город» → `/profile/city`,
«Уведомления» (toggle без href, client component), «О приложении» →
`/profile/about`; кнопка «Выйти» пока без onClick (API logout-user ещё не
реализован). Хелпер `getInitials(name)` для fallback-аватара.

### [src/app/(site)/profile/_components/ProfileNotificationsToggle.tsx](<./src/app/(site)/profile/_components/ProfileNotificationsToggle.tsx>)
Client component. `role=switch` toggle с accent fill когда enabled, border
fill когда disabled. Хранит состояние локально (useState). На Phase 6
подключим к user settings.

### [src/app/(site)/profile/history/page.tsx](<./src/app/(site)/profile/history/page.tsx>)
Server component, `dynamic = "force-dynamic"`. Страница «История поиска»:
читает сессию через `validateSession()` и список записей через
`getUserSearchHistory()` из `@/lib/db/search-history`. Три состояния —
guest (CTA на /profile), empty (иллюстрация + CTA «Перейти к поиску»),
filled (список записей со значком `Clock`, кликабельный Link ведёт
`/search?q=<query>`, справа `DeleteHistoryItemButton` для удаления). Над
списком — счётчик и `ClearHistoryButton` для полной очистки. Шапка с
`ArrowLeft` возвращает на `/profile`.

### [src/app/(site)/profile/history/_components/ClearHistoryButton.tsx](<./src/app/(site)/profile/history/_components/ClearHistoryButton.tsx>)
Client component. Кнопка «Очистить всё» с `window.confirm`; при
подтверждении шлёт `DELETE /api/profile/search-history` и вызывает
`router.refresh()` для перерисовки server component.

### [src/app/(site)/profile/history/_components/DeleteHistoryItemButton.tsx](<./src/app/(site)/profile/history/_components/DeleteHistoryItemButton.tsx>)
Client component. Маленькая кнопка-крестик справа от каждой записи
истории; шлёт `DELETE /api/profile/search-history/[id]` и обновляет
страницу через `router.refresh()`.

### [src/app/(site)/profile/city/page.tsx](<./src/app/(site)/profile/city/page.tsx>)
Server component, `dynamic = "force-dynamic"`. Страница выбора города.
Читает `users.city` текущего пользователя из БД и рендерит клиентский
`CityPicker` со списком `AVAILABLE_CITIES` из `@/lib/cities`. Для гостя —
информационный блок, что без авторизации сохранение недоступно.

### [src/app/(site)/profile/city/_components/CityPicker.tsx](<./src/app/(site)/profile/city/_components/CityPicker.tsx>)
Client component. Список городов с оптимистичным выделением. При выборе
шлёт `POST /api/profile/city` с JSON `{ city }`, при ошибке откатывает
выбор и показывает inline-ошибку. Ре-экспортирует `AVAILABLE_CITIES`
из `@/lib/cities` для удобства.

### [src/app/(site)/profile/about/page.tsx](<./src/app/(site)/profile/about/page.tsx>)
Server component, `dynamic = "force-static"`. Статическая страница «О
приложении»: логотип, название, версия (`APP_VERSION`), описание
проекта, блок «Технологии» (Next.js 15 / React 19 / TypeScript / Tailwind
/ Drizzle / SQLite) и список внешних ссылок через вспомогательный
`AboutRow` — «Связаться с нами» (mailto) и «Исходный код» (github).

### [src/app/(site)/profile/receipts/page.tsx](<./src/app/(site)/profile/receipts/page.tsx>)
Server component, `dynamic = "force-dynamic"`. Страница «Мои чеки» (`/profile/receipts`): проверяет авторизацию через `validateSession()`, загружает чеки пользователя через `getUserReceipts()`. Содержит: `ReceiptUpload` (форма загрузки), `ReceiptStats` (полная статистика), список чеков (заведение, дата, количество позиций, сумма). Пустое состояние при отсутствии чеков, гостевое состояние с CTA. Шапка с `ArrowLeft` возвращает на `/profile`.

### [src/app/(site)/profile/_components/ReceiptUpload.tsx](<./src/app/(site)/profile/_components/ReceiptUpload.tsx>)
Client component. Форма загрузки чека: `input[type=file]` с `accept="image/*"` и `capture="environment"` (камера). Превью загруженного фото, POST на `/api/receipts`. После успешной загрузки показывает превью OCR результата: позиции, сумма, дата, заведение. Props: `onSuccess` (колбэк обновления списка). Состояния: idle (dropzone), preview (фото + кнопка загрузки), loading (spinner), success (OCR результат), error (inline сообщение).

### [src/app/(site)/profile/_components/ReceiptStats.tsx](<./src/app/(site)/profile/_components/ReceiptStats.tsx>)
Client component. Мини-статистика чеков пользователя. Загружает данные из `/api/receipts/stats`. Два режима: `compact` (для страницы профиля — потрачено + визитов в одну строку) и full (для страницы чеков — grid карточки + breakdown по категориям с progress bars). Использует `CATEGORY_LABELS` из `receipt-categories.ts`. Состояния: loading, empty, data.

### [src/app/(site)/leaderboard/page.tsx](<./src/app/(site)/leaderboard/page.tsx>)
Server component, `dynamic = "force-dynamic"`. Страница лидерборда (`/leaderboard`): проверяет авторизацию через `validateSession()`. Гости — CTA на вход с иконкой Trophy. Авторизованные — `LeaderboardTable`. Шапка с `ArrowLeft` возвращает на `/profile`.

### [src/app/(site)/leaderboard/_components/LeaderboardTable.tsx](<./src/app/(site)/leaderboard/_components/LeaderboardTable.tsx>)
Client component. Табы категорий (total, beer, wine, cocktail, food, coffee, tips). Таблица рангов: позиция (иконки Crown/Medal для топ-3), аватар, имя, сумма. Процентиль текущего пользователя с progress bar внизу. Данные из `/api/leaderboard?category=X`. Состояния: loading, error, empty, data.

### [src/app/api/profile/city/route.ts](<./src/app/api/profile/city/route.ts>)
POST endpoint. Требует сессию (`validateSession()`), валидирует `city` по
`AVAILABLE_CITIES` и обновляет `users.city` через Drizzle. Отвечает
`{ ok: true, city }` при успехе, 401/400 при ошибках.

### [src/app/api/profile/search-history/route.ts](<./src/app/api/profile/search-history/route.ts>)
DELETE endpoint. Очищает всю историю поиска залогиненного пользователя
через `clearUserSearchHistory()`.

### [src/app/api/profile/search-history/[id]/route.ts](<./src/app/api/profile/search-history/[id]/route.ts>)
DELETE endpoint. Удаляет одну запись истории по id через
`deleteSearchHistoryEntry()`, проверяя принадлежность пользователю на
уровне WHERE-клаузы.

### [src/lib/db/search-history.ts](<./src/lib/db/search-history.ts>)
Server-side helpers для таблицы `search_history`. Экспортирует
`SearchHistoryEntry` (DTO), `recordSearchQuery(userId, query)` — дедупит
против 5 последних записей и подрезает историю до 50 записей на
пользователя, `getUserSearchHistory(userId, limit?)` — свежие сверху,
`deleteSearchHistoryEntry(userId, id)` и `clearUserSearchHistory(userId)`.

### [src/lib/cities.ts](<./src/lib/cities.ts>)
Экспорт `AVAILABLE_CITIES` — список поддерживаемых городов для профиля
пользователя. Используется `CityPicker`-ом и API `/api/profile/city`
для валидации входа.

## Desktop компоненты (Phase 4)

Desktop-вариант сайта построен как набор desktop-only компонентов,
рендерящихся параллельно mobile-варианту внутри одной страницы и скрываемых
через `md:hidden` / `hidden md:flex`. Это позволяет переиспользовать server-
загрузку данных и избежать дублирования запросов в БД.

### [src/components/desktop/TopNav.tsx](./src/components/desktop/TopNav.tsx)
Client component (`"use client"`). Верхняя десктопная навигация, видна при
≥md. Высота 64px, `justify-between`, padding 32–48px по бокам, border-bottom
`border-light`. Слева — логотип (иконка `utensils` accent 24px + текст
"LunchHunter" 20/700), в центре — nav-ссылки (Поиск, Бизнес-ланчи, Карта,
Рестораны — 15/500, активная подсвечивается accent), справа — круглая
аватарка 36×36 accent с инициалами. Активность ссылок определяется через
`usePathname()` + `matchPrefixes`.

Экспорты: `TopNav`, `TopNavLink`, `TopNavProps`, `DEFAULT_TOPNAV_LINKS`.

### [src/components/desktop/FeatureCard.tsx](./src/components/desktop/FeatureCard.tsx)
Server component. Feature-карточка для секции под hero на Home desktop.
`surface-secondary` bg, radius-lg (24px), padding 28, flex-col gap 16.
Принимает `icon: LucideIcon`, `title`, `description`. Иконка в `accent-light`
квадрате 48×48, заголовок 18/600, описание 14/normal (fg-secondary,
line-height 1.5).

### [src/app/(site)/_components/DesktopHome.tsx](<./src/app/(site)/_components/DesktopHome.tsx>)
Server component. Desktop-вариант Home/Search (pencil frame Yi1h9 аналог).
Разделы: Hero (gradient accent-light→white фон, `relative overflow-hidden`,
слой декоративных `HeroFloatingCards` с наклонёнными карточками реальных
ресторанов, radial-gradient оверлей для читаемости, поверх — заголовок
48/700, подзаголовок 18, 640px SearchHomeForm), row из 3 `FeatureCard`
("Самое дешёвое"/"Ближе всего"/"Лучший рейтинг"), секция "Популярные
рестораны" через client-компонент `<DesktopPopularRestaurantsGrid />`
(Фаза 5 — shared-element VT morph в hero ресторана). Принимает
`popularRestaurants`, `heroMenuItems`, `heroLunches` props с типами
`DesktopHomeRestaurant[]` / `DesktopHomeHeroMenuItem[]` /
`DesktopHomeHeroLunch[]`.

### [src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx](<./src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx>)
Client component (`"use client"`). Десктопная сетка 4 карточек "Популярные
рестораны" для `DesktopHome`. Структура — `grid grid-cols-4 gap-5`, каждая
карточка рендерится через подкомпонент `DesktopPopularRestaurantCard`
(`useRef<HTMLAnchorElement>` + `useRouter()`) как чистый `<Link>` из
`next/link`: `rounded-2xl border border-border-light bg-surface-primary
shadow-sm`, h-40 cover (object-cover, `group-hover:scale-[1.02]`), body
p-4 flex-col gap-2 (title 16/600, Star + rating + category, accent
distance). Hover: `shadow-md`.

**Shared-element morph (Phase 3):** на `<img>` обложки inline
`style={{ viewTransitionName: 'restaurant-image-${r.id}' }}`, на `<h3>` —
`restaurant-title-${r.id}`. `handleClick` проверяет
`supportsViewTransitions()` — на Chrome/Safari просто возвращается
(браузер сам морфит через `navigation: auto`). На Telegram Mini App
вызывает `navigate(router, href, { sourceEl: linkRef.current,
targetSelector: '[data-vt-target="restaurant-image-${r.id}"]' })` для
FLIP fallback. Изоляция client-логики в этом подкомпоненте позволяет
`DesktopHome` оставаться server-компонентом.

Экспорты: `DesktopPopularRestaurantsGrid`,
`DesktopPopularRestaurantsGridProps`, `DesktopPopularRestaurantsGridItem`.

### [src/app/(site)/_components/HeroFloatingCards.tsx](<./src/app/(site)/_components/HeroFloatingCards.tsx>)
Server component. Декоративный фон hero главной страницы (desktop):
рендерит 6 наклонённых карточек четырёх типов (`CardKind`), расположенных
абсолютно по периметру hero-секции, каждая — с одноразовой hero-enter
анимацией на mount (без бесконечной float-анимации).

Типы карточек (выделены в мини-компоненты):
- `RestaurantCard` — обложка ресторана + имя + рейтинг (звезда) + категория.
  Принимает `size: { w, h }` для `width`/`height` атрибутов на `<img>`
  (CLS-fix Phase 5). Изображение получает `width={size.w}`,
  `height={Math.round(size.h * 0.65)}`, `loading="lazy"`.
- `MenuCard` — фото блюда + название + цена accent + имя ресторана.
  Аналогично принимает `size` и выставляет `width={size.w}`,
  `height={Math.round(size.h * 0.62)}`, `loading="lazy"` на `<img>`.
- `LunchCard` — accent-заголовок «Бизнес-ланч» с пульсирующей точкой +
  название сета + ресторан + «от X ₽» + время подачи (иконка `Clock`).
- `MapCard` — декоративный SVG-кусок карты (кварталы, улицы, вода,
  подсвеченный пунктирный маршрут) + пин MapPin с `animate-ping`
  радиальным пульсом + подпись «Рядом с тобой · 12 мест в радиусе 500 м».
  Чистый SVG без MapLibre.

Конфиг `SLOTS` задаёт для каждого слота `kind`, позицию, угол наклона
(`tilt` — применяется inline как `transform: rotate(...)` на внешнем
контейнере), размер и breakpoint видимости (`hideBelow: "lg" | "xl"`).
Счётчики `counters: Record<CardKind, number>` обеспечивают использование
разных элементов данных для однотипных слотов.

Рендер: внешний `<div>` задаёт абсолютную позицию, размер и
`transform: rotate(tilt)` статично. Внутренний `<div>` с
`CARD_SHELL_INNER` (фон, рамка, overflow-hidden) несёт класс
`animate-hero-enter` с inline `animationDelay: ${i * 80}ms` для stagger —
карточки появляются одна за другой с fade-in + translateY + scale.
Анимации определены в `src/app/globals.css` (`@keyframes hero-enter` +
`--animate-hero-enter` утилита). `prefers-reduced-motion` респектится
глобально через `@media` правила.

Props: `restaurants: DesktopHomeRestaurant[]`,
`menuItems?: DesktopHomeHeroMenuItem[]`,
`lunches?: DesktopHomeHeroLunch[]`. Если данных нет — используются
дефолтные плейсхолдеры в самих карточках и градиентные фоллбеки. Контейнер
`aria-hidden` + `pointer-events-none` — чисто декоративный слой.

### [src/app/(site)/search/_components/DesktopSearchResults.tsx](<./src/app/(site)/search/_components/DesktopSearchResults.tsx>)
Client component (`"use client"`). Desktop split-view для страницы поиска
(pencil frame pqZ50). Левая колонка (55%, max 790px): sort-row (Link-pills
Цена / Расстояние / Рейтинг + счётчик результатов), список карточек
результата — каждая через подкомпонент `SearchResultCard` (чистый `<Link>`
с `linkRef` + `useRouter()`), `surface-secondary`, 72×72 accent-light
thumbnail с иконкой `utensils`, flex-col info с ценой accent. Hover
карточки выставляет `activeMarkerId` и подсвечивает её ring-2 ring-accent
(hover-sync с маркером карты). Правая колонка (45%): `MapView` (MapLibre
GL + OSM) с центром Москвы, маркерами `filteredResults`, кругом радиуса.
Floating `RadiusSelector` (size sm) в верхнем-левом углу — controlled
через `useState`, фильтрует результаты client-side (`distanceMeters <=
radius`). Маркеры кликабельны, popup содержит название/позицию/цену/
расстояние/ссылку «Открыть». `onMarkerClick` синхронизирует
`activeMarkerId`.

**Shared-element morph (Phase 3):** на 72×72 thumbnail `<div>` inline
`style={{ viewTransitionName: 'restaurant-image-${r.restaurantId}' }}`,
на `<h3>` названии ресторана — `restaurant-title-${r.restaurantId}`.
Используется `r.restaurantId` (не `itemId`), чтобы несколько результатов
одного ресторана не ломали уникальность имён. В `handleClick`
проверяется `supportsViewTransitions()` — на Chrome/Safari браузер сам
морфит через `navigation: auto`. На Telegram Mini App → `navigate(router,
href, { sourceEl: linkRef.current, targetSelector:
'[data-vt-target="restaurant-image-${r.restaurantId}"]' })`.

Экспорты: `DesktopSearchResults`, `DesktopSearchResultsProps`, `DesktopSort`.

### [src/app/(site)/search/_components/MobileSearchResults.tsx](<./src/app/(site)/search/_components/MobileSearchResults.tsx>)
Client component (`"use client"`). Мобильный список результатов поиска с
миниатюрой карты в правой части каждой карточки. Внутри файла два
компонента: экспортный `MobileSearchResults` (список + модальное окно) и
приватный `MapThumbnail` (лёгкая превью-карта без maplibre-gl).

`MobileSearchResults({ query, results })` рендерит колонку карточек
через `MobileSearchResultCard` подкомпонент. Каждая карточка: внешний
`<div>` (cardRef, имеет `viewTransitionName` — морфится весь визуальный
прямоугольник, включая MapThumbnail), внутри — абсолютно-позиционированная
кнопка `MapThumbnail` справа (ширина 340px), и чистый `<Link>` (linkRef)
поверх с `right-[110px]`, ведущий на `/restaurant/[slug]?q=`. Над списком —
модальное окно (`fixed inset-0 z-50 bg-black/50`), которое открывается
установкой `selected` (состояние `useState<SearchResultItem | null>`).
Закрытие: клик по backdrop (`onClick={close}`), кнопка `X` справа вверху,
клавиша `Escape` (effect подписывается на `keydown` и выставляет
`document.body.style.overflow = "hidden"` пока открыто). Карта внутри
модалки — реальный `MapView` (MapLibre) с одним маркером, центрированным
на выбранной точке (zoom 16), плюс header (название ресторана + адрес +
close X) сверху.

**Shared-element morph (Phase 3):** на внешнем `cardRef` div inline
`style={{ viewTransitionName: 'restaurant-image-${r.restaurantId}' }}`
(атрибут стоит на ВНЕШНЕМ контейнере, не на Link — это только левая
абсолютная зона, а морфить должен весь визуальный прямоугольник). На
названии блюда inside Link — `restaurant-title-${r.restaurantId}`.
`handleClick` проверяет `supportsViewTransitions()` → на Telegram вызывает
`navigate(router, href, { sourceEl: cardRef.current, targetSelector:
'[data-vt-target="restaurant-image-${r.restaurantId}"]' })`. `sourceEl`
— `cardRef` (не `linkRef`), чтобы FLIP клонировал полный прямоугольник.

`MapThumbnail({ lat, lng, onOpen })` — превью 170×full-height. Считает
worldPx на zoom 15 по формуле Web Mercator, определяет набор тайлов
(`tileX0..tileX1 × tileY0..tileY1`), покрывающих видимую область, и
рендерит их как `<img loading="lazy">` из
`https://tile.openstreetmap.org/{z}/{x}/{y}.png`, абсолютно позиционируя
каждый по `(tx*256-x0, ty*256-y0)`. По центру — оранжевый accent-dot
(16px, 3px white border). Бесшовный переход в левую часть карточки:
два декоративных слоя (`pointer-events-none`) — (1) `backdrop-filter:
blur(6px)` с линейной mask-image от чёрного к прозрачному; (2) белый
linear-gradient от `--color-surface-primary` до прозрачного на всю
ширину кнопки. По клику вызывает `e.preventDefault()` + `stopPropagation`,
чтобы не триггерить внешний `Link`, и `onOpen()`.

Экспорты: `MobileSearchResults`.

### [src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx](<./src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx>)
Server component. Desktop-вариант страницы ресторана (pencil frame Yi1h9 —
Desktop Restaurant Detail). Структура: back-button row, hero 220px с
inline `style={{ viewTransitionName: 'restaurant-image-${restaurantId}' }}`
и `data-vt-target="restaurant-image-${restaurantId}"` на `<img>` (Phase 3
— landing target для shared-element morph из `DesktopPopularRestaurantsGrid`
и `DesktopSearchResults`, использующих то же имя с `r.id`). На `<img>` —
также `width={1200}`, `height={700}`, `fetchPriority="high"` без
`loading="lazy"` (Phase 5 — CLS-fix + LCP priority). На `<h1>` с
названием ресторана — `viewTransitionName: 'restaurant-title-${restaurantId}'`.
Фото и gradient-overlay + название и категория поверх снизу-слева, info-row
(accent rating badge pill + адрес + часы + телефон, lucide icons),
двух-колоночный layout (flex-1 меню с `RestaurantMenu` tabs + aside 420px:
"Местоположение" с мини-картой `MapView` 200px (MapLibre GL + OSM, zoom 15,
один маркер ресторана), `ReviewSection` — реальные отзывы из БД).
Принимает `lat`/`lng`, `reviews`, `reviewStats`, `isAdmin`.

Экспорты: `DesktopRestaurantDetail`, `DesktopRestaurantDetailProps`.

### [src/app/(site)/restaurant/[id]/_components/ReviewCard.tsx](<./src/app/(site)/restaurant/[id]/_components/ReviewCard.tsx>)
Client component. Карточка отзыва: автор (аватар/инициалы, имя), звёздный
рейтинг 1-5, текст, бейдж "Чек подтверждён" (emerald, CheckCircle), дата и
сумма чека. Раскрывающийся список позиций чека (receiptItemsJson). Кнопка
"Посмотреть чек" видна только при `isAdmin` — загружает фото через
`/api/reviews/:id/receipt-image` и показывает в модалке.

Экспорты: `ReviewCard`, `ReviewCardProps`.

### [src/app/(site)/restaurant/[id]/_components/ReviewForm.tsx](<./src/app/(site)/restaurant/[id]/_components/ReviewForm.tsx>)
Client component. Форма создания отзыва: file input (`accept="image/*"`,
`capture="environment"`) с превью, интерактивный звёздный рейтинг 1-5,
textarea. POST на `/api/reviews` (multipart/form-data). Стейты:
idle/loading/error/success. Обрабатывает ошибки 401/422/400. После успеха
очищает форму и вызывает `onSuccess`.

Экспорты: `ReviewForm`.

### [src/app/(site)/restaurant/[id]/_components/ReviewSection.tsx](<./src/app/(site)/restaurant/[id]/_components/ReviewSection.tsx>)
Client component. Секция отзывов: заголовок со средним рейтингом и кол-вом,
список `ReviewCard`, кнопка "Оставить отзыв" (показывает `ReviewForm`),
пустое состояние при отсутствии отзывов.

Экспорты: `ReviewSection`, `ReviewSectionProps`.

### [src/app/(site)/business-lunch/_components/DesktopBusinessLunch.tsx](<./src/app/(site)/business-lunch/_components/DesktopBusinessLunch.tsx>)
Server component. Desktop-вариант страницы бизнес-ланчей (pencil frame
vjtMh). Hero 260px с linear-gradient 180° orange→amber (#FF5C00→#FF8C00→
#FFA500), заголовок 40/700 белым, 640px search-bar. Filter row 56px:
success-outlined "Сейчас подают" toggle, price-pills (до 350/500/700 ₽),
"Все", sort-label. Grid 3×n карточек-Bento: фото 180px вверху с success-
badge "Сейчас подают" поверх, body с названием 16/700, ценой 28/700 accent,
временем подачи, списком курсов, footer (расстояние + рейтинг) отделённый
границей. Принимает `lunches`, `activeOnly`, `maxPrice`.

Экспорты: `DesktopBusinessLunch`, `DesktopBusinessLunchProps`,
`DesktopBusinessLunchItem`.

## Map компоненты (Phase 5)

Реализация карты построена на `maplibre-gl` v5 + бесплатных OSM raster
tiles (`https://{a,b,c}.tile.openstreetmap.org/{z}/{x}/{y}.png` с обязательным
attribution «© OpenStreetMap contributors»). Все обёртки лежат в
`src/components/map/` и переиспользуются на mobile/desktop.

### [src/components/map/MapView.tsx](./src/components/map/MapView.tsx)
SSR-safe wrapper. Через `next/dynamic({ ssr: false })` ленизо-загружает
`MapViewClient` (MapLibre GL обращается к `window` на module-level, поэтому
прямой импорт ломал бы SSR в Next.js App Router). Loading-state — анимированный
skeleton `surface-secondary`. Экспорты: дефолт `MapView`, named `MapView`,
тип-реэкспорты `MapViewProps`, `MapMarker`. Все потребители должны
импортировать только из этого файла, никогда напрямую из `MapViewClient`.

### [src/components/map/MapViewClient.tsx](./src/components/map/MapViewClient.tsx)
Client component (`"use client"`). Сама обёртка над `maplibregl.Map`.
Импортирует `maplibre-gl/dist/maplibre-gl.css`. Стиль карты — inline
`StyleSpecification` с одним raster-source «osm» (3 поддомена a/b/c для
параллельной загрузки тайлов) и одним raster-layer.

Props (`MapViewClientProps`): `markers: MapMarker[]`, `center?: {lat,lng}`
(default Москва 55.7558, 37.6173), `zoom?: number` (default 13),
`radiusMeters?: number | null`, `onMarkerClick?: (id) => void`, `className?`,
`style?`. Тип `MapMarker`: `{ id, lat, lng, label, position?, price?,
distanceMeters?, href? }`.

Lifecycle:
- Один `useEffect` инициализирует карту и `NavigationControl` (без compass),
  добавляет источник `radius-circle` (geojson) с двумя слоями: fill
  (`#FF5C001A`) и outline (`#FF5C00`, opacity 0.7). На unmount удаляет
  маркеры и `map.remove()`.
- Второй `useEffect` обновляет center/zoom через `jumpTo` при изменении props.
- Третий синхронизирует круг радиуса. Хелпер `buildCirclePolygon(lat, lng,
  radius, steps=64)` строит approximated geodesic polygon (формула
  destination point), записывает в источник через `setData`.
- Четвёртый ресинхронизирует HTML-маркеры: создаёт `<button>` 22×22 с
  background `#FF5C00`, белым 3px border и box-shadow, добавляет
  `maplibregl.Marker` с popup (HTML собран через `buildPopupHtml` —
  XSS-safe через `escapeHtml`), вешает click → `onMarkerClick`.

Хелперы: `buildCirclePolygon`, `escapeHtml`, `buildPopupHtml` (рендерит
название/позицию/цену/расстояние/ссылку «Открыть»).

### [src/components/map/RadiusSelector.tsx](./src/components/map/RadiusSelector.tsx)
Client component (`"use client"`). Pill-shaped segmented selector для
выбора радиуса поиска. Controlled (`value: number`, `onChange:
(meters) => void`). Опции по умолчанию — 500/1000/3000/5000м (`label`
"500м"/"1км"/"3км"/"5км"), можно переопределить через `options`. Размер
`size`: `"md"` (h-9, mobile) или `"sm"` (h-7, desktop floating overlay).
Активная пилюля — `bg-accent text-white`, неактивные — surface-primary
с border. `role="radiogroup"`, `role="radio"`, `aria-checked` для a11y.

**Press feedback:** каждый pill — это `<button>`, поэтому scale-эффект на `:active` применяется автоматически через глобальное правило в `globals.css`. Логика через `handleSelect(meters)`: `useHaptics().selection()` вызывается только если `meters !== value` (не при тапе на уже активный pill, чтобы не спамить хаптиком), затем `onChange(meters)`.

Экспорты: `RadiusSelector`, `RadiusOption`, `RadiusSelectorProps`,
`DEFAULT_RADIUS_OPTIONS`.

## API routes (Phase 3)

### [src/app/api/search/route.ts](./src/app/api/search/route.ts)
`GET /api/search`. Параметры `q` (обяз.), `lat`, `lng`, `radius` (default
3000), `sort` (`cheapest`|`nearest`|`rating`, default `cheapest`), `limit`
(default 50, max 200). Пайплайн: `buildFtsMatchQuery` экранирует токены и
оборачивает их как `"token"*` (prefix-search, защита от инъекций синтаксиса
FTS5), JOIN `menu_items` + `restaurants`, опциональный bbox через
`restaurants_rtree`, точная фильтрация `haversineDistance`, сортировка в JS.
Экспортирует `GET`, интерфейсы `SearchResultItem`, `SearchResponse`.

### [src/app/api/restaurants/[id]/route.ts](<./src/app/api/restaurants/[id]/route.ts>)
`GET /api/restaurants/[id]`. Путь-параметр `id` — числовой PK или slug.
Возвращает DTO: ресторан + tags (parsed JSON) + photos (ordered) + menu
(сгруппированное по категориям, внутри — только `status='active'`).
Позиции без категории попадают в pseudo-раздел «Прочее» (id=-1). 404 при
отсутствии. Экспортирует `GET` и DTO-интерфейсы.

### [src/app/api/business-lunch/route.ts](./src/app/api/business-lunch/route.ts)
`GET /api/business-lunch`. Параметры: `lat`, `lng`, `radius` (default 5000),
`active=true` (только ланчи, подающиеся сейчас), `maxPrice`, `sort`
(`nearest`|`cheapest`, default `nearest`), `limit`. Пайплайн: raw SQL с
bbox через `restaurants_rtree`, batch-load курсов дня через
`business_lunch_days WHERE weekday = ?`, вычисление `isServingNow` по
`days_mask` и `time_from/time_to`, фильтры, сортировка. Экспортирует `GET`
и `BusinessLunchDto`, `BusinessLunchResponse`.

### [src/app/api/dev-sw/route.ts](./src/app/api/dev-sw/route.ts)
Stub-обработчик для `/dev-sw.js`. Маппинг `source: "/dev-sw.js" →
destination: "/api/dev-sw"` сделан через `rewrites()` в `next.config.ts`
(Next.js не разрешает точку в имени route-сегмента). Возвращает минимальный
service worker с правильным `Content-Type: application/javascript`,
который при активации вызывает `self.registration.unregister()` и
форсирует reload клиентов. Нужно для старых PWA-клиентов от предыдущих
installs, которые в dev-режиме (serwist disabled) спамят 404 на
`/dev-sw.js`. Экспорт: `GET`.

## Дополнительные lib-утилиты

### [src/lib/db/queries.ts](./src/lib/db/queries.ts)
High-level запросы для server components:
- `getNearbyRestaurants({ userLat?, userLng?, limit? })` — published
  рестораны с опц. расчётом и сортировкой по расстоянию.
- `getPopularQueries(limit)` — top первых слов из названий menu_items
  (MVP, до появления `search_history`-счётчика).
- `getFeaturedBusinessLunches(limit)` — 3 ланча с самыми низкими ценами
  для баннера Home.
- `getFeaturedMenuItems(limit)` — активные позиции меню с фото, ценой и
  названием ресторана (JOIN menu_items ↔ restaurants). Используется для
  декоративных hero-карточек на главной. Возвращает `FeaturedMenuItem[]`.
- `getMinBusinessLunchPrice()` — SQL `MIN(price)` по активным ланчам.
- `getBusinessLunchTodayCourses(lunchId, weekday)` — курсы дня.
- Вспомогательный `parseTags(json)` — безопасно парсит
  `restaurants.tagsJson`.

### [src/lib/utils/format.ts](./src/lib/utils/format.ts)
UI-форматтеры: `formatPrice(n)` → `"450 ₽"`, `formatDistance(meters)` →
`"250м"`/`"1,2км"`/`"5км"`, `formatRating(rating)` → `"4.6"` или `"—"`.

## Админ-панель (Phase 6)

### Аутентификация и сессии

#### [src/lib/auth/password.ts](./src/lib/auth/password.ts)
Хеширование паролей через `@node-rs/argon2` (argon2id). Параметры:
`memoryCost=19456`, `timeCost=2`, `parallelism=1`, `outputLen=32`.
Экспорты: `hashPassword(plain)` и `verifyPassword(hash, plain)`.

#### [src/lib/auth/session.ts](./src/lib/auth/session.ts)
Лёгкая замена Lucia: сессии записываются в таблицу `sessions` (id, userId,
expiresAt), cookie `lh_session` httpOnly/SameSite=Lax/secure (в prod),
срок 7 дней, авто-продление при <50% остатке.

Экспорты:
- `SESSION_COOKIE_NAME`
- `createSession(userId)` — вставляет строку и возвращает `SessionRow`.
- `setSessionCookie(id, expiresAt)` / `clearSessionCookie()`.
- `deleteSession(id)`.
- `validateSession(): Promise<ValidateResult | null>` — читает cookie,
  join с `users`, удаляет expired, продлевает при необходимости. В
  `SessionUser` возвращает также `tgId`, `tgUsername`, `avatarUrl` для
  рендера Telegram-аккаунта в профиле.
- `requireAdmin()` — как `validateSession`, но возвращает `null` если
  `user.role !== 'admin'`.

Типы: `SessionUser`, `SessionRow`, `ValidateResult`.

#### [src/lib/auth/telegram.ts](./src/lib/auth/telegram.ts)
Верификация initData от Telegram Mini App (Phase 9). Функция
`verifyInitData(initDataRaw, botToken): TelegramUser | null` реализует
алгоритм из официальной документации
(core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
парсит query-string, извлекает `hash`, собирает `data_check_string` из
отсортированных пар, считает `secret_key = HMAC-SHA256("WebAppData",
botToken)` и `computed_hash = HMAC-SHA256(secret_key, dataCheckString)`.
Сравнение через `timingSafeEqual`. Дополнительно проверяет `auth_date`
(не старше 24 часов) и парсит поле `user` как JSON, возвращая
нормализованный объект `TelegramUser` (`id`, `first_name`, `last_name?`,
`username?`, `photo_url?`, `language_code?`, `is_premium?`,
`allows_write_to_pm?`). Использует только `node:crypto`, без внешних
зависимостей. Тип `TelegramUser` экспортируется.

### [src/app/api/favorites/route.ts](./src/app/api/favorites/route.ts)
Публичный API избранного.
- `POST /api/favorites` — body `{targetType: "restaurant"|"menu_item"|"lunch", targetId: number}` (Zod через enum `FAVORITE_TARGET_TYPES`). Требует активной сессии (cookie `lh_session`), иначе 401. Вызывает `toggleFavorite()` и возвращает `{favorited: boolean}`.
- `GET /api/favorites?targetType=...&targetId=...` — проверка состояния одного элемента для клиента. Для гостей всегда `{favorited: false}`.

### Admin API routes

#### [src/app/api/auth/telegram/route.ts](<./src/app/api/auth/telegram/route.ts>)
`POST /api/auth/telegram` (Phase 9). Body `{initData: string}` (Zod).
Читает `TELEGRAM_BOT_TOKEN` из `process.env`, валидирует подпись через
`verifyInitData()`. При валидной подписи делает upsert в `users` по
`tg_id`: если пользователь существует — обновляет `name`, `tgUsername`,
`avatarUrl`; иначе вставляет нового (`id = randomUUID()`, `role='user'`).
Создаёт сессию через `createSession()` и ставит httpOnly cookie через
`setSessionCookie()`. Возвращает `{ok: true, user: {id, tgId, name,
username, avatarUrl}}`. Ошибки: 400 невалидное body, 401 невалидный/
просроченный initData, 500 если токен бота не задан.

#### [src/app/api/auth/register/route.ts](<./src/app/api/auth/register/route.ts>)
`POST /api/auth/register`. Body `{email, password, name}` (Zod: email, min 6, 1-64). Нормализует email (trim+lowercase), проверяет уникальность (409), хэширует argon2id через `hashPassword`, инсертит `users` с `id=randomUUID()`, `role='user'`, создаёт сессию и ставит httpOnly cookie.

#### [src/app/api/auth/login/route.ts](<./src/app/api/auth/login/route.ts>)
`POST /api/auth/login`. Body `{email, password}` (Zod). End-user login (в отличие от admin-версии не требует `role='admin'`): lookup по email, `verifyPassword`, `createSession` + cookie. 401 при несовпадении.

#### [src/app/api/auth/logout/route.ts](<./src/app/api/auth/logout/route.ts>)
`POST /api/auth/logout`. Читает `lh_session`, удаляет сессию из БД (`deleteSession`), очищает cookie. Всегда `{ok:true}`.

#### [src/app/api/admin/auth/login/route.ts](<./src/app/api/admin/auth/login/route.ts>)
`POST /api/admin/auth/login`. Body `{email, password}` (Zod). Ищет
пользователя, проверяет argon2-hash, требует `role='admin'`, создаёт
сессию и устанавливает httpOnly cookie. Ошибки: 400/401/403.

#### [src/app/api/admin/auth/logout/route.ts](<./src/app/api/admin/auth/logout/route.ts>)
`POST /api/admin/auth/logout`. Удаляет текущую сессию (если есть) и
очищает cookie.

#### [src/app/api/admin/restaurants/route.ts](<./src/app/api/admin/restaurants/route.ts>)
`POST /api/admin/restaurants`. Требует `requireAdmin()`. Zod-валидация
полей (name, slug, category, address, lat, lng, phone?, website?,
description?, priceAvg?, coverUrl?, hoursJson?, status, tagsJson?).
Вставляет в `restaurants`; R*Tree обновляется триггерами из
`raw-migrations.ts`. Возвращает `{id}`.

#### [src/app/api/admin/restaurants/[id]/route.ts](<./src/app/api/admin/restaurants/[id]/route.ts>)
`PATCH /api/admin/restaurants/:id` — частичное обновление ресторана.
`DELETE /api/admin/restaurants/:id` — удаление (каскад по FK).
Требует `requireAdmin()`. Zod-схема повторяет create, все поля
опциональны. Проверяет существование записи (404, если нет), строит
частичный patch только из переданных полей и применяет
`db.update(restaurants)`. Возвращает `{id}`.

#### [src/app/api/admin/menu/route.ts](<./src/app/api/admin/menu/route.ts>)
`POST /api/admin/menu`. Требует admin. Discriminated union:
- `action=create-category` — создаёт `menu_categories`.
- `action=create-item` (default) — создаёт `menu_items`.

FTS5 индекс обновляется триггерами.

#### [src/app/api/admin/business-lunch/route.ts](<./src/app/api/admin/business-lunch/route.ts>)
`POST /api/admin/business-lunch`. Требует admin. Zod схема:
`{restaurantId, name, price, timeFrom, timeTo, daysMask, days:[{weekday, courses[]}], status}`.
Вставляет `business_lunches` и `business_lunch_days` на каждый день.

#### [src/app/api/admin/upload/route.ts](<./src/app/api/admin/upload/route.ts>)
`POST /api/admin/upload`. Multipart поле `file`. Требует admin-сессию
(иначе 401). Через `sharp` выполняет авто-rotate, resize max-width 1600
(without enlargement), конвертирует в WebP q=85 и сохраняет в
`public/uploads/{uuid}.webp`. Возвращает `{url: "/uploads/{uuid}.webp"}`.
Лимит файла 15 МБ.

#### [src/app/api/admin/menu/ocr/route.ts](<./src/app/api/admin/menu/ocr/route.ts>)
`POST /api/admin/menu/ocr`. Multipart поле `file` (≤ 10 МБ, admin-guard).
Передаёт буфер в `recognizeMenu()` из `src/lib/llm/ocr.ts` и возвращает
`{items: MenuItemDraft[]}` для preview. Ошибки LLM → 422. `runtime: nodejs`,
`maxDuration: 60`.

#### [src/app/api/admin/business-lunch/ocr/route.ts](<./src/app/api/admin/business-lunch/ocr/route.ts>)
`POST /api/admin/business-lunch/ocr`. Multipart поле `file` (≤ 10 МБ,
admin-guard). Вызывает `recognizeWeeklyLunch()` из `src/lib/llm/lunch-ocr.ts`
и возвращает массив дней: `{days: [{weekday(1..7), weekdayName, courses,
flat: string[]}]}`. Плоский `flat` удобен для UI-таба с чипсами блюд.
Ошибки LLM → 422. `runtime: nodejs`, `maxDuration: 60`.

#### [src/app/api/upload/route.ts](./src/app/api/upload/route.ts)
`POST /api/upload`. User-level image upload (копия admin/upload с `validateSession()` вместо `requireAdmin()`). Multipart поле `file`. Через `sharp` — resize max 1600px, WebP q=85, сохраняет в `public/uploads/{uuid}.webp`. Возвращает `{url}`. Лимит 15 МБ.

#### [src/app/api/reviews/route.ts](./src/app/api/reviews/route.ts)
`POST /api/reviews`. Создание отзыва с чеком. Multipart: `file` (фото чека), `restaurantId`, `text`, `rating` (1-5). Пайплайн: `validateSession()` → валидация полей → проверка ресторана в БД → OCR через `recognizeReceipt()` → fuzzy match через `matchEstablishmentName()` (< 0.3 → 422) → сохранение изображения через sharp → insert в `reviews` + `receipts`. Возвращает `{id, status}`.
`GET /api/reviews?restaurantId=N`. Возвращает approved отзывы с данными авторов (name, avatar) через `getReviewsByRestaurant()`.

#### [src/app/api/reviews/[id]/receipt-image/route.ts](./src/app/api/reviews/[id]/receipt-image/route.ts)
`GET /api/reviews/:id/receipt-image`. Admin-only (`requireAdmin()`). Возвращает `{url}` с путём к фото чека для указанного отзыва. 403 для не-админов, 404 для несуществующего отзыва.

#### [src/app/api/receipts/route.ts](./src/app/api/receipts/route.ts)
`POST /api/receipts`. Standalone загрузка чека из профиля. Multipart: `file`, опциональный `restaurantId`. OCR → save image → insert в `receipts`. Возвращает `{id, ocr}` с результатом распознавания.
`GET /api/receipts`. Список чеков текущего пользователя через `getUserReceipts()`.

#### [src/app/api/receipts/stats/route.ts](./src/app/api/receipts/stats/route.ts)
`GET /api/receipts/stats`. Агрегированная статистика чеков пользователя через `getUserReceiptStats()`. Возвращает `{totalSpent, visitCount, categoryBreakdown}`.

#### [src/app/api/leaderboard/route.ts](./src/app/api/leaderboard/route.ts)
`GET /api/leaderboard?category=X`. Топ пользователей по категории + процентиль текущего юзера. Категории: `total`, `beer`, `wine`, `cocktail`, `spirits`, `soft_drink`, `coffee`, `tea`, `food`, `dessert`, `tips`, `hookah`. Использует `getLeaderboard()` и `getUserPercentile()`. Возвращает `{leaderboard, userPercentile}`.

### LLM / Vision OCR

Phase 7 — интеграция `@openrouter/ai-sdk-provider` + Vercel AI SDK v6
(`ai` package) для vision OCR меню через модель `x-ai/grok-4-fast`.

#### [src/lib/llm/client.ts](./src/lib/llm/client.ts)
Ленивая инициализация OpenRouter-провайдера. Экспорты:
- `LLM_MODEL_ID` — `process.env.OPENROUTER_MODEL ?? "x-ai/grok-4-fast"`.
- `getOpenRouter()` — singleton-инстанс, бросает, если нет
  `OPENROUTER_API_KEY`.
- `getVisionModel(): LanguageModel` — возвращает chat-модель для
  передачи в `generateObject`. Используется типом `LanguageModel` из `ai`.

#### [src/lib/llm/ocr.ts](./src/lib/llm/ocr.ts)
OCR меню ресторана. Экспорты:
- `MenuItemDraftSchema` — Zod-схема одной позиции (`name`, `description?`,
  `price: int≥0`, `category?`).
- `MenuItemsSchema` — `{items: MenuItemDraft[]}`, используется в
  `generateObject` для structured output.
- `prepareImageForLlm(buf)` — sharp rotate/resize до 2048px, JPEG q=85,
  возвращает `{dataUrl, mediaType}` для multimodal-сообщения.
- `recognizeMenu(buf): Promise<MenuItemDraft[]>` — основной вход. Шлёт
  русский system-prompt + `type: "image"` data URL в `generateObject`,
  возвращает валидированный массив позиций. Ошибки оборачиваются в
  `Error("LLM OCR failed (...): ...")` с причиной.

#### [src/lib/llm/lunch-ocr.ts](./src/lib/llm/lunch-ocr.ts)
OCR недельного бизнес-ланча. Экспорты:
- `WEEKDAY_NAMES` / `WeekdaySchema` — enum `monday..sunday`.
- `WEEKDAY_TO_NUMBER` — маппинг в ISO-день недели (Пн=1).
- `LunchCoursesSchema` — `{salad?, soup?, main?, drink?, dessert?}`.
- `LunchDaySchema` — `{weekday, courses}`.
- `WeeklyLunchSchema` — `{days: LunchDay[]}`, используется в
  `generateObject`.
- `flattenLunchDay(day): string[]` — плоский список блюд в порядке
  salad → soup → main → drink → dessert (для UI-чипсов wizarda).
- `recognizeWeeklyLunch(buf): Promise<WeeklyLunchResult>` — распознаёт
  недельное меню, используя ту же подготовку изображения через
  `prepareImageForLlm` из `ocr.ts`.

#### [src/lib/llm/receipt-ocr.ts](./src/lib/llm/receipt-ocr.ts)
OCR кассовых чеков через LLM Vision. Реюзает `prepareImageForLlm()` из
`ocr.ts` и `getVisionModel()` из `client.ts`. Экспорты:
- `ReceiptItemSchema` — Zod-схема позиции чека (`name`, `quantity`, `price`).
- `ReceiptOcrResultSchema` — `{establishmentName?, items[], total?, date?, time?}`,
  используется в `generateObject` для structured output.
- `recognizeReceipt(buf): Promise<ReceiptOcrResult>` — основной вход. Отправляет
  русский system-prompt + изображение в `generateObject`, возвращает
  структурированный результат распознавания чека. При нечитаемом чеке
  возвращает пустой `items` и `null`-поля. Ошибки оборачиваются в
  `Error("Receipt OCR failed (...): ...")`.

#### [src/lib/utils/fuzzy-match.ts](./src/lib/utils/fuzzy-match.ts)
Fuzzy-match для сопоставления названий заведений (чек vs БД).
Алгоритм — Dice coefficient (bigram overlap) на нормализованных строках
(lowercase, без пунктуации). Экспорты:
- `diceCoefficient(a, b): number` — коэффициент Дайса (0–1).
- `matchEstablishmentName(ocrName, restaurantName): {match, confidence}` —
  основная функция. Порог `>= 0.3` для `match: true`. Null-safe: если
  `ocrName` равен `null` или пуст — `{match: false, confidence: 0}`.

### Admin route group и shell

#### [src/app/(admin)/admin/layout.tsx](<./src/app/(admin)/admin/layout.tsx>)
Серверный layout route-group `(admin)`. Вызывает `validateSession()`,
если нет admin-сессии — `redirect('/admin/login')`. Иначе рендерит
`AdminShell` c именем пользователя.

Важное: логин живёт в отдельной route group `(admin-auth)/admin/login`,
чтобы не попадать под session-guard.

#### [src/app/(admin)/admin/_components/AdminShell.tsx](<./src/app/(admin)/admin/_components/AdminShell.tsx>)
Клиентская обёртка (`"use client"`). Рендерит `AdminSidebar` (240px
dark), верхний toolbar с именем пользователя и датой, и `<main>` с
outlet. Handler `handleLogout()` делает `POST /api/admin/auth/logout`
и редиректит на `/admin/login`.

### Admin страницы

#### [src/app/(admin-auth)/admin/login/page.tsx](<./src/app/(admin-auth)/admin/login/page.tsx>)
Server component. Если сессия уже валидна — `redirect('/admin')`. Иначе
рендерит центрированную карточку с `LoginForm`.

#### [src/app/(admin-auth)/admin/login/_components/LoginForm.tsx](<./src/app/(admin-auth)/admin/login/_components/LoginForm.tsx>)
Client component. React Hook Form + Zod (`email`, `password ≥6`). POST
на `/api/admin/auth/login`, при ошибке показывает `serverError`, при
успехе → `router.replace('/admin')` + refresh.

#### [src/app/(admin)/admin/page.tsx](<./src/app/(admin)/admin/page.tsx>)
Dashboard. Server component. Параллельно считает 4 статистики
(рестораны, позиции меню, пользователи, поисков сегодня), выбирает
6 последних добавленных ресторанов и top-8 популярных запросов из
`search_history`. Рендерит сетку из 4 StatCard, таблицу «Последние
добавленные» с `StatusBadge` и список «Популярные запросы».

#### [src/app/(admin)/admin/restaurants/page.tsx](<./src/app/(admin)/admin/restaurants/page.tsx>)
Admin Restaurant List. Server component с searchParams `{q?, page?}`.
Поиск `LIKE` по name/address, пагинация по 10, колонки
(Название/Адрес/Категория/Позиций/Статус/Действия), пагинатор и
`StatusPill`.

#### [src/app/(admin)/admin/restaurants/new/page.tsx](<./src/app/(admin)/admin/restaurants/new/page.tsx>)
Wrapper с заголовком и back-link, рендерит client `AddRestaurantForm`
(алиас `RestaurantForm` в режиме create).

#### [src/app/(admin)/admin/restaurants/[id]/page.tsx](<./src/app/(admin)/admin/restaurants/[id]/page.tsx>)
Admin Edit Restaurant. Server component. `params: Promise<{id}>`
(Next.js 15). Загружает ресторан через Drizzle `eq(restaurants.id, ...)`,
при отсутствии — `notFound()`. Маппит row в `RestaurantFormInitial`
и рендерит `RestaurantForm` в режиме `edit`. Заголовок
«Редактировать ресторан» и back-link на список.

#### [src/app/(admin)/admin/restaurants/new/_components/AddRestaurantForm.tsx](<./src/app/(admin)/admin/restaurants/new/_components/AddRestaurantForm.tsx>)
Client form `RestaurantForm` (экспорт `AddRestaurantForm` — алиас для
обратной совместимости). Поддерживает пропсы
`{mode?: "create"|"edit", initial?: RestaurantFormInitial}`. React Hook
Form + Zod (с numeric preprocess для lat/lng/priceAvg). Двухколоночная
сетка:
- Левая: основная информация (name, slug, category select, address,
  lat/lng, телефон, сайт, описание, часы, средний чек).
- Правая: upload обложки (POST `/api/admin/upload`, preview), карточка
  карты (заглушка), статус (draft/published), кнопки Отмена/Сохранить
  и в режиме edit — ссылка «Удалить ресторан».

Помощник `extractHoursText(hoursJson)` достаёт поле `text` из JSON.
На submit отправляет `POST /api/admin/restaurants` (create) или
`PATCH /api/admin/restaurants/:id` (edit). В edit-режиме кнопка
«Удалить» выполняет `DELETE /api/admin/restaurants/:id` с
`window.confirm`. При успехе `router.push('/admin/restaurants')`.

#### [src/app/(admin)/admin/menu/page.tsx](<./src/app/(admin)/admin/menu/page.tsx>)
Menu Management server page. Читает `?restaurantId=` (или берёт
первый), подтягивает список ресторанов, категории и позиции и передаёт
в client `MenuManagementClient`.

#### [src/app/(admin)/admin/menu/_components/MenuManagementClient.tsx](<./src/app/(admin)/admin/menu/_components/MenuManagementClient.tsx>)
Client. Селектор ресторана (навигация), табы категорий (pills), inline
форма добавления позиции (POST `/api/admin/menu`), таблица позиций с
фильтром по поиску, а также рабочая OCR-карточка «Загрузить фото меню»:
file-picker → preview → POST `/api/admin/menu/ocr` → редактируемая
таблица `OcrDraft[]` с чекбоксами/per-row правкой → bulk insert в
`/api/admin/menu` (по одной позиции). Валидация размера файла 10 МБ
на клиенте, ошибки LLM показываются в alert.

#### [src/app/(admin)/admin/business-lunch/page.tsx](<./src/app/(admin)/admin/business-lunch/page.tsx>)
Business Lunch Management server list (pencil фрейм nK4OR). 4 StatCard
(Всего ланчей / Сейчас подают [success] / Средняя цена / Популярно
сегодня [accent-заливка]) + `LunchTabs` pill-ряд (Все ланчи / Активные /
Черновики / Архив — визуальные без фильтрации) + таблица ланчей с join
на рестораны. Утилиты: `formatDaysMask(mask)` → «Пн–Пт» или список,
`isServingNow()` по `daysMask` и `timeFrom/timeTo`. «Популярно сегодня»
считается как `COUNT(*) FROM search_history WHERE created_at > now-24h`.
`StatCard` принимает `variant: "default" | "success" | "accent"`.

#### [src/app/(admin)/admin/users/page.tsx](<./src/app/(admin)/admin/users/page.tsx>)
Read-only админ-страница /admin/users — таблица пользователей из БД
(id / имя / email / @tg_username / город / роль / дата регистрации),
отсортировано по `createdAt desc`, лимит 200. Колонка «Роль» —
`RoleBadge` (admin/accent, user/muted). Заглушка — формы редактирования
отсутствуют.

#### [src/app/(admin)/admin/business-lunch/new/page.tsx](<./src/app/(admin)/admin/business-lunch/new/page.tsx>)
Wrapper, подтягивает список ресторанов и рендерит
`AddBusinessLunchWizard` (2-step форма, pencil фрейм Rwb40).

#### [src/app/(admin)/admin/business-lunch/new/_components/AddBusinessLunchWizard.tsx](<./src/app/(admin)/admin/business-lunch/new/_components/AddBusinessLunchWizard.tsx>)
Client-компонент, 2-шаговая форма добавления бизнес-ланча
(pencil фрейм Rwb40):
- Шаги: "Программа и содержание" → "Состав и ценообразование"
  (навигация через `Stepper`).
- Единая форма (все секции видны одновременно):
  - Секция «Выберите ресторан»: dropdown + название ланча.
  - Секция «Цена и расписание»: цена, скидка (₽), timeFrom/timeTo,
    pill-селектор дней недели Пн–Вс.
  - Секция «Меню по дням»: табы активных дней, для каждого дня —
    4 аккордеона курсов (`COURSE_GROUPS`: Салат / Суп / Основное /
    Напитки), каждый с inline-инпутами вариантов и кнопкой «Добавить
    вариант».
- Sticky правая колонка 380px:
  - Accent card «AI-ассистент» — OCR file-picker (POST
    `/api/admin/business-lunch/ocr`) + textarea «Описать текстом»
    с кнопкой «Сгенерировать» (стаб).
  - Success card «Это выглядит вкусно и сбалансировано» — статичный
    feedback.
  - «Превью карточки» — live preview (ресторан, цена/скидка, время,
    3 первых блюда активного дня).
  - «Фото бизнес-ланча» — 2×2 uploader (3 placeholder + add, визуал).
  - «Описание (опционально)» — textarea.
  - Warning card «Советы» — bullet list рекомендаций.

OCR автозаполнение: распознанные плоские строки попадают в группу
`main` активного дня (пользователь перегруппирует вручную). Submit
собирает `flattenGroup()` с префиксом «Категория: название» в
`courses: string[]` и POSTит `/api/admin/business-lunch` (API не
менялся). Хелперы: `computeMask(days)`, `flattenGroup(g)`,
`emptyGroup()`, `Stepper`, `Field`.

#### [src/app/(admin)/admin/settings/page.tsx](<./src/app/(admin)/admin/settings/page.tsx>)
Admin Settings. Server component (защищён admin-layout). Статичная UI-
форма без реального сохранения для MVP. Email подгружается из
`requireAdmin()`. Секции-карточки: «Профиль администратора» (email
readonly + смена пароля), «Приложение» (название, город по умолчанию,
accent-цвет), «LLM» (модель OCR, OpenRouter API key placeholder),
«Telegram» (bot token placeholder, webhook URL readonly). Хелперы
`SettingsSection` (title+description+children) и `FormRow` (label
grid 200px / input) — двухколоночный layout.

### Seed admin-пользователя

Seed-скрипт `src/lib/db/seed.ts` теперь включает функцию
`seedAdmin()`: читает `ADMIN_EMAIL`/`ADMIN_PASSWORD` из env (дефолты
`admin@lunchhunter.local` / `admin12345`), хеширует пароль через
`hashPassword()` и upsert-ит запись в `users` с `role='admin'`.
Вызов выполняется до очистки ресторанных таблиц, чтобы admin не терялся
между запусками.

### [.env.example](./.env.example)
Содержит `DATABASE_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD` для seed-админа,
`OPENROUTER_API_KEY` и `OPENROUTER_MODEL` (по умолчанию `x-ai/grok-4-fast`)
для Phase 7 LLM OCR, а также `TELEGRAM_BOT_TOKEN` (Phase 9) — токен бота
для HMAC-верификации initData Telegram Mini App в
`src/app/api/auth/telegram/route.ts`.

## Phase 9 — Telegram Mini App entrypoint

### [src/app/tg/layout.tsx](./src/app/tg/layout.tsx)
Server layout для /tg — минимальный fullscreen shell (без TopNav/
BottomTabBar), центрирует children. TMA рендерится в modal view внутри
Telegram, поэтому стандартный (site) shell не нужен.

### [src/app/tg/page.tsx](./src/app/tg/page.tsx)
Server page, рендерит client-компонент `<TelegramAutoLogin/>`.

### [src/app/tg/_components/TelegramAutoLogin.tsx](<./src/app/tg/_components/TelegramAutoLogin.tsx>)
Client component (`"use client"`). На mount динамически импортирует
`@twa-dev/sdk` (SSR-unsafe — обращается к `window`), вызывает
`WebApp.ready()` + `WebApp.expand()` (с try/catch для non-TMA окружения),
берёт `WebApp.initData`. Если пусто — показывает ошибку "Откройте
приложение через Telegram-бота". Иначе POST на `/api/auth/telegram` с
`{initData}`; при 200 делает `router.replace("/")`, при ошибке показывает
сообщение и кнопку "Продолжить как гость" (редирект на /). Два UI-
состояния: loading (spinner + "Авторизация через Telegram…") и error
(заголовок + описание + кнопка). Использует `cancelled` флаг для защиты
от обновления state после unmount.

## Тестовая инфраструктура (Phase 10)

### [vitest.config.ts](./vitest.config.ts)
Конфигурация Vitest для unit-тестов. `environment: node`, алиас `@/*` →
`./src/*` зеркалит `tsconfig.json`, include `tests/unit/**/*.test.ts` и
`src/**/*.test.ts`, exclude `e2e/` (чтобы Playwright-спеки не попадали в
unit-раннер). Скрипты: `pnpm test` (single run) / `pnpm test:watch`.

### [playwright.config.ts](./playwright.config.ts)
Конфигурация Playwright. `testDir: ./e2e`, один проект `chromium`, baseURL
`http://localhost:3000`, webServer поднимает `pnpm dev` с
`reuseExistingServer: !CI` и таймаутом 120с. `trace: on-first-retry`,
`screenshot: only-on-failure`, `video: retain-on-failure`. Скрипт:
`pnpm test:e2e`.

### [tests/unit/haversine.test.ts](./tests/unit/haversine.test.ts)
Unit-тесты геоутилит из `src/lib/geo/haversine.ts`:
- `haversineDistance`: identical points → 0; Москва↔СПб ≈ 633 км ±5;
  симметричность.
- `bboxFromRadius`: bounding-box содержит центр, lat-span растёт линейно
  с радиусом, lng-span на экваторе равен lat-span, а на 60° широты
  в 2 раза больше (cos(60°)=0.5), sanity-check что точка в 3км от центра
  попадает внутрь 5км-bbox.

### [tests/unit/telegram.test.ts](./tests/unit/telegram.test.ts)
Unit-тесты `verifyInitData` из `src/lib/auth/telegram.ts`. Хелпер
`signInitData(botToken, fields)` подписывает payload тем же алгоритмом
HMAC-SHA256(HMAC("WebAppData", token), dataCheckString) и используется
для генерации валидных и инвалидных initData. Кейсы: валидный initData
(возвращает TelegramUser с id/first_name/username/lang/is_premium),
tampered field (nulls), неправильный токен (null), протухший auth_date
(25ч назад → null), пустые входы (null), отсутствующий `user` (null).

### [tests/unit/ocr.test.ts](./tests/unit/ocr.test.ts)
Unit-тесты `prepareImageForLlm` из `src/lib/llm/ocr.ts` (без сетевых
вызовов к LLM). `makeRedSquare(size)` через `sharp(...).create(...).png()`
генерирует тестовые буферы. Кейсы: валидный JPEG data URL с
`media type image/jpeg`; картинки >2048px даунскейлятся (проверка
через sharp metadata); картинки <2048px не растягиваются (512→512).

### [e2e/search.spec.ts](./e2e/search.spec.ts)
Playwright-спека "Search flow". Заходит на `/`, заполняет первый
SearchInput с placeholder "пиво", Enter, ждёт URL `/search?q=`, проверяет
что на странице результатов есть хотя бы одна цена формата `"NNN ₽"`.

### [e2e/admin.spec.ts](./e2e/admin.spec.ts)
Playwright-спека "Admin flow". Открывает `/admin/login`, вводит
`admin@lunchhunter.local` / `admin12345` (seed-креды), ждёт редирект на
`/admin`, проверяет видимость заголовка "Дашборд" и карточек
"Рестораны" / "Позиции". Требует предварительный `pnpm db:seed`.

### [e2e/tg-auth.spec.ts](./e2e/tg-auth.spec.ts)
Playwright-спека "Telegram Mini App auth". Мокает `**/api/auth/telegram`
через `route.fulfill({status: 200, json: {ok: true, user: ...}})`,
подкладывает stub `window.Telegram.WebApp` через `page.addInitScript`
до гидратации (с фейковым `initData`), открывает `/tg` и ждёт редирект
на `/` (TelegramAutoLogin → `router.replace("/")` после успешного POST).

### [README.md](./README.md)
Короткая инструкция: требования (Node 20, pnpm 9), установка, переменные
окружения (`DATABASE_URL`, `ADMIN_*`, `OPENROUTER_*`, `TELEGRAM_BOT_TOKEN`),
`pnpm db:migrate` + `pnpm db:seed`, dev/build/start, unit/e2e тесты,
typecheck/lint.
