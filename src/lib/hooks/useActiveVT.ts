"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * `useActiveVT` — хук для управления «активной» карточкой, которой
 * выставляется `view-transition-name` в момент клика.
 *
 * Зачем: по ANIMATIONS_GUIDE §9.5.3 `view-transition-name` должен быть
 * уникальным в момент snapshot'а. Если постоянно держать имя на всех
 * карточках списка, при soft-навигации Next.js в DOM на короткий момент
 * могут жить одновременно и старая карточка-источник, и hero на новом
 * экране с одним и тем же именем → Chrome/Safari бросают
 * `InvalidStateError: Transition was aborted because of invalid state`.
 *
 * Решение: держать имя только на той карточке, по которой кликнули. До
 * клика `activeId === null` → ни одна карточка не имеет VT-имени. В
 * момент клика вызываем `activate(id)` — **synchronously** через
 * `flushSync`, чтобы React закоммитил новое состояние ДО того, как
 * браузер снимет snapshot «до». После snapshot'а React навигирует,
 * браузер монтирует detail-страницу с тем же именем → morph.
 *
 * Для back-навигации (detail → list) поддерживается `sessionStorage`:
 * перед `router.back()` в detail-компоненте вызывается
 * `rememberActiveForBack(id)`, а на списке при монтировании
 * `useActiveVT(storageKey)` читает значение из storage в useEffect
 * и сразу применяет через setState. Это happens-before первого layout —
 * в Next.js Client Component useEffect выполняется между render и paint,
 * поэтому к моменту browser VT snapshot имя уже стоит в DOM.
 *
 * @param storageKey — ключ sessionStorage для back-навигации
 *                     (например `"lh:vt-active-restaurant"`)
 * @returns `{ activeId, activate, isActive }`
 *
 * @example
 * ```tsx
 * export function PlacesList({ items }: Props) {
 *   const { activeId, activate } = useActiveVT<number>(
 *     "lh:vt-active-restaurant",
 *   );
 *   return (
 *     <>
 *       {items.map((p) => (
 *         <PlaceCard
 *           key={p.id}
 *           item={p}
 *           isActive={activeId === p.id}
 *           onActivate={() => activate(p.id)}
 *         />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export interface UseActiveVTResult<TId> {
  /** Текущий активный id или null. */
  activeId: TId | null;
  /** Synchronously (через flushSync) выставляет активный id. */
  activate: (id: TId) => void;
  /** Shortcut для сравнения: `isActive(id)` === `activeId === id`. */
  isActive: (id: TId) => boolean;
}

export function useActiveVT<TId extends string | number>(
  storageKey: string,
): UseActiveVTResult<TId> {
  const [activeId, setActiveId] = useState<TId | null>(null);

  // При монтировании — если detail-страница перед back-навигацией положила
  // id в sessionStorage, поднимаем его в state и сразу очищаем storage,
  // чтобы при следующей forward-навигации старый id не всплыл.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem(storageKey);
    if (!stored) return;
    window.sessionStorage.removeItem(storageKey);
    // Числа → Number, строки оставляем как есть.
    const parsed = /^\d+$/.test(stored) ? (Number(stored) as TId) : (stored as TId);
    setActiveId(parsed);
  }, [storageKey]);

  const activate = useCallback((id: TId) => {
    // flushSync гарантирует, что новое `view-transition-name` появится
    // в DOM до того, как браузер снимет snapshot «до» в результате
    // последующей soft-навигации.
    flushSync(() => setActiveId(id));
  }, []);

  const isActive = useCallback(
    (id: TId) => activeId === id,
    [activeId],
  );

  return { activeId, activate, isActive };
}

/**
 * Записывает id «активной» карточки в sessionStorage перед back-навигацией.
 * Вызывается в detail-компонентах из `onClick` у BackButton перед
 * `router.back()` — так `useActiveVT` на списке при монтировании поднимет
 * этот id в state и браузер успеет снять snapshot «после» с уже
 * выставленным `view-transition-name` на нужной карточке.
 *
 * SSR-safe: на сервере window не существует — ранний выход.
 */
export function rememberActiveForBack(
  storageKey: string,
  id: string | number,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(storageKey, String(id));
  } catch {
    // sessionStorage недоступен (Safari private mode) — ignore.
  }
}

/** Стандартный ключ storage для VT активной карточки ресторана. */
export const ACTIVE_RESTAURANT_VT_STORAGE_KEY = "lh:vt-active-restaurant";
