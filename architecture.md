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
│   │   │   └── profile/                    # Профиль + toggle client
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
│   │   ├── ui/               # UI-примитивы (Button, Input, Chip, Card, Tabs, Badge)
│   │   ├── mobile/           # Mobile-specific компоненты (BottomTabBar)
│   │   ├── desktop/          # Desktop-specific компоненты (TopNav, FeatureCard)
│   │   ├── map/              # MapLibre GL обёртки (MapView, RadiusSelector)
│   │   └── admin/            # Admin-specific компоненты (Sidebar)
│   └── lib/
│       ├── auth/             # Session/password helpers (argon2 + httpOnly cookie)
│       ├── db/               # База данных (Drizzle + SQLite) + queries.ts
│       ├── geo/              # Геопространственные утилиты
│       ├── llm/              # OpenRouter + Vercel AI SDK — OCR меню (vision)
│       └── utils/            # Общие утилиты (cn, format)
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
Конфиг Next.js: `reactStrictMode`, typed routes, `serverExternalPackages` для better-sqlite3 (нативный binding — нельзя бандлить). Обёрнут в `withSerwistInit` из `@serwist/next` — генерирует `public/sw.js` из `src/app/sw.ts`, включены опции `cacheOnNavigation: true`, `reloadOnOnline: true`, `disable` в dev-режиме, а также `additionalPrecacheEntries: [{ url: "/offline" }]` для precache fallback-страницы.

### [next-env.d.ts](./next-env.d.ts)
Автогенерируемые TypeScript-декларации Next.js.

### [drizzle.config.ts](./drizzle.config.ts)
Конфиг drizzle-kit: schema → `src/lib/db/schema.ts`, миграции → `src/lib/db/migrations`, dialect SQLite, `DATABASE_URL` из env (fallback `file:./data/lunchhunter.db`).

### [postcss.config.mjs](./postcss.config.mjs)
PostCSS pipeline с `@tailwindcss/postcss` (Tailwind v4).

### [.eslintrc.json](./.eslintrc.json)
ESLint: `next/core-web-vitals` + `next/typescript`.

### [.env.example](./.env.example)
Пример переменных окружения: `DATABASE_URL=file:./data/lunchhunter.db`.

### [.gitignore](./.gitignore)
Игнорирует `node_modules`, `.next`, `data/`, `*.db`, `public/uploads`, env-файлы.

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
Исходник service worker'а, собираемый Serwist'ом в `public/sw.js`. Строит `new Serwist({...})` с:
- `precacheEntries: self.__SW_MANIFEST` (инъектируется Serwist'ом, включает shell-роуты и `/offline`)
- `skipWaiting`, `clientsClaim`, `navigationPreload`
- `runtimeCaching: apiRuntimeCaching[]` — список стратегий:
  1. `NetworkFirst` (`networkTimeoutSeconds: 5`, cache `lh-api-cache`, `ExpirationPlugin` 64 записи / 5 минут) для GET `/api/search`, `/api/restaurants`, `/api/business-lunch`
  2. `StaleWhileRevalidate` (cache `lh-image-cache`, 128 записей / 7 дней) для same-origin image-запросов
  3. `CacheFirst` (cache `lh-static-cache`, 128 записей / 30 дней) для same-origin style/script/font
  4. `...defaultCache` из `@serwist/next/worker` как fallback-стратегии для остальных запросов
- `fallbacks.entries` — `/offline` для document-навигаций (оффлайн shell)

Объявляет типизацию `WorkerGlobalScope.__SW_MANIFEST` через глобальный `declare`. Завершается вызовом `serwist.addEventListeners()`.

### [src/app/offline/page.tsx](./src/app/offline/page.tsx) (Phase 8)
Статическая fallback-страница, отдаваемая service worker'ом когда навигационный запрос падает по сети и нет закэшированной копии целевого маршрута. Precache-запись регистрируется через `additionalPrecacheEntries` в `next.config.ts` и как document fallback в `src/app/sw.ts`. Функция: `OfflinePage(): React.JSX.Element` — бренд-иконка `WifiOff`, заголовок «Нет соединения», ссылка-кнопка на `/` для повторной попытки. Никаких client-only / data-fetching операций.

### [src/app/page.tsx](./src/app/page.tsx)
Корневая страница `/` — плейсхолдер. Функция: `HomePage()`.

### [src/app/globals.css](./src/app/globals.css)
Глобальные стили и дизайн-токены:
- Директива `@import "tailwindcss"` (Tailwind v4).
- Блок `@theme` с CSS-переменными из pencil: accent/surface/fg/semantic colors + radius + fonts.
- Цвета: `--color-accent #ff5c00`, `--color-accent-dark #cc4a00`, `--color-accent-light #fff0e6`, `--color-surface-primary #ffffff` (карточки/модали), `--color-surface-secondary #fff5ea` (тёплый второстепенный), `--color-surface-inverse`, `--color-page-bg #fff9f3` (тёплый кремовый фон всей страницы, применяется к `body` в globals.css), `--color-fg-primary/secondary/muted/inverse`, `--color-success #22c55e`, `--color-warning #f59e0b`, `--color-error #ef4444`, `--color-border #e5e7eb`.
- Radius: `--radius-sm 6`, `--radius-md 10`, `--radius-lg 16`, `--radius-xl 24`, `--radius-full 9999`.
- `@layer base` — baseline для `html`/`body`/box-sizing.

## База данных

### [src/lib/db/client.ts](./src/lib/db/client.ts)
Инициализация клиента Drizzle + better-sqlite3. Резолвит `DATABASE_URL` (поддерживает префикс `file:`), создаёт директорию `data/` при необходимости, включает `journal_mode = WAL` и `foreign_keys = ON`.

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
- Типы: `FavoriteRestaurantRow`, `FavoriteMenuItemRow`, `FavoriteLunchRow`, `UserFavorites`.

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
Автогенерируемые SQL-миграции Drizzle. Первая — `0000_nervous_mad_thinker.sql` (все таблицы схемы + индексы + `_journal.json`).

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
Собранный Serwist'ом service worker. Генерируется из `src/app/sw.ts` во время `next build`. В dev-режиме не генерируется (`disable: process.env.NODE_ENV === "development"`).

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

## UI-kit (Phase 2)

Библиотека UI-примитивов в `src/components/ui/`. Все компоненты соответствуют дизайну из `lanchHunter.pen`, типизированы строго (strict TS), используют `forwardRef` где применимо, стили через Tailwind v4 + дизайн-токены из `globals.css`. Класс-варианты реализованы через `class-variance-authority` (CVA).

### [src/components/ui/Button.tsx](./src/components/ui/Button.tsx)
Кнопка с вариантами `primary` (accent #FF5C00), `secondary` (surface-secondary), `ghost`, `accent-soft` (accent-light fill), `danger`. Размеры `sm`/`md`/`lg`, опц. `fullWidth`, `leftIcon`/`rightIcon` слоты под lucide-иконки. Экспортирует `Button`, `ButtonProps`, `buttonVariants` (CVA factory).

### [src/components/ui/Input.tsx](./src/components/ui/Input.tsx)
Текстовое поле и специализированный `SearchInput` с иконкой `Search` из lucide-react. Поддерживает `leftIcon`, `rightSlot`, состояние `error`, размеры `sm`/`md`/`lg`. Реализованы через `forwardRef`, совместимы с React Hook Form. Экспортирует `Input`, `SearchInput`, `InputProps`, `SearchInputProps`.

### [src/components/ui/Chip.tsx](./src/components/ui/Chip.tsx)
Pill-chip для фильтров категорий и популярных запросов. Варианты `default`, `active` (accent solid), `soft` (accent-light + accent text). Размеры `sm`/`md`, проп `active` переключает вариант, проп `leftIcon` для иконки. Экспортирует `Chip`, `ChipProps`, `chipVariants`.

### [src/components/ui/Card.tsx](./src/components/ui/Card.tsx)
Базовая поверхность карточки: `bg-surface-primary`, border `#E5E7EB`, `radius-lg` (16px), лёгкая тень. Пропы `noPadding`, `interactive` (hover + cursor). Подкомпоненты: `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter`. Используется для ResultCard, LunchCard, StatCard.

### [src/components/ui/Tabs.tsx](./src/components/ui/Tabs.tsx)
Клиентский компонент (`"use client"`). Обёртка вокруг `@radix-ui/react-tabs` со стилями в pill-style: неактивная вкладка — text-fg-secondary, активная — `bg-accent` + белый текст. Экспортирует `Tabs` (Root), `TabsList`, `TabsTrigger`, `TabsContent`.

### [src/components/ui/Badge.tsx](./src/components/ui/Badge.tsx)
Компактный статус/count индикатор. Варианты `success`, `warning`, `error`, `neutral`, `accent`, `accent-soft`. Размеры `sm`/`md`/`lg`. Опц. `dot` — маленький круглый индикатор слева. Экспортирует `Badge`, `BadgeProps`, `badgeVariants`.

### [src/components/ui/FavoriteButton.tsx](./src/components/ui/FavoriteButton.tsx)
Клиентский (`"use client"`) универсальный компонент добавления/удаления в избранное. Пропсы: `targetType` (`"restaurant"|"menu_item"|"lunch"`), `targetId`, `initialFavorited`, `isAuthenticated`, опциональный `variant` (`"icon"`, `"button"`, `"iconFloating"`), `label`/`labelActive`/`ariaLabel`/`className`. Оптимистично обновляет состояние, делает `POST /api/favorites`; на ошибку откатывается. Гостя редиректит в `/profile` через `useRouter().push()`. Используется на страницах детали ресторана (mobile и desktop), в `RestaurantMenu` на каждой позиции меню, на странице детали бизнес-ланча.

### [src/components/ui/index.ts](./src/components/ui/index.ts)
Barrel-экспорт UI-kit: `Button`, `Input`, `SearchInput`, `Chip`, `Card` + подкомпоненты, `Tabs` + подкомпоненты, `Badge`, `FavoriteButton` и все типы/CVA-фабрики. Импорт через `@/components/ui`.

### [src/components/mobile/BottomTabBar.tsx](./src/components/mobile/BottomTabBar.tsx)
Клиентский компонент (`"use client"`). Fixed-bottom навигация для mobile-варианта сайта. 5 вкладок: Поиск (`/`), Бизнес-ланч (`/business-lunch`), Карта (`/map`), Избранное (`/favorites`), Профиль (`/profile`). Иконки из lucide-react (`Search`, `UtensilsCrossed`, `Map`, `Heart`, `User`). Активное состояние определяется через `usePathname()` и `matchPrefixes`. Поддержка `env(safe-area-inset-bottom)`. Активный таб — pill с `bg-accent-light` и `text-accent`.

Экспорты: `BottomTabBar`, `BottomTabItem`, `BottomTabBarProps`, `DEFAULT_TABS`.

### [src/components/mobile/useBeforeInstallPrompt.ts](./src/components/mobile/useBeforeInstallPrompt.ts) (Phase 8)
Клиентский React-хук (`"use client"`) для перехвата браузерного события `beforeinstallprompt` (Chromium). Слушает событие через `addEventListener`, вызывает `preventDefault()` чтобы скрыть mini-infobar, и сохраняет отложенный prompt в state. Также отслеживает `appinstalled` и `(display-mode: standalone)` media-query для определения уже установленного состояния.

Экспорты:
- `BeforeInstallPromptEvent` — тип не-стандартного события (`platforms`, `userChoice`, `prompt()`)
- `UseBeforeInstallPromptResult` — `{ canInstall, isStandalone, promptInstall }`
- `useBeforeInstallPrompt(): UseBeforeInstallPromptResult` — основной хук. `promptInstall()` вызывает нативный диалог из user-gesture и резолвится в `"accepted" | "dismissed" | null`.

### [src/components/mobile/PWAInstallBanner.tsx](./src/components/mobile/PWAInstallBanner.tsx) (Phase 8)
Клиентский компонент (`"use client"`) — mobile-only install-баннер, отображается поверх `BottomTabBar` на home. Использует `useBeforeInstallPrompt()` для получения `canInstall` и `promptInstall`. Рендерит null, пока страница не гидратирована, пока `canInstall === false`, пока приложение уже standalone, или пока пользователь ранее не закрыл баннер (персистентный флаг в `localStorage` под ключом `lh:pwa-install-dismissed`). Дизайн: fixed bottom-[72px], `bg-[#FF5C00]`, иконка `Download`, кнопка «Установить», кнопка-крестик `X` для dismiss. Экспорт: `PWAInstallBanner({ className? })`.

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
один раз. Экспортирует `SiteLayout` и `metadata`.

### [src/app/(site)/page.tsx](<./src/app/(site)/page.tsx>)
Home/Search. Server component. Параллельно подтягивает 4 источника:
`getNearbyRestaurants`, `getPopularQueries`, `getFeaturedBusinessLunches`,
`getMinBusinessLunchPrice`. Секции: header с логотипом LH и колокольчиком,
`SearchHomeForm` (client), горизонтальные категории-пилюли, «Популярные
запросы» (Link-chips с lucide Search), баннер «Бизнес-ланчи рядом» (accent,
3 превью-карточки), карусель «Рядом с вами» (cards с фото, рейтингом,
расстоянием). Константы `DEFAULT_LAT/LNG = Москва`. Экспортирует
`HomePage` и массив `CATEGORIES`. В mobile-разметке также монтируется
`<PWAInstallBanner className="md:hidden" />` (Phase 8) — install-prompt
показывается над `BottomTabBar` когда браузер фаерит `beforeinstallprompt`.

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
внутренний хелпер для активной/неактивной фильтр-пилюли.

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
(border-top, surface-primary, ссылки на `/restaurant/[slug]`). Маркеры
кликабельны, popup содержит название ресторана, позицию, цену, расстояние
и ссылку «Открыть». Экспорты: `MobileMapView`, `MobileMapItem`,
`MobileMapViewProps`.

### [src/app/(site)/restaurant/page.tsx](<./src/app/(site)/restaurant/page.tsx>)
Restaurant Index. Server component, `dynamic = "force-dynamic"`. Использует
`getNearbyRestaurants({ userLat, userLng, limit: 50 })` для получения списка
опубликованных ресторанов с расчётом расстояния от Moscow center.
Двухвариантный layout: mobile (`<md`) — вертикальный список карточек
(image 96×96 + name + rating + category badge + address), desktop (`md+`) —
hero-секция «Все рестораны» + сетка `md:grid-cols-2 xl:grid-cols-4` с
полноформатными карточками (cover 160px, name, rating, category, address).
Каждая карточка ведёт на `/restaurant/{slug}`. Используется ссылкой
«Рестораны» из TopNav.

### [src/app/(site)/favorites/page.tsx](<./src/app/(site)/favorites/page.tsx>)
Favorites. Server component, `dynamic = "force-dynamic"`. Через
`validateSession()` определяет три состояния: гость → `GuestState` (Heart
icon, CTA на /profile для Telegram login); залогинен без избранных →
`EmptyState` (CTA на /); залогинен с избранными → вызывает
`getUserFavorites(userId)` из `src/lib/db/favorites.ts` и рендерит до трёх
секций: «Рестораны», «Блюда», «Бизнес-ланчи» (каждая только если непуста).
Mobile — вертикальные карточки с photo 96×96, desktop — сеточные карточки
(`md:grid-cols-2 xl:grid-cols-4` для ресторанов, `md:grid-cols-2 xl:grid-cols-3`
для блюд и ланчей). Используется ссылкой «Избранное» из BottomTabBar.

### [src/app/(site)/restaurant/[id]/page.tsx](<./src/app/(site)/restaurant/[id]/page.tsx>)
Restaurant Detail. Server component. Параметр `id` может быть числовым
primary key или slug — резолвится в двух ветках. Загружает ресторан, фото,
меню-категории, позиции меню параллельно. Hero 220px, оверлей «назад»,
блок информации (название, звёзды, рейтинг, адрес, расстояние), `Меню`
заголовок + `RestaurantMenu` (client), полноширинная кнопка «Добавить в
избранное». Передаёт `highlightQuery` из `?q=`.

### [src/app/(site)/restaurant/[id]/_components/RestaurantMenu.tsx](<./src/app/(site)/restaurant/[id]/_components/RestaurantMenu.tsx>)
Client component. Использует `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`.
По умолчанию выбирает категорию, в которой есть позиция, совпадающая с
`highlightQuery`. Позиции, matching query, выделяются фоном `accent-light`,
border `accent`, accent-текстом. Экспортирует `RestaurantMenu`,
`RestaurantMenuProps`, `MenuItem`, `MenuCategory`.

### [src/app/(site)/restaurant/[id]/_components/BackButton.tsx](<./src/app/(site)/restaurant/[id]/_components/BackButton.tsx>)
Client component. Кнопка «Назад» для страницы детали ресторана. Использует
`useRouter().back()` когда в `window.history` есть предыдущая запись, иначе
переходит на `fallbackHref` (по умолчанию `/`). Два визуальных варианта
через проп `variant`: `icon` (круглая 40×40 поверх hero, absolute
top-left) — используется на mobile page; `pill` (rounded-full pill с
текстом) — используется в `DesktopRestaurantDetail` (back-button row).
Пропсы: `variant`, `fallbackHref`, `className`, `label`, `ariaLabel`.

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
Основное/Напиток. Hero 180px (оверлей «назад» + «поделиться»), название
ресторана, accent info-card (цена 38px, время, дни через
`daysMaskToLabel`, badge «Сейчас подают»), раздел «Что входит:», адрес +
расстояние, две кнопки «Маршрут»/«Забронировать». Функции
`daysMaskToLabel`, `isServingNow`, `parseCourses`.

### [src/app/(site)/profile/page.tsx](<./src/app/(site)/profile/page.tsx>)
Profile (server component, `dynamic = "force-dynamic"`). Читает текущего
пользователя через `validateSession()` из `src/lib/auth/session`. Если
`user.tgId` заполнен — показывает Telegram-имя и `@username`, аватар из
`avatarUrl` (через `next/image` с `unoptimized`), бейдж "Telegram". Если
сессии нет — гостевой placeholder с предложением войти через Telegram-бота.
Список настроек: «Избранные заведения», «История поиска», «Город»,
«Уведомления» (toggle — client component), «О приложении»; кнопка «Выйти»
только у залогиненных. Хелпер `getInitials(name)` для fallback-аватара.

### [src/app/(site)/profile/_components/ProfileNotificationsToggle.tsx](<./src/app/(site)/profile/_components/ProfileNotificationsToggle.tsx>)
Client component. `role=switch` toggle с accent fill когда enabled, border
fill когда disabled. Хранит состояние локально (useState). На Phase 6
подключим к user settings.

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
рестораны" (grid 4 cols, карточки с фото 160px, рейтинг, категория,
accent-метка расстояния). Принимает `popularRestaurants` prop с типом
`DesktopHomeRestaurant[]`.

### [src/app/(site)/_components/HeroFloatingCards.tsx](<./src/app/(site)/_components/HeroFloatingCards.tsx>)
Server component. Декоративный фон hero главной страницы (desktop):
рендерит 6 наклонённых карточек четырёх типов (`CardKind`), расположенных
абсолютно по периметру hero-секции, каждая — со своей float-анимацией.

Типы карточек (выделены в мини-компоненты):
- `RestaurantCard` — обложка ресторана + имя + рейтинг (звезда) + категория.
- `MenuCard` — фото блюда + название + цена accent + имя ресторана.
- `LunchCard` — accent-заголовок «Бизнес-ланч» с пульсирующей точкой +
  название сета + ресторан + «от X ₽» + время подачи (иконка `Clock`).
- `MapCard` — декоративный SVG-кусок карты (кварталы, улицы, вода,
  подсвеченный пунктирный маршрут) + пин MapPin с `animate-ping`
  радиальным пульсом + подпись «Рядом с тобой · 12 мест в радиусе 500 м».
  Чистый SVG без MapLibre.

Конфиг `SLOTS` задаёт для каждого слота `kind`, позицию, угол наклона
(`--tilt` CSS-переменная), размер, класс анимации (`hero-card` /
`hero-card-b` / `hero-card-c`) и breakpoint видимости
(`hideBelow: "lg" | "xl"`). Счётчики `counters: Record<CardKind, number>`
обеспечивают использование разных элементов данных для однотипных слотов.

Анимации (keyframes `hero-float-a/b/c` + `hero-fade-in`,
`prefers-reduced-motion` respected) определены в `src/app/globals.css`.

Props: `restaurants: DesktopHomeRestaurant[]`,
`menuItems?: DesktopHomeHeroMenuItem[]`,
`lunches?: DesktopHomeHeroLunch[]`. Если данных нет — используются
дефолтные плейсхолдеры в самих карточках и градиентные фоллбеки. Контейнер
`aria-hidden` + `pointer-events-none` — чисто декоративный слой.

### [src/app/(site)/search/_components/DesktopSearchResults.tsx](<./src/app/(site)/search/_components/DesktopSearchResults.tsx>)
Client component (`"use client"`). Desktop split-view для страницы поиска
(pencil frame pqZ50). Левая колонка (55%, max 790px): sort-row (Link-pills
Цена / Расстояние / Рейтинг + счётчик результатов), список карточек
результата (`surface-secondary`, 72×72 accent-light thumbnail с иконкой
`utensils`, flex-col info с ценой accent). Hover карточки выставляет
`activeMarkerId` и подсвечивает её ring-2 ring-accent (hover-sync с
маркером карты). Правая колонка (45%): `MapView` (MapLibre GL + OSM)
с центром Москвы, маркерами `filteredResults`, кругом радиуса. Floating
`RadiusSelector` (size sm) в верхнем-левом углу — controlled через
`useState`, фильтрует результаты client-side (`distanceMeters <= radius`).
Маркеры кликабельны, popup содержит название/позицию/цену/расстояние/
ссылку «Открыть». `onMarkerClick` синхронизирует `activeMarkerId`.

Экспорты: `DesktopSearchResults`, `DesktopSearchResultsProps`, `DesktopSort`.

### [src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx](<./src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx>)
Server component. Desktop-вариант страницы ресторана (pencil frame Yi1h9 —
Desktop Restaurant Detail). Структура: back-button row, hero 220px с
фото и gradient-overlay + название и категория поверх снизу-слева, info-row
(accent rating badge pill + адрес + часы + телефон, lucide icons), двух-
колоночный layout (flex-1 меню с `RestaurantMenu` tabs + aside 420px:
"Местоположение" с мини-картой `MapView` 200px (MapLibre GL + OSM, zoom 15,
один маркер ресторана), "Отзывы" — 3 demo-отзыва в surface-secondary
карточках с аватаром-инициалами и звёздами). Принимает `lat`/`lng`
ресторана для центра мини-карты.

Экспорты: `DesktopRestaurantDetail`, `DesktopRestaurantDetailProps`.

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
