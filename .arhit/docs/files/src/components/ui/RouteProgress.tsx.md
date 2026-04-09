# src/components/ui/RouteProgress.tsx

Тонкая accent-полоска сверху экрана, индикатор навигации между страницами.

## Поведение

Слушает кастомное событие 'routeprogress:start', которое диспатчит dispatchRouteProgressStart() перед навигацией. Через PROGRESS_DELAY_MS (16ms — один кадр) после события включается, имитирует прогресс до PROGRESS_CAP (85%) через requestAnimationFrame с замедлением по мере приближения. По смене usePathname() переходит в фазу finishing: скачок на 100% и fade-out.

## Токены

Все transitions используют токены ANIMATIONS_GUIDE §1.1 — никаких magic-numbers:
- finishing: transform/opacity var(--dur-base) var(--ease-out-quart) + delay var(--dur-instant) на opacity
- active: transform/opacity var(--dur-fast) var(--ease-out-quart)
- idle: opacity var(--dur-instant) var(--ease-out-quart)

PROGRESS_FINISH_HIDE_MS = 240 (эквивалент --dur-base) — константа для setTimeout в finishing фазе, должна совпадать с duration в inline transition.

## State machine

'idle' → 'delayed' → 'active' → 'finishing' → 'idle'

- idle: невидима (opacity 0)
- delayed: ожидание PROGRESS_DELAY_MS перед показом (анти-мерцание для кеш-хитов)
- active: имитация прогресса через rAF до PROGRESS_CAP
- finishing: дожимание до 100% и скрытие

## Экспорты

- ROUTE_PROGRESS_START_EVENT = 'routeprogress:start'
- dispatchRouteProgressStart(): void — SSR-safe диспатч события
- RouteProgress({ className? }): JSX.Element — компонент-индикатор
