"use client";

import { startTransition } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { manualFlipMorph } from "@/lib/morph";

/**
 * Утилиты для плавной навигации в проекте lunchHunter.
 *
 * Стратегия:
 * - Если браузер поддерживает View Transitions API → используется нативный
 *   `@view-transition { navigation: auto }` (см. globals.css). Wrapper нужен
 *   только для startTransition, чтобы Next.js не блокировал UI на async route.
 * - Если VT API недоступен (Telegram Mini App, старые WebView) И есть source+target
 *   → manual FLIP morph через `manualFlipMorph` из morph.ts.
 * - prefers-reduced-motion: reduce → мгновенный router.push без анимаций.
 */

/**
 * Проверка prefers-reduced-motion (SSR-safe).
 * На сервере всегда возвращает false.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Поддерживает ли браузер нативный View Transitions API.
 * Chrome/Edge 111+, Safari 18+. Telegram Mini App обычно не поддерживает.
 */
export function supportsViewTransitions(): boolean {
  if (typeof document === "undefined") return false;
  return typeof document.startViewTransition === "function";
}

/**
 * Опции для navigate(): визуальный источник и селектор цели для FLIP morph
 * fallback на устройствах без View Transitions API.
 *
 * - sourceEl: HTMLElement — нажатая карточка (или обёртка с
 *   `data-vt-morph-source`). Используется как source для FLIP clone.
 * - targetSelector: CSS-селектор финального элемента на новой странице
 *   (обычно `[data-vt-target="restaurant-hero"]`).
 */
export interface NavigateOptions {
  sourceEl?: HTMLElement | null;
  targetSelector?: string;
}

/**
 * Навигация с гарантированным морфом на любом устройстве.
 *
 * Поведение:
 * 1. Если `prefers-reduced-motion: reduce` → `router.push(href)` без анимаций.
 * 2. Если браузер поддерживает View Transitions API → `startTransition(() =>
 *    router.push(href))`. Нативный `@view-transition { navigation: auto }`
 *    из globals.css сам подхватит переход и анимирует именованные элементы.
 * 3. Иначе (Telegram Mini App, старые WebView) и если переданы `sourceEl` +
 *    `targetSelector` → `manualFlipMorph` (FLIP через Web Animations API):
 *    клонирует source в overlay, запускает навигацию, ждёт появления target,
 *    анимирует клон к финальной позиции.
 * 4. Иначе — просто `startTransition(() => router.push(href))` без морфа.
 *
 * @example
 * ```ts
 * navigate(router, "/restaurant/abc", {
 *   sourceEl: cardRef.current,
 *   targetSelector: '[data-vt-target="restaurant-image-abc"]',
 * });
 * ```
 */
export function navigate(
  router: AppRouterInstance,
  href: string,
  options?: NavigateOptions,
): void {
  if (typeof document === "undefined" || prefersReducedMotion()) {
    router.push(href);
    return;
  }

  // Native VT API: браузер сам подхватит navigation через @view-transition.
  // startTransition нужен для async-friendly Next.js routing.
  if (supportsViewTransitions()) {
    startTransition(() => router.push(href));
    return;
  }

  // Telegram Mini App fallback: manual FLIP morph если есть source+target.
  if (
    options?.sourceEl &&
    options?.targetSelector &&
    typeof Element.prototype.animate === "function"
  ) {
    void manualFlipMorph({
      sourceEl: options.sourceEl,
      targetSelector: options.targetSelector,
      navigate: () => startTransition(() => router.push(href)),
    });
    return;
  }

  // Простой fallback без морфа.
  startTransition(() => router.push(href));
}

/**
 * Back-навигация с морфом. На устройствах с VT API браузер автоматически
 * подхватит history navigation через `@view-transition { navigation: auto }`.
 * На устройствах без VT — обычный router.back().
 *
 * Если в истории нет записи (прямое открытие страницы по ссылке) — делегирует
 * на `navigate(router, fallbackHref)`, чтобы не застрять на детальной странице.
 *
 * @param router — AppRouterInstance из next/navigation
 * @param fallbackHref — путь для случая, когда history пуст (обычно "/")
 */
export function navigateBack(
  router: AppRouterInstance,
  fallbackHref: string,
): void {
  if (typeof window === "undefined") {
    router.push(fallbackHref);
    return;
  }
  if (window.history.length <= 1) {
    navigate(router, fallbackHref);
    return;
  }
  if (prefersReducedMotion()) {
    router.back();
    return;
  }
  startTransition(() => router.back());
}

