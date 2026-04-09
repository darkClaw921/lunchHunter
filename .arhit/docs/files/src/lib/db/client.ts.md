# src/lib/db/client.ts

Инициализация клиента Drizzle + better-sqlite3 для SQLite базы данных проекта.

## Ответственность

- Резолв DATABASE_URL из env (поддержка префикса file:, fallback ./data/lunchhunter.db)
- Создание директории data/ если её нет (нужно для первого запуска)
- Инициализация better-sqlite3 Database instance
- Применение pragma настроек: WAL mode, busy_timeout, foreign_keys
- Обёртка в Drizzle ORM с подключённой схемой

## pragma настройки

### journal_mode = WAL
Write-Ahead Logging — стандартный режим для concurrent access. Писатели не блокируют читателей, читатели не блокируют писателей. Требует отдельных файлов .db-wal и .db-shm.

### busy_timeout = 5000
При конкурентных соединениях (например, параллельные воркеры Next.js Collecting page data во время docker build, или несколько серверных запросов в WAL-режиме) SQLite ждёт освобождения блокировки до 5000 мс вместо мгновенного SQLITE_BUSY. 5с — безопасный дефолт для всех сценариев (build + runtime), стандартная рекомендация для WAL. Критично для docker build: без этого параллельные воркеры при Collecting page data падали с SqliteError: database is locked.

### foreign_keys = ON
Включает enforcement FK-constraints (по умолчанию в SQLite off для обратной совместимости).

## Экспорты

- **db** — Drizzle instance с подключённой schema, используется во всех route handlers
- **sqlite** — сырой Database instance для raw SQL запросов (FTS5, R*Tree, pragma)
- **Db** — TypeScript тип клиента (typeof db)
- **resolveDbPath()** — внутренняя функция резолва пути, экспорт для тестов

## Важные нюансы

- Все pragma и new Database() вызываются на top-level модуля. Как только любой файл импортирует './client', создаётся соединение с базой. Это ВАЖНО для docker build: Collecting page data параллельно импортирует все route-модули, и без busy_timeout параллельные new Database() + pragma WAL конфликтовали.

- В standalone output Next.js better-sqlite3 помечен как serverExternalPackages — webpack его не бандлит, а копирует как внешнюю native-зависимость. Работоспособность зависит от корректного трассинга (.npmrc public-hoist-pattern + outputFileTracingIncludes в next.config.ts).

- DATABASE_URL=file:./data/lunchhunter.db — стандартный путь. В docker runtime DATABASE_URL берётся из .env через env_file в docker-compose. На хосте путь относительный от WORKDIR=/app.

## Связи

- src/lib/db/schema.ts — Drizzle schema
- src/lib/db/raw-migrations.ts — raw FTS5/R*Tree/триггеры, применяются через sqlite.exec()
- src/lib/db/migrate.ts — скрипт миграций (runs at docker build time для template DB)
- src/lib/db/seed.ts — seed скрипт (runs at docker build time)
- docker/admin-upsert.mjs — отдельный скрипт с теми же pragma настройками для runtime admin upsert
