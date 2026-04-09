# src/components/ui/RouteProgress.tsx

Тонкая accent-полоска (3px) фиксированная сверху экрана, показывающая ход навигации.

# Props
- className?: string — для override z-index или других стилей корневого div.

# Экспорты
- RouteProgress({className?}) — компонент-полоска. Монтируется один раз в (site)/layout.tsx.
- ROUTE_PROGRESS_START_EVENT = "routeprogress:start" — имя CustomEvent.
- dispatchRouteProgressStart() — helper для диспатча события из других мест (BackButton, обёртки Link). SSR-safe (typeof window === undefined → noop).

# State machine
idle → delayed (PROGRESS_DELAY_MS = 16мс задержка) → active (requestAnimationFrame loop приращивает progress по кривой замедления до PROGRESS_CAP = 85%) → finishing (скачок до 100%, fade-out 220мс) → idle.

# Поведение
- Слушает window.addEventListener("routeprogress:start").
- При получении: запоминает startTimeRef = performance.now(), ставит начальный progress = 12% (мгновенный визуальный отклик), переходит в delayed → через PROGRESS_DELAY_MS в active.
- В active: rAF loop приращивает progress: Math.max(0.2, (remaining / PROGRESS_CAP) * PROGRESS_STEP) где PROGRESS_STEP = 0.9.
- Слушает usePathname(): когда меняется — переходит в finishing, progress=100, через 260мс + remainingMinVisible идёт в idle. PROGRESS_MIN_VISIBLE_MS = 180мс гарантирует что даже на быстрых навигациях полоска видна (анти-мерцание).
- Под prefers-reduced-motion: reduce CSS transitions становятся instant (универсальное правило в globals.css), логика та же.

# Стили
- fixed inset-x-0 top-0 h-[3px] — толщина 3px.
- bg-accent (#FF5C00).
- box-shadow с двойным glow для лучшей видимости: 0 0 8px rgba(255,92,0,0.55), 0 0 2px rgba(255,92,0,0.9).
- z-50 — выше BottomTabBar (z-40).
- pointer-events-none.
- transform: scaleX(progress/100), origin-left.
- transition зависит от state: finishing → "transform 220ms var(--ease-out-quart), opacity 220ms ease 80ms"; active → "transform 180ms ease-out, opacity 120ms ease-out"; default → "opacity 80ms ease-out". Easing токен читается из globals.css.

# Используется
- src/app/(site)/layout.tsx — монтаж первым элементом shell.
