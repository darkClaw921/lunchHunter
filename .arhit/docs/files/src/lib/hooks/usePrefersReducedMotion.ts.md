# src/lib/hooks/usePrefersReducedMotion.ts

Реактивный хук ("use client") для отслеживания prefers-reduced-motion: reduce.

# Экспорты
- usePrefersReducedMotion(): boolean

# Отличие от prefersReducedMotion из transitions.ts
В отличие от синхронной prefersReducedMotion() из src/lib/transitions.ts, этот хук подписывается на change event у MediaQueryList и перерисовывает компонент при смене настройки — анимации мгновенно отключаются без перезагрузки страницы.

# Реализация
- useState(false) на первом рендере (SSR-safe — на сервере window нет).
- useEffect: window.matchMedia("(prefers-reduced-motion: reduce)"), setState(mql.matches), mql.addEventListener("change", handler), cleanup через removeEventListener.
- addEventListener/removeEventListener поддержаны Safari 14+, устаревший addListener не нужен.

# Файл
src/lib/hooks/usePrefersReducedMotion.ts

# Используется
- Client компоненты, которые должны реактивно отключать анимации по accessibility settings без перезагрузки страницы.
