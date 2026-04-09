# src/lib/transitions.ts

Утилиты плавной навигации между маршрутами. Canonical набор функций после рефакторинга под ANIMATIONS_GUIDE — содержит ровно 4 экспорта и 1 интерфейс, без legacy wrapper-ов.

# Стратегия

- VT API поддерживается (Chrome/Edge 111+, Safari 18+) → startTransition(() => router.push(href)). Нативный @view-transition { navigation: auto } из globals.css автоматически подхватывает переход.
- VT API отсутствует (Telegram Mini App, старые WebView) И есть sourceEl + targetSelector → manualFlipMorph через Web Animations API.
- prefers-reduced-motion: reduce → мгновенный router.push без анимаций.

# Экспорты

## prefersReducedMotion(): boolean
SSR-safe синхронная проверка media query prefers-reduced-motion: reduce. На сервере (typeof window === undefined) возвращает false. В браузере читает window.matchMedia(...).matches. Для реактивного отслеживания есть отдельный хук usePrefersReducedMotion.

## supportsViewTransitions(): boolean
Feature detection нативного View Transitions API. Проверяет typeof document.startViewTransition === "function". SSR-safe (typeof document === undefined → false).

## interface NavigateOptions
Опции для manualFlipMorph fallback:
- sourceEl?: HTMLElement | null — нажатая карточка или обёртка с data-vt-morph-source.
- targetSelector?: string — CSS-селектор финального элемента на новой странице (обычно [data-vt-target="restaurant-hero"]).

## navigate(router, href, options?): void
Навигация с гарантированным морфом на любом устройстве. Четыре ветки:
1. prefers-reduced-motion → router.push без анимаций.
2. VT API → startTransition(() => router.push(href)).
3. Отсутствие VT API + source + target + Element.prototype.animate → void manualFlipMorph({ sourceEl, targetSelector, navigate: () => startTransition(() => router.push(href)) }).
4. Иначе — просто startTransition(() => router.push(href)).

## navigateBack(router, fallbackHref): void
Back-навигация. Логика:
- SSR (typeof window === undefined) → router.push(fallbackHref).
- window.history.length <= 1 → делегирует на navigate(router, fallbackHref).
- prefers-reduced-motion → router.back() (sync).
- Иначе → startTransition(() => router.back()) (VT API сам подхватит history navigation через @view-transition navigation: auto).

# Зависимости
- react (startTransition)
- next/dist/shared/lib/app-router-context.shared-runtime (AppRouterInstance тип)
- @/lib/morph (manualFlipMorph)

# Используется в
- src/components/ui/BackButton.tsx — navigateBack с fallback на "/"
- src/lib/hooks/useHaptics.ts — импорт prefersReducedMotion
- Все клиентские консьюмеры shared-element morph: NearbyRestaurantsRow, DesktopPopularRestaurantsGrid, DesktopSearchResults, MobileSearchResults, MobileMapView — импорт navigate + supportsViewTransitions для Telegram WebView fallback в собственных onClick.
