# LunchHunter

Web-приложение для поиска бизнес-ланчей и позиций меню рядом. Next.js 15 App
Router + TypeScript strict + Tailwind v4 + Drizzle ORM + SQLite (better-sqlite3)
+ MapLibre GL + Serwist PWA + Telegram Mini App.

Полная архитектура проекта — в [`architecture.md`](./architecture.md).

## Требования

- Node.js ≥ 20
- pnpm ≥ 9

## Установка

```bash
pnpm install
cp .env.example .env
# отредактируй .env при необходимости (DATABASE_URL, ADMIN_*, OPENROUTER_*, TELEGRAM_BOT_TOKEN)
```

### Переменные окружения

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Путь к SQLite-файлу (по умолчанию `file:./data/lunchhunter.db`) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Учётка seed-админа (создаётся `db:seed`) |
| `OPENROUTER_API_KEY` | Ключ OpenRouter для vision-OCR меню |
| `OPENROUTER_MODEL` | Модель LLM (по умолчанию `x-ai/grok-4-fast`) |
| `TELEGRAM_BOT_TOKEN` | Токен бота для HMAC-валидации Telegram initData |

## Инициализация БД

```bash
pnpm db:migrate    # Drizzle-миграции + raw FTS5/R*Tree-таблицы
pnpm db:seed       # 6 ресторанов, меню, 3 бизнес-ланча, admin-пользователь
```

## Разработка

```bash
pnpm dev           # http://localhost:3000
```

### Bash-скрипты для быстрого запуска

Вместо ручного цикла `install → migrate → seed → dev/build/start` используй
готовые скрипты в `scripts/`:

```bash
./scripts/dev.sh              # dev-окружение (auto-install, migrate, seed if empty, next dev)
./scripts/dev.sh --seed       # принудительный пересев БД
./scripts/dev.sh --fresh      # удалить БД и пересоздать с нуля
PORT=4000 ./scripts/dev.sh    # кастомный порт

./scripts/prod.sh             # production: install → migrate → typecheck → lint → build → start
./scripts/prod.sh --no-build  # только start (используется существующий .next)
./scripts/prod.sh --skip-checks
./scripts/prod.sh --seed-admin               # первый запуск — создать admin
PORT=80 HOSTNAME=0.0.0.0 ./scripts/prod.sh
```

`dev.sh` проверяет Node ≥ 20, копирует `.env.example` → `.env` если нет,
применяет миграции и сидит БД при первом запуске.
`prod.sh` дополнительно валидирует обязательные переменные
(`OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
и fail-fast прогоняет `typecheck` + `lint` перед `next build`.

Ключевые маршруты:

- `/` — публичный сайт (mobile ≤ md / desktop ≥ md)
- `/search`, `/map`, `/business-lunch`, `/restaurant/[id]`, `/profile`
- `/admin/login` → `/admin` (рестораны, меню, бизнес-ланчи, OCR)
- `/tg` — entrypoint Telegram Mini App (auto-login через `@twa-dev/sdk`)
- `/offline` — PWA fallback

## Тесты

```bash
pnpm test          # Vitest unit (haversine, telegram verifyInitData, ocr prepareImageForLlm)
pnpm test:watch    # Vitest в watch-режиме
pnpm test:e2e      # Playwright e2e (search / admin / telegram auth mock)
```

Перед первым запуском e2e один раз:

```bash
pnpm exec playwright install --with-deps chromium
```

`pnpm test:e2e` автоматически поднимает `pnpm dev` как webServer на 3000 порту
(см. [`playwright.config.ts`](./playwright.config.ts)). Админский e2e
(`admin.spec.ts`) требует выполненного `pnpm db:seed`.

## Production build

```bash
pnpm build         # Next.js + Serwist service worker
pnpm start
```

## Качество кода

```bash
pnpm typecheck     # tsc --noEmit (strict, noUncheckedIndexedAccess)
pnpm lint          # next lint (core-web-vitals + typescript)
```
