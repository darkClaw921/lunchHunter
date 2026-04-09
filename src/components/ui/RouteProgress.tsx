"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * RouteProgress — тонкая accent-полоска фиксированная сверху экрана,
 * которая показывает пользователю, что идёт навигация между страницами.
 *
 * Поведение:
 * - Слушает глобальное событие `routeprogress:start`, которое
 *   диспатчит кастомный триггер навигации (`dispatchRouteProgressStart`)
 *   перед началом перехода. В текущем проекте вызывается из обёрток над
 *   `<Link>` (если нужна ручная прогресс-полоска) и из `BackButton`.
 * - Через `PROGRESS_DELAY_MS` (120 мс) после получения события включает
 *   полоску. Задержка важна: при кеш-хитах Next.js навигация завершается
 *   быстрее, и пользователь не увидит раздражающего мелькания.
 * - Имитирует прогресс через `requestAnimationFrame`: полоска "заполняется"
 *   по кривой насыщения (стремится к 85% за ~1.5 сек и там остаётся,
 *   пока не придёт сигнал о завершении).
 * - Слушает `usePathname()`: когда `pathname` меняется — значит Next.js
 *   отрендерил новый сегмент, полоска скачком уходит на 100% и плавно
 *   исчезает (opacity 0 через 220 мс).
 * - Под `prefers-reduced-motion: reduce` CSS-переходы сами собой короче,
 *   логика остаётся той же; визуально это выглядит как instant on/off.
 *
 * Позиционирование:
 * - `fixed inset-x-0 top-0 h-0.5` — 2px полоска на всю ширину.
 * - `z-50` — выше основного контента и BottomTabBar (z-40).
 * - `pointer-events-none` — не перехватывает клики.
 *
 * Использование:
 * ```tsx
 * // src/app/(site)/layout.tsx
 * import { RouteProgress } from "@/components/ui/RouteProgress";
 * // ...
 * <RouteProgress />
 * ```
 */

/** Имя кастомного события, которое слушает {@link RouteProgress}. Диспатчится
 * через {@link dispatchRouteProgressStart} из потребителей навигации. */
export const ROUTE_PROGRESS_START_EVENT = "routeprogress:start";

/**
 * Минимальная задержка перед показом полоски, мс. Должна быть очень
 * маленькой — это про мгновенный отклик, а не про "анти-мерцание".
 * Анти-мерцание решается на этапе finishing: если pathname сменился
 * быстрее чем за PROGRESS_MIN_VISIBLE_MS, полоска "дожимается" вместо
 * раннего скрытия.
 */
const PROGRESS_DELAY_MS = 16; // ровно один кадр @60fps

/**
 * Минимальное время видимости полоски, мс. Если навигация завершилась
 * быстрее — продлеваем display, чтобы не мелькало.
 */
const PROGRESS_MIN_VISIBLE_MS = 180;

/** Целевое значение, до которого "имитируется" прогресс пока навигация идёт. */
const PROGRESS_CAP = 85;

/** Шаг приращения прогресса за один rAF-тик, когда < PROGRESS_CAP. */
const PROGRESS_STEP = 0.9;

/** Длительность fade-out в фазе finishing, мс. Эквивалент `--dur-base`
 * (240ms из ANIMATIONS_GUIDE §1.1). Константа нужна и в `setTimeout`,
 * и в inline-`transition` одновременно, поэтому повторяем тут.
 * Если `--dur-base` поменяется в globals.css — поменять и здесь. */
const PROGRESS_FINISH_HIDE_MS = 240;

type ProgressState = "idle" | "delayed" | "active" | "finishing";

export interface RouteProgressProps {
  /** Доп. className для корневого div (например — переопределение z-index). */
  className?: string;
}

/**
 * Диспатчит сигнал о старте навигации — {@link RouteProgress} подхватит
 * его и покажет прогресс-полоску. Вынесено в отдельную функцию, чтобы
 * любой клиентский потребитель (обёртка над `<Link>`, `BackButton`,
 * программная `router.push`) мог её импортировать без дублирования
 * строки-константы имени события.
 *
 * Безопасно для SSR: на сервере `window` не существует — ранний выход.
 */
export function dispatchRouteProgressStart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ROUTE_PROGRESS_START_EVENT));
}

export function RouteProgress({
  className,
}: RouteProgressProps = {}): React.JSX.Element {
  const pathname = usePathname();
  const [state, setState] = React.useState<ProgressState>("idle");
  const [progress, setProgress] = React.useState(0);

  // Храним последний pathname, чтобы различать "первый рендер" и реальный переход.
  const lastPathnameRef = React.useRef<string | null>(null);
  const delayTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = React.useRef<number | null>(null);
  /** Время старта навигации (performance.now()) — чтобы гарантировать минимум видимости. */
  const startTimeRef = React.useRef<number>(0);

  // Слушаем глобальное событие старта навигации.
  React.useEffect(() => {
    const handleStart = (): void => {
      // Если уже идёт навигация — не сбрасываем, просто продолжаем.
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);

      startTimeRef.current = performance.now();
      // Начальный прогресс 12% — чтобы пользователь мгновенно увидел "что-то
      // началось" вместо нулевой полоски.
      setProgress(12);
      setState("delayed");

      delayTimerRef.current = setTimeout(() => {
        setState("active");
      }, PROGRESS_DELAY_MS);
    };

    window.addEventListener(ROUTE_PROGRESS_START_EVENT, handleStart);
    return () => {
      window.removeEventListener(ROUTE_PROGRESS_START_EVENT, handleStart);
      if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Анимация приращения прогресса в `active` фазе.
  React.useEffect(() => {
    if (state !== "active") return;

    const tick = (): void => {
      setProgress((prev) => {
        if (prev >= PROGRESS_CAP) return prev;
        // Замедление по мере приближения к PROGRESS_CAP.
        const remaining = PROGRESS_CAP - prev;
        const increment = Math.max(0.2, (remaining / PROGRESS_CAP) * PROGRESS_STEP);
        return Math.min(PROGRESS_CAP, prev + increment);
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [state]);

  // Завершение навигации: когда pathname поменялся — дожимаем до 100% и прячем.
  React.useEffect(() => {
    if (lastPathnameRef.current === null) {
      lastPathnameRef.current = pathname;
      return;
    }
    if (lastPathnameRef.current === pathname) return;
    lastPathnameRef.current = pathname;

    // Прерываем фазу задержки, если она ещё идёт.
    if (delayTimerRef.current) {
      clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Если полоска ещё в фазе delayed — переходим сразу в finishing,
    // чтобы пользователь увидел завершение, а не пустоту (даже на быстрых
    // навигациях должен быть короткий "чик" обратной связи).
    // Гарантируем минимум видимости PROGRESS_MIN_VISIBLE_MS.
    if (state === "idle") {
      setState("idle");
      setProgress(0);
      return;
    }

    const elapsed = performance.now() - startTimeRef.current;
    const remainingMinVisible = Math.max(0, PROGRESS_MIN_VISIBLE_MS - elapsed);

    // Фаза finishing: скачок на 100%, затем скрытие.
    setState("finishing");
    setProgress(100);

    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    // PROGRESS_FINISH_HIDE_MS = --dur-base (240ms) — время на fade-out
    // полоски в финишной фазе. Должно совпадать с durations в `transition`
    // ниже, чтобы таймер срабатывал после того, как opacity доехала до 0.
    finishTimerRef.current = setTimeout(() => {
      setState("idle");
      setProgress(0);
      finishTimerRef.current = null;
    }, PROGRESS_FINISH_HIDE_MS + remainingMinVisible);
  }, [pathname, state]);

  const visible =
    state === "delayed" || state === "active" || state === "finishing";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "fixed inset-x-0 top-0 h-[3px] bg-accent origin-left pointer-events-none z-50",
        className,
      )}
      style={{
        transform: `scaleX(${progress / 100})`,
        opacity: visible ? 1 : 0,
        boxShadow: "0 0 8px rgba(255, 92, 0, 0.55), 0 0 2px rgba(255, 92, 0, 0.9)",
        // Все transitions — через токены --dur-* и --ease-* (ANIMATIONS_GUIDE §1.1).
        // Никакой CSS-built-in `ease-out`/`ease`, никаких magic numbers (220/180/120).
        transition:
          state === "finishing"
            ? "transform var(--dur-base) var(--ease-out-quart), opacity var(--dur-base) var(--ease-out-quart) var(--dur-instant)"
            : state === "active"
              ? "transform var(--dur-fast) var(--ease-out-quart), opacity var(--dur-fast) var(--ease-out-quart)"
              : "opacity var(--dur-instant) var(--ease-out-quart)",
        willChange: "transform, opacity",
      }}
    />
  );
}
