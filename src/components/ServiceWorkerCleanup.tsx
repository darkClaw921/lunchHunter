"use client";

import { useEffect } from "react";

/**
 * ServiceWorkerCleanup — невидимый client-компонент, который в dev-режиме
 * unregister'ит все активные Service Worker'ы и чистит их кэши.
 *
 * Зачем это нужно:
 * - В `next.config.ts` serwist отключён в dev (`disable: NODE_ENV === "development"`)
 *   и не генерирует sw.js на лету. Но физический `public/sw.js` может остаться
 *   от предыдущего `next build` и Next.js раздаёт его как static-file из public/.
 * - Браузер, у которого остался зарегистрированный SW от прошлой prod-сессии,
 *   будет продолжать перехватывать fetch'и в dev и отдавать старые (prod) чанки
 *   из кэша. Хеши чанков в dev и prod разные → 404 на JS → белый экран.
 * - Этот компонент гарантированно снимает SW при каждом dev-заходе, чтобы
 *   следующий request за sw.js шёл нормально, а dev-страницы открывались без
 *   перехвата.
 *
 * В prod-режиме компонент полностью tree-shake'ится из bundle через условный
 * импорт в layout (process.env.NODE_ENV === "development").
 */
export function ServiceWorkerCleanup(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    void (async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // Игнорируем — если API недоступно, ничего не делаем.
      }
    })();
  }, []);

  return null;
}
