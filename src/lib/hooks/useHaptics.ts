"use client";

import { useCallback, useMemo } from "react";
import { prefersReducedMotion } from "@/lib/transitions";

/**
 * Тактильная обратная связь (haptic feedback) — кросс-платформенный хук.
 *
 * Поддерживает:
 * 1. Telegram Mini App (`window.Telegram.WebApp.HapticFeedback`) — основной
 *    канал на мобильных устройствах внутри Telegram: работает и на iOS,
 *    и на Android, даёт осязаемую тактильную отдачу.
 * 2. Web-стандарт `navigator.vibrate([...])` — Chrome/Edge на Android,
 *    Firefox на Android. На iOS Safari просто игнорируется.
 * 3. No-op fallback, когда ни один канал не доступен.
 *
 * Все вызовы уважают `prefers-reduced-motion: reduce` — если пользователь
 * его включил, вибрация полностью подавляется.
 *
 * Хук безопасен для SSR: все обращения к `window`/`navigator` — внутри
 * коллбэков, которые вызываются только на клиенте при пользовательском
 * взаимодействии.
 */

/**
 * Тип тактильной обратной связи:
 * - `tap` — основной тап по элементу (средняя вибрация).
 * - `light` — лёгкий тап (мягкая вибрация).
 * - `selection` — переключение (выбор в списке/табах/чипах).
 * - `success` — успешное завершение действия (паттерн вибрации).
 * - `warning` — предупреждение.
 * - `error` — ошибка.
 */
export type HapticKind =
  | "tap"
  | "light"
  | "selection"
  | "success"
  | "warning"
  | "error";

/** Минимальный интерфейс Telegram WebApp.HapticFeedback API. */
interface TelegramHapticFeedback {
  impactOccurred: (
    style: "light" | "medium" | "heavy" | "rigid" | "soft",
  ) => void;
  notificationOccurred: (type: "success" | "warning" | "error") => void;
  selectionChanged: () => void;
}

interface TelegramWebApp {
  HapticFeedback?: TelegramHapticFeedback;
}

interface TelegramNamespace {
  WebApp?: TelegramWebApp;
}

interface WindowWithTelegram {
  Telegram?: TelegramNamespace;
}

function getTelegramHapticFeedback(): TelegramHapticFeedback | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & WindowWithTelegram;
  return w.Telegram?.WebApp?.HapticFeedback ?? null;
}

function triggerHaptic(kind: HapticKind): void {
  const tg = getTelegramHapticFeedback();
  if (tg) {
    if (kind === "success" || kind === "warning" || kind === "error") {
      tg.notificationOccurred(kind);
    } else if (kind === "selection") {
      tg.selectionChanged();
    } else {
      tg.impactOccurred(kind === "tap" ? "medium" : "light");
    }
    return;
  }

  if (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    !prefersReducedMotion()
  ) {
    const pattern: number | number[] =
      kind === "success" ? [8, 40, 8] : 8;
    navigator.vibrate(pattern);
  }
}

/**
 * API хука: набор методов для каждого вида тактильной обратной связи.
 * Все методы стабильны между рендерами (useCallback + useMemo).
 */
export interface HapticsApi {
  tap: () => void;
  light: () => void;
  selection: () => void;
  success: () => void;
  warning: () => void;
  error: () => void;
}

/**
 * Хук `useHaptics` — возвращает стабильный объект с методами для вызова
 * тактильной обратной связи. Использовать в client component в обработчиках
 * пользовательских событий (onClick, onPointerDown и т.п.).
 *
 * Пример:
 * ```tsx
 * const haptics = useHaptics();
 * <button onClick={() => { haptics.tap(); doAction(); }}>OK</button>
 * ```
 */
export function useHaptics(): HapticsApi {
  const tap = useCallback(() => triggerHaptic("tap"), []);
  const light = useCallback(() => triggerHaptic("light"), []);
  const selection = useCallback(() => triggerHaptic("selection"), []);
  const success = useCallback(() => triggerHaptic("success"), []);
  const warning = useCallback(() => triggerHaptic("warning"), []);
  const error = useCallback(() => triggerHaptic("error"), []);

  return useMemo(
    () => ({ tap, light, selection, success, warning, error }),
    [tap, light, selection, success, warning, error],
  );
}
