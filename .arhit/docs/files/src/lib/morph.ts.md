# src/lib/morph.ts

Manual shared-element morph через FLIP-технику и Web Animations API. Canonical replacement для старого manualMorph (удалён в Phase 2).

# Зачем
View Transitions API доступен только в Chrome/Edge desktop и Safari 18+. На iOS Safari < 18, многих Android WebView и в Telegram Mini App его нет — а пользователь всё равно ожидает плавное перетекание карточки в hero страницы ресторана. Этот файл реализует morph руками через FLIP (First, Last, Invert, Play) + Web Animations API, который поддерживается везде где есть Chrome/Safari/Firefox последних 5 лет.

# Экспорт
manualFlipMorph(opts: ManualFlipMorphOptions): Promise<void>

## ManualFlipMorphOptions
- sourceEl: HTMLElement — стартовый элемент (нажатая карточка).
- targetSelector: string — CSS-селектор финального элемента, который появится после navigation. Например [data-vt-target="restaurant-image-${id}"].
- navigate: () => void — функция запуска navigation (router.push через startTransition).
- duration?: number — длительность анимации (default DEFAULT_DURATION_MS = 380мс).
- easing?: string — easing-кривая (default читается из --ease-out-quart CSS var через getDefaultEasing() с fallback cubic-bezier(0.25, 1, 0.5, 1)).
- timeoutMs?: number — таймаут ожидания target (default DEFAULT_TARGET_TIMEOUT_MS = 1500мс).

# Алгоритм FLIP

1. **First**: resolveMorphSource(sourceEl) находит внутренний [data-vt-morph-source] (cover-обёртка) или возвращает сам sourceEl. Потом getBoundingClientRect → sourceRect. Если width=0 или height=0 — просто navigate() и выход.
2. createOverlayClone клонирует элемент через cloneNode(true), позиционирует fixed, left/top/width/height из rect, zIndex 9999, pointer-events: none, overflow: hidden, box-sizing: border-box, willChange: left/top/width/height/border-radius/opacity, boxShadow полёта 0 16px 36px rgba(0,0,0,0.18), transform: none, отключает transition: none на клоне и всех потомках (чтобы не конфликтовать с WAAPI).
3. Оригинал sourceEl.style.visibility = hidden (React потом всё равно размонтирует).
4. navigate() — запускаем роутинг, React начинает рендер новой страницы (loading.tsx → page.tsx).
5. **Last**: waitForElement(targetSelector, timeoutMs) — синхронный querySelector, потом MutationObserver на body (childList, subtree, attributeFilter: [data-vt-target]). Резолвит когда селектор найден или null по timeout.
6. Если target не найден: fade-out clone 160мс → remove → выход. Восстанавливаем visibility на sourceEl (на всякий случай).
7. Если target найден: getBoundingClientRect → targetRect. Считываем border-radius обоих. targetEl.style.opacity = 0 (пока клон летит).
8. **Invert + Play**: clone.animate(keyframes, opts) — НЕ transform: scale, а напрямую left/top/width/height/borderRadius. Это критично — клон содержит <img object-cover>, который при изменении контейнера автоматически пересчитывает crop без деформации и без выхода за границы. Offset-keyframes: source→target на offset CLONE_FADE_OUT_OFFSET = 0.6 с opacity 1, потом opacity 1→0 на offset 1 (клон исчезает).
9. Параллельно: targetEl.animate([opacity 0, opacity 0@0.6, opacity 1]) — fade-in hero в последние 40% (cross-fade с клоном).
10. await Promise.all(cloneAnimation.finished, targetAnimation.finished).
11. Cleanup: clone.remove(), target восстанавливает original opacity и willChange.

# Helpers
- resolveMorphSource(el): HTMLElement — находит вложенный [data-vt-morph-source] или возвращает сам el. Позволяет морфить только cover-обёртку (image-to-image) без текста карточки.
- waitForElement(selector, timeoutMs): Promise<HTMLElement | null> — синхронная проверка querySelector + MutationObserver fallback.
- createOverlayClone(sourceEl, rect): HTMLElement — создаёт visual клон с inline-стилями полёта.
- getDefaultEasing(): string — SSR-safe чтение --ease-out-quart из CSS var.

# Константы
- DEFAULT_DURATION_MS = 380
- DEFAULT_TARGET_TIMEOUT_MS = 1500
- CLONE_FADE_OUT_OFFSET = 0.6

# Используется
- src/lib/transitions.ts — navigate() вызывает manualFlipMorph в ветке без VT API когда переданы sourceEl + targetSelector.
- src/lib/hooks/useFlipMorph.ts — React-обёртка с guard по sourceEl.
