# next.config.ts

Конфигурация Next.js 15 с PWA через @serwist/next и production-настройками для Docker.

## Основные настройки

- reactStrictMode: true — React strict mode для обнаружения проблем в dev
- output: 'standalone' — минимальный self-contained артефакт в .next/standalone для Docker-образов (server.js + только необходимые файлы из node_modules, без полного node_modules)
- experimental.typedRoutes: true — типизированные ссылки между страницами
- serverExternalPackages: ['better-sqlite3'] — нативный SQLite binding не должен бандлиться Next.js

## outputFileTracingIncludes

Гарантированно включает в standalone-сборку .node бинарники нативных модулей, которые автоматический трассировщик может пропустить:
- node_modules/better-sqlite3/**/* — SQLite native binding
- node_modules/sharp/**/* — Image processing для /api/admin/upload
- node_modules/@node-rs/argon2/**/* + @node-rs/argon2-*/**/* — Rust-based password hashing для auth

Применяется к глобу '/*' — все роуты.

## Revision для precache

Определяется по приоритету (для инвалидации service worker precache при каждом билде):
1. process.env.BUILD_REVISION — передаётся через Docker build arg (docker-compose.yml args.BUILD_REVISION)
2. git rev-parse HEAD — локальные билды в git-репо
3. randomUUID() — fallback если ни того, ни другого нет

Hardcoded 'v1' приводил к stale precache: после rebuild'а HTML /offline ссылался на новые чанки, а старый SW отдавал старый HTML.

## withSerwistInit (PWA)

Обёртка @serwist/next генерирует public/sw.js из src/app/sw.ts:
- cacheOnNavigation: true — кеш при навигации
- reloadOnOnline: false — не форсить reload при возврате online
- disable: process.env.NODE_ENV === 'development' — SW отключён в dev
- additionalPrecacheEntries: [{ url: '/offline', revision }] — precache fallback-страницы

## rewrites()

- /dev-sw.js → /api/dev-sw — заглушка для старых PWA-клиентов. Serwist в dev отключён, но ранее установленный SW может стучаться в /dev-sw.js. Отдаём самораспаковывающийся stub через api route (Next.js не любит точку в имени сегмента, поэтому используем rewrite).

## Связи

- src/app/sw.ts — swSrc для Serwist
- public/sw.js — swDest (генерируется)
- src/app/api/dev-sw/route.ts — stub для старых PWA-клиентов
- Dockerfile — использует output: 'standalone' для сборки
- docker-compose.yml — передаёт BUILD_REVISION через build args
