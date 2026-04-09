"use client";

import { useCallback } from "react";

/**
 * usePrefetchImage — image prefetch helper hook.
 *
 * Возвращает callback, который догружает указанный URL картинки в browser
 * image cache до того, как пользователь нажал на элемент. Используется на
 * карточках ресторанов в сочетании с onPointerEnter/onPointerDown, чтобы к
 * моменту клика hi-res hero-картинка уже была в кеше и морф через
 * View Transitions API не сопровождался flash of loading.
 *
 * Паттерн: "long-press prefetch" из ANIMATIONS_GUIDE §9.
 *
 * Реализация: создаёт `new window.Image()` (не добавляется в DOM) и
 * присваивает `img.src = url` — браузер обрабатывает такую загрузку как
 * обычный image request, кладёт ответ в HTTP/Image cache, и последующий
 * `<img src={sameUrl}>` читает байты из cache без нового network round-trip.
 *
 * SSR-safe: на сервере (`typeof window === "undefined"`) возвращает noop.
 * Null/undefined URL игнорируется — это удобно, когда coverUrl может быть
 * опциональным полем модели ресторана.
 *
 * @example
 * ```tsx
 * const prefetchImage = usePrefetchImage();
 *
 * <Link
 *   href={`/restaurant/${r.id}`}
 *   onPointerEnter={() => prefetchImage(r.coverUrl)}
 *   onPointerDown={() => prefetchImage(r.coverUrl)}
 * >
 *   ...
 * </Link>
 * ```
 */
export function usePrefetchImage(): (url: string | null | undefined) => void {
  return useCallback((url) => {
    if (!url || typeof window === "undefined") return;
    const img = new window.Image();
    img.src = url;
  }, []);
}
