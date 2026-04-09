# navigate

Навигация с гарантированным морфом на любом устройстве (src/lib/transitions.ts).

Сигнатура: navigate(router: AppRouterInstance, href: string, options?: NavigateOptions): void

Стратегия (4 ветки):
1. SSR (typeof document === undefined) OR prefers-reduced-motion: reduce → router.push(href) без анимаций.
2. supportsViewTransitions() === true → startTransition(() => router.push(href)). Нативный @view-transition { navigation: auto } из globals.css автоматически подхватит переход и анимирует viewTransitionName элементы.
3. VT API недоступен И переданы sourceEl + targetSelector + Element.prototype.animate доступен → void manualFlipMorph({ sourceEl, targetSelector, navigate: () => startTransition(() => router.push(href)) }). FLIP через Web Animations API для Telegram Mini App/legacy WebView.
4. Иначе → startTransition(() => router.push(href)) без морфа.

startTransition нужен чтобы Next.js App Router не блокировал UI на async route. Canonical replacement для legacy navigateWithViewTransition (удалён в Phase 2). Legacy constants VT_COMMIT_WAIT_MS, FALLBACK_LAUNCH_DELAY_MS удалены.

Зависимости: react (startTransition), next (AppRouterInstance тип), @/lib/morph (manualFlipMorph).

Используется в: BackButton, useHaptics (prefersReducedMotion импорт), NearbyRestaurantsRow, DesktopPopularRestaurantsGrid, DesktopSearchResults, MobileSearchResults, MobileMapView.
