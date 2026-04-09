# src/components/ServiceWorkerCleanup.tsx

Невидимый client-компонент для dev-режима. Unregister'ит все активные Service Worker'ы и чистит все кэши через caches API.

## Зачем нужен

В next.config.ts serwist отключён в dev (disable: NODE_ENV === 'development') — новый sw.js не генерируется. Но физический public/sw.js может остаться от предыдущего next build и Next.js раздаёт его как static-file из public/. Браузер, у которого зарегистрирован SW от прошлой prod-сессии, будет перехватывать fetch'и в dev и возвращать старые (prod) чанки из кэша. Хеши чанков в dev и prod разные → 404 на JS → белый экран.

## Как работает

- 'use client' компонент, возвращает null
- В useEffect вызывает navigator.serviceWorker.getRegistrations() и для каждой unregister()
- Затем caches.keys() → для каждого caches.delete(key)
- Все ошибки глушатся (API может быть недоступно)

## Подключение

В src/app/layout.tsx импортируется и рендерится условно: {IS_DEV ? <ServiceWorkerCleanup /> : null}. Константа IS_DEV = process.env.NODE_ENV === 'development' определена на уровне модуля — при prod build Next.js tree-shake'ает компонент из клиентского bundle.

## Зависимости

- react (useEffect)
- Используется из src/app/layout.tsx

## Ограничения

- Не блокирует рендер — cleanup асинхронный, первая dev-навигация может ещё пройти через старый SW до unregister
- После первой загрузки dev-сессии SW будет снят полностью
