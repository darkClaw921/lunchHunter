# Docker Autonomous Production — Обновление

Расширение Docker-сборки для полностью автономного развёртывания на proд-сервере, где кроме docker engine нет ничего (нет node, pnpm, tsx, git). Все шаги инициализации БД и admin-пользователя выполняются внутри контейнера.

## Архитектура

### Build time (docker build)

1. **deps stage:** pnpm install --frozen-lockfile с .npmrc (public-hoist-pattern для native subpackages)
2. **builder stage:**
   - DATABASE_URL=file:./data/lunchhunter.db
   - pnpm db:migrate — drizzle migrate + raw FTS5/R*Tree/триггеры → schema в ./data/lunchhunter.db
   - pnpm db:seed — 6 ресторанов, меню, бизнес-ланчи, dummy admin
   - pnpm build — Next.js standalone output (Collecting page data открывает ту же базу, busy_timeout=5000 защищает от SQLITE_BUSY)
   - rm data/lunchhunter.db-wal data/lunchhunter.db-shm — чистка WAL-артефактов, получаем single-file template
3. **runner stage:**
   - Копирует .next/standalone + .next/static + public
   - Копирует /app/data/lunchhunter.db → /app/db-template/lunchhunter.db (template)
   - Копирует docker/entrypoint.sh + docker/admin-upsert.mjs
   - ENTRYPOINT [/app/docker/entrypoint.sh]

### Runtime (docker compose up)

docker-entrypoint.sh последовательно:

1. **Проверка template:** если /app/db-template/lunchhunter.db нет — FATAL exit 1
2. **Init DB:** если /app/data/lunchhunter.db не существует (пустой volume на первом запуске) → cp template в volume. Иначе — пропуск
3. **Admin upsert:** node /app/docker/admin-upsert.mjs
   - Читает ADMIN_EMAIL, ADMIN_PASSWORD из env
   - UPSERT по email: обновляет password_hash или создаёт нового админа с UUID
   - Пароли хешируются через @node-rs/argon2 с OWASP параметрами (идентично src/lib/auth/password.ts)
   - Идемпотентно, выполняется каждый старт — поддерживает ротацию пароля через .env без ручных SQL
4. **Start server:** exec node server.js (Next.js standalone)

## Проблемы, которые решает эта схема

### Проблема 1: SQLITE_BUSY при docker build

Симптом: pnpm build падает на стадии Collecting page data:
```
SqliteError: database is locked
    at 3638 (.next/server/app/api/admin/auth/logout/route.js:1:3659)
```

Причина: Collecting page data параллельно импортирует все route-модули. Каждый route через @/lib/auth/session → @/lib/db/client вызывает new Database(dbPath) + pragma journal_mode = WAL. Параллельные воркеры конфликтуют на WAL write-блокировке при первом pragma-запросе.

Решение: pragma busy_timeout = 5000 в src/lib/db/client.ts. SQLite ждёт до 5с освобождения лока вместо мгновенного SQLITE_BUSY. Это стандартная best practice для WAL-режима.

### Проблема 2: Чистая prod-машина без node/pnpm

На prod-сервере есть только docker engine. Нет node, pnpm, tsx, git. Значит нельзя запустить pnpm db:migrate на хосте или внутри контейнера (devDeps нужны).

Решение: template-подход. Миграции + seed выполняются во время docker build (когда devDeps ещё доступны в builder stage). Результат — полная single-file SQLite база — копируется в runner stage как template. При первом запуске контейнера entrypoint.sh копирует template в volume.

### Проблема 3: Admin пароль нужно менять без доступа к SQL

На prod-сервере нет sqlite3 CLI и нет способа выполнять ручные запросы. Администратор может менять только .env файл.

Решение: admin-upsert.mjs выполняется каждый старт контейнера. Читает ADMIN_EMAIL/ADMIN_PASSWORD из env, хеширует через @node-rs/argon2 с теми же параметрами что и runtime auth, UPSERT в users. Если в .env обновлён пароль — при следующем docker compose up -d --force-recreate новый пароль применяется.

### Проблема 4: @node-rs/argon2 не находит platform-specific subpackage

Симптом: Cannot find module '@node-rs/argon2-linux-arm64-gnu'

Причина: В pnpm layout платформо-специфичные subpackages лежат в .pnpm/@node-rs+argon2-linux-arm64-gnu@.../node_modules/@node-rs/argon2-linux-arm64-gnu/, а в корневой node_modules/@node-rs/ симлинк только на argon2 (родительский пакет). Next.js standalone трассировщик не видит вложенные subpackages, если они не hoisted в корень.

Решение: В .npmrc добавлены public-hoist-pattern для native subpackages:
```
public-hoist-pattern[]=@node-rs/argon2-*
public-hoist-pattern[]=@img/sharp-*
public-hoist-pattern[]=@img/sharp-libvips-*
```

Pnpm создаёт симлинки node_modules/@node-rs/argon2-linux-arm64-gnu и т.д., и трассировщик их копирует в standalone.

## Cross-architecture билды

Docker build происходит на архитектуре хоста (arm64 на M-series Mac, amd64 на x86 Linux). Устанавливаются только prebuilt binaries для этой архитектуры.

Для деплоя на другую архитектуру (например, билд на M1 Mac → amd64 prod сервер):
```bash
docker buildx build --platform linux/amd64 -t lunchhunter:latest .
```

Pnpm install внутри эмулируемого контейнера установит правильные @node-rs/argon2-linux-x64-gnu и @img/sharp-linux-x64.

## Использование

### Первое развёртывание на чистый сервер

```bash
# На прод-сервере (только docker engine):
git clone <repo> lunchhunter
cd lunchhunter
cp .env.example .env
$EDITOR .env  # заполнить PORT, ADMIN_PASSWORD, OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN

docker compose up -d --build
```

Первый запуск:
1. docker собирает образ (с установкой build-essential, pnpm install, db:migrate, db:seed, pnpm build)
2. Контейнер стартует — entrypoint копирует template в volume
3. Admin создаётся с паролем из .env
4. Next.js сервер стартует на PORT из .env

### Смена пароля admin

```bash
$EDITOR .env  # изменить ADMIN_PASSWORD
docker compose up -d --force-recreate
```

При старте admin-upsert.mjs обновит password_hash.

### Смена порта

```bash
$EDITOR .env  # изменить PORT
docker compose up -d --force-recreate
```

### Обновление кода (новые миграции)

⚠️ На данный момент если схема изменилась между версиями, нужна ручная миграция:
```bash
docker compose exec app sh -c 'cd /app && node ...'  # TODO
```

Автоматические миграции existing-базы не реализованы (template используется только при первом запуске). Для MVP это приемлемо. В будущем можно добавить compile миграций через esbuild в builder stage и вызов их в entrypoint.sh.