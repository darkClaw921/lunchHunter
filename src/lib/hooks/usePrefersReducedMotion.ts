"use client";

import { useEffect, useState } from "react";

/**
 * usePrefersReducedMotion — реактивный хук, отслеживающий пользовательскую
 * настройку `prefers-reduced-motion: reduce`.
 *
 * В отличие от синхронной `prefersReducedMotion()` из `@/lib/transitions`,
 * этот хук реактивно перерисовывает компонент при смене настройки:
 * подписывается на `change` event у `MediaQueryList` и снимает подписку
 * в cleanup. Это позволяет анимациям мгновенно отключаться, когда
 * пользователь переключает системную настройку (или DevTools Rendering
 * → Emulate prefers-reduced-motion), без перезагрузки страницы.
 *
 * Паттерн из гайда анимаций §6.2.
 *
 * SSR-safe: первый рендер (в SSR и на клиенте до hydration) возвращает
 * `false`, только после `useEffect` читает реальное значение media query.
 * `addEventListener` / `removeEventListener` на `MediaQueryList` поддержаны
 * Safari 14+ — fallback на устаревший `addListener` не требуется.
 *
 * @example
 * ```tsx
 * const reduce = usePrefersReducedMotion();
 * return <div className={reduce ? "" : "animate-fade-in"}>…</div>;
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent): void => setReduce(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduce;
}
