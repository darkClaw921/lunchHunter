Итог рефакторинга системы анимаций lunchHunter под ANIMATIONS_GUIDE.md (10 фаз).

# Что было сделано

Полный рефакторинг системы анимаций: замена wrapper-компонентов с timing-костылями на нативные браузерные API, удаление anti-patterns, унификация через токены, глобальное press-feedback правило, универсальный prefers-reduced-motion.

# Токены (src/app/globals.css @theme)

## Длительности
- --dur-instant: 80ms (touch feedback)
- --dur-fast: 160ms (hover/focus, tooltip)
- --dur-base: 240ms (fade-in, root cross-fade)
- --dur-slow: 400ms (shared-element morph, hero-enter)

## Easing
- --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)
- --ease-in-quart: cubic-bezier(0.5, 0, 0.75, 0)
- --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
- --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
- --ease-snappy: cubic-bezier(0.2, 0.9, 0.3, 1.2)

## Animation utilities (Tailwind 4 animate-* classes)
- --animate-fade-in: fade-in var(--dur-base) var(--ease-out-quart) both
- --animate-pop-in: pop-in var(--dur-base) var(--ease-spring) both
- --animate-skeleton: skeleton-shimmer 1.4s ease-in-out infinite
- --animate-hero-enter: hero-enter var(--dur-slow) var(--ease-out-quart) both

# React-хуки (src/lib/hooks/)

## useMounted.ts
useMounted(): boolean — SSR/CSR mismatch guard. false на первом рендере, true после useEffect.

## usePrefersReducedMotion.ts
usePrefersReducedMotion(): boolean — реактивный флаг. Подписывается на change event у MediaQueryList.

## useViewTransition.ts
useViewTransition(): (callback: () => void) => void — обёртка над document.startViewTransition для не-навигационных state-переходов, с flushSync.

## useFlipMorph.ts
useFlipMorph(): (opts) => Promise<void> — стабильный useCallback, обёртка над manualFlipMorph с sourceEl null guard.

## usePrefetchImage.ts
usePrefetchImage(): (url) => void — стабильный callback, создаёт new window.Image() + img.src для предзагрузки обложки в image cache (onPointerEnter/onPointerDown).

# Утилиты CSS

## .shadow-hover
Utility-класс в @layer utilities. position:relative + ::after с box-shadow, opacity:0→1 на hover, transition: opacity var(--dur-fast) var(--ease-out-quart). Заменяет анти-паттерн animate box-shadow.

## Глобальное press-feedback
Правило в @layer base на button, a, [role=button]: transition: transform var(--dur-instant) var(--ease-out-quart), opacity var(--dur-fast) var(--ease-out-quart), background-color var(--dur-fast) var(--ease-in-out), color var(--dur-fast) var(--ease-in-out); :active → transform: scale(0.97). Заменяет все локальные transition-transform duration-100 active:scale-*.

## Keyframes (только transform+opacity)
- @keyframes fade-in (opacity 0→1 + translateY 8→0)
- @keyframes pop-in (opacity 0→1 + scale 0.92→1)
- @keyframes hero-enter (opacity 0→1 + translateY 16→0 + scale 0.96→1)
- @keyframes skeleton-shimmer (background-position -200%→200%)
- @keyframes vt-fade-out/vt-fade-in (root cross-fade)

## Универсальный prefers-reduced-motion
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; } } — одним правилом покрывает всю кодовую базу.

# Стратегия shared element transitions

## Layer 1: Native View Transitions API (Chrome 111+, Safari 18+)
@view-transition { navigation: auto } в globals.css. Браузер автоматически:
- Делает snapshot старой страницы при клике на <Link>
- Монтирует новую страницу
- Кросс-фейдит root между ними через ::view-transition-old/new(root) правила

## Layer 2: Per-id naming для shared-element morph
Каждая карточка ресторана использует inline style={{ viewTransitionName: "restaurant-image-${r.id}" }} на обложке и "restaurant-title-${r.id}" на заголовке. Страница-приёмник /restaurant/[id] использует ровно такое же имя на hero и h1. Имена уникальны per-restaurant-id → множество карточек сосуществуют в снимке VT API без конфликтов.

## Layer 3: Telegram Mini App / WebView fallback (manualFlipMorph)
Для устройств без VT API (Telegram Mini App, старые WebView) — manual FLIP morph через Web Animations API:
1. resolveMorphSource находит внутренний [data-vt-morph-source] или берёт всю карточку
2. createOverlayClone клонирует в position:fixed overlay на body
3. navigate() запускает роутинг
4. waitForElement через MutationObserver ждёт появления [data-vt-target="..."]
5. Параллельные animation: clone.animate() с left/top/width/height (не transform scale!) + targetEl.animate() opacity 0→1 для cross-fade в последние 40%
6. Cleanup

Важно: left/top/width/height, а не transform scale — клон содержит <img object-cover> который пересчитывает crop автоматически при изменении контейнера, без деформации.

# Навигация (src/lib/transitions.ts)

Canonical набор: prefersReducedMotion, supportsViewTransitions, navigate, navigateBack, NavigateOptions. Стратегия navigate() — 4 ветки: reduced-motion → sync router.push; VT API → startTransition(() => router.push); no VT + source + target → manualFlipMorph; иначе — startTransition(() => router.push).

# Удалённые анти-паттерны

## Компоненты
- TransitionLink wrapper с data-vt-active / vt-card-launch / site-route-enter костылями → заменён на чистый next/link + @view-transition navigation: auto
- navigateWithViewTransition wrapper с setTimeout цепочками, VT_COMMIT_WAIT_MS / FALLBACK_LAUNCH_DELAY_MS magic numbers → заменён на navigate() с чистыми ветками

## CSS anti-patterns (grep = 0)
- transition-all
- duration-100
- active:scale-* (локальные — глобальное правило в globals.css)
- transition-shadow
- hover:shadow-[...]
- cubic-bezier(0.22, 1, 0.36, 1) — хардкод → заменён на --ease-out-quart

# Layout shift prevention (Phase 5, 8)
- Все <img> имеют width/height (Next Image или inline attrs) — grep "<img " без width = 0
- min-h-[...] на динамичных заголовках на /profile, /business-lunch, /favorites, /map, /restaurant
- Skeleton в loading.tsx точно повторяет финальную сетку

# Performance (Phase 6)
- fetchPriority="high" на hero-картинке restaurant/[id]/page.tsx и DesktopRestaurantDetail.tsx
- usePrefetchImage на hover/touchstart карточек → hi-res уже в cache к моменту morph

# Canonical file list

## Core
- src/app/globals.css — @theme tokens, @layer base (press-feedback), @layer utilities (.shadow-hover), keyframes, @view-transition, prefers-reduced-motion
- src/lib/transitions.ts — prefersReducedMotion, supportsViewTransitions, navigate, navigateBack, NavigateOptions
- src/lib/morph.ts — manualFlipMorph + helpers (resolveMorphSource, waitForElement, createOverlayClone, getDefaultEasing)
- src/app/(site)/template.tsx — минимальный pass-through <>{children}</>

## Hooks
- src/lib/hooks/useMounted.ts
- src/lib/hooks/usePrefersReducedMotion.ts
- src/lib/hooks/useViewTransition.ts
- src/lib/hooks/useFlipMorph.ts
- src/lib/hooks/usePrefetchImage.ts
- src/lib/hooks/useHaptics.ts (существовал, использует prefersReducedMotion)

## Consumers (shared-element morph)
- src/app/(site)/_components/NearbyRestaurantsRow.tsx
- src/app/(site)/_components/DesktopPopularRestaurantsGrid.tsx
- src/app/(site)/search/_components/MobileSearchResults.tsx
- src/app/(site)/search/_components/DesktopSearchResults.tsx
- src/app/(site)/map/_components/MobileMapView.tsx
- src/app/(site)/restaurant/[id]/page.tsx (hero mobile)
- src/app/(site)/restaurant/[id]/_components/DesktopRestaurantDetail.tsx (hero desktop)
- src/app/(site)/business-lunch/[id]/page.tsx (hero)