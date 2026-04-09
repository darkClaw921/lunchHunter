"use client";

import { useCallback } from "react";
import { manualFlipMorph } from "@/lib/morph";

/**
 * Опции вызова FLIP morph — передаются в возвращённую из `useFlipMorph`
 * функцию при клике.
 *
 * - `sourceEl` — нажатая карточка (или её cover-обёртка). Может быть `null`,
 *   в этом случае хук просто запускает `navigate()` без анимации.
 * - `targetSelector` — CSS-селектор финального элемента (обычно
 *   `[data-vt-target="restaurant-hero"]`), который появится на новой
 *   странице после навигации.
 * - `navigate` — функция, запускающая реальный переход (обычно обёртка
 *   над `router.push(href)`).
 */
interface UseFlipMorphOptions {
  sourceEl: HTMLElement | null;
  targetSelector: string;
  navigate: () => void;
}

/**
 * useFlipMorph — тонкая React-обёртка над `manualFlipMorph` из `@/lib/morph`.
 *
 * Зачем хук, а не прямой вызов функции:
 * - Возвращает стабильный callback через `useCallback([])`, который можно
 *   безопасно класть в `onClick` без провоцирования ре-рендеров.
 * - Инкапсулирует проверку `sourceEl == null`: если source отсутствует
 *   (например, ref ещё не разрешился), хук просто запускает `navigate()`
 *   без попытки морфа. Это упрощает код консьюмеров — им не нужно
 *   дублировать этот guard в каждом onClick.
 *
 * Используется в консьюмерах, которые нуждаются в Telegram Mini App fallback
 * (когда нативный View Transitions API недоступен). На устройствах с VT API
 * обычно предпочтительнее просто использовать `navigate()` из
 * `@/lib/transitions`, который сам разберётся с выбором стратегии.
 *
 * @example
 * ```tsx
 * const startFlipMorph = useFlipMorph();
 * const cardRef = useRef<HTMLDivElement>(null);
 * const router = useRouter();
 * const onClick = () => startFlipMorph({
 *   sourceEl: cardRef.current,
 *   targetSelector: '[data-vt-target="restaurant-hero"]',
 *   navigate: () => router.push(`/restaurant/${id}`),
 * });
 * ```
 */
export function useFlipMorph(): (opts: UseFlipMorphOptions) => Promise<void> {
  return useCallback(async (opts) => {
    if (!opts.sourceEl) {
      opts.navigate();
      return;
    }
    await manualFlipMorph({
      sourceEl: opts.sourceEl,
      targetSelector: opts.targetSelector,
      navigate: opts.navigate,
    });
  }, []);
}
