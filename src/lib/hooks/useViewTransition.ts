"use client";

import { flushSync } from "react-dom";

/**
 * useViewTransition — обёртка над `document.startViewTransition` для
 * НЕ-навигационных state-переходов (theme switch, accordion expand/collapse,
 * tab switch, filter apply и т.п.).
 *
 * Зачем это отдельный хук:
 * - Нативный `document.startViewTransition(cb)` ожидает, что к моменту
 *   следующего кадра DOM уже обновится. React по умолчанию может отложить
 *   state update (concurrent mode), и тогда VT API снимает snapshot
 *   до того, как новое состояние будет применено — анимация получается
 *   неверной ("флажок" между старым и старым).
 * - `flushSync(callback)` форсирует синхронный flush React updates ВНУТРИ
 *   VT-коллбэка. После этого VT API видит правильный новый DOM и снимает
 *   финальный snapshot корректно.
 *
 * Для НАВИГАЦИОННЫХ переходов этот хук НЕ нужен — там работает
 * `@view-transition { navigation: auto }` в CSS + `startTransition`
 * из React (см. `navigate()` в `@/lib/transitions`).
 *
 * Graceful fallback: если `document.startViewTransition` недоступен
 * (Telegram Mini App, старые WebView), коллбэк вызывается напрямую
 * без анимации. SSR-safe: если `document === undefined`, также просто
 * вызывает коллбэк.
 *
 * Паттерн из гайда анимаций §6.3.
 *
 * @example
 * ```tsx
 * const startVT = useViewTransition();
 * const toggleTheme = (): void => {
 *   startVT(() => setTheme(theme === "light" ? "dark" : "light"));
 * };
 * ```
 */
export function useViewTransition(): (callback: () => void) => void {
  return (callback: () => void) => {
    if (typeof document === "undefined" || !document.startViewTransition) {
      callback();
      return;
    }
    document.startViewTransition(() => {
      flushSync(callback);
    });
  };
}
