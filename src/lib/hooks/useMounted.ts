"use client";

import { useEffect, useState } from "react";

/**
 * useMounted — task hydration helper.
 *
 * Возвращает `false` на первом (SSR/первом клиентском) рендере и `true`
 * после монтирования компонента. Используется в анимациях, которые зависят
 * от `window`/`document` или должны запуститься только после того, как
 * React гидратировал DOM, — чтобы избежать SSR/CSR mismatch и не показывать
 * "мёртвую" анимацию в первом кадре после hydration.
 *
 * Паттерн: hoisted pattern из гайда анимаций §6.1.
 *
 * @example
 * ```tsx
 * const mounted = useMounted();
 * if (!mounted) return null; // или плейсхолдер без анимаций
 * return <AnimatedComponent />;
 * ```
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
