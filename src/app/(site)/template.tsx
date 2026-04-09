"use client";

import * as React from "react";

/**
 * `(site)` route template — минимальный pass-through wrapper.
 *
 * Как это работает:
 * - Next.js App Router для каждой навигации внутри той же route group
 *   заново монтирует `template.tsx` (в отличие от `layout.tsx`, который
 *   сохраняет состояние).
 * - Анимация cross-fade между маршрутами обеспечивается нативно через
 *   `@view-transition { navigation: auto }` в `src/app/globals.css`.
 *   Браузер автоматически делает snapshot старой страницы, монтирует
 *   новую и кроссфейдит root между ними.
 * - Под `prefers-reduced-motion: reduce` браузер отключает VT анимации
 *   автоматически (настроено в globals.css).
 *
 * Этот template больше не добавляет собственных CSS-анимаций:
 * предыдущая JS/CSS fade-анимация удалена в Phase 1,
 * её роль полностью покрывает нативный View Transitions API.
 */
export default function SiteTemplate({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <>{children}</>;
}
