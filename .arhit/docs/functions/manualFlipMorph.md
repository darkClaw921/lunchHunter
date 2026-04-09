# manualFlipMorph

Главная функция manual shared-element morph через FLIP-технику и Web Animations API (src/lib/morph.ts).

Сигнатура: manualFlipMorph(opts: ManualFlipMorphOptions): Promise<void>

ManualFlipMorphOptions:
- sourceEl: HTMLElement — нажатая карточка (или её [data-vt-morph-source] cover-обёртка).
- targetSelector: string — CSS-селектор финального элемента на новой странице, обычно [data-vt-target="restaurant-hero"].
- navigate: () => void — функция, запускающая роутинг (обычно startTransition(() => router.push(href))).
- duration?: number — длительность, по умолчанию DEFAULT_DURATION_MS = 380.
- easing?: string — easing-кривая, по умолчанию getDefaultEasing() читает из CSS var --ease-out-quart через getComputedStyle(document.documentElement).getPropertyValue("--ease-out-quart"), с fallback на literal cubic-bezier(0.25, 1, 0.5, 1) для SSR.
- timeoutMs?: number — максимум ожидания target, по умолчанию DEFAULT_TARGET_TIMEOUT_MS = 1500.

Алгоритм FLIP (First, Last, Invert, Play):
1. resolveMorphSource(sourceEl): находит внутренний [data-vt-morph-source] или возвращает сам sourceEl (чистый image-to-image без текста карточки).
2. sourceRect = morphSourceEl.getBoundingClientRect(). Если width=0 или height=0 — просто navigate() и выход.
3. createOverlayClone: клонирует элемент в position: fixed, left/top/width/height из rect, zIndex 9999, pointer-events: none, overflow: hidden, box-sizing: border-box, willChange: left/top/width/height/border-radius/opacity, boxShadow полёта, transform: none, отключает transition: none на клоне и всех потомках.
4. sourceEl.style.visibility = hidden (оригинал скрыт до unmount).
5. navigate() — React начинает рендер новой страницы (loading.tsx → page.tsx).
6. waitForElement(targetSelector, timeoutMs) через MutationObserver на body (childList/subtree/attributeFilter: data-vt-target) + синхронный querySelector в начале. Null если timeout.
7. Если target не найден → fade-out clone + remove + выход.
8. Если target найден: targetRect = getBoundingClientRect, считываем border-radius через getComputedStyle. clone.animate([...]) — keyframes offset 0/CLONE_FADE_OUT_OFFSET (0.6)/1 с left/top/width/height/borderRadius/opacity — НЕ transform: scale (img object-cover автоматически пересчитывает crop без деформации). Параллельно targetEl.animate([...]) — opacity 0→1 в последние 40% (cross-fade). Promise.all(cloneAnimation.finished, targetAnimation.finished).
9. Cleanup: clone.remove(), восстановление inline-стилей target (opacity, willChange).

Используется как Telegram Mini App / legacy WebView fallback из navigate() в transitions.ts и хука useFlipMorph. WAAPI (Element.prototype.animate) поддержан везде, где есть Chrome/Safari/Firefox последних 5 лет, включая WebView.
