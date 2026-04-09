# src/lib/morph.ts

Manual shared-element morph через FLIP-технику и Web Animations API. Fallback для Telegram Mini App / старых WebView где нативный View Transitions API недоступен.

## FLIP алгоритм

1. **First**: getBoundingClientRect стартового элемента. Если есть [data-vt-morph-source] внутри — морфим только его (обложку).
2. Создаём overlay clone (position: fixed) и добавляем в body, скрываем оригинал.
3. Запускаем navigate() → React рендерит новую страницу.
4. **Last**: MutationObserver ждёт появления [data-vt-target='X'] на новой странице (DEFAULT_TARGET_TIMEOUT_MS = 1500ms).
5. **Invert + Play**: анимируем left/top/width/height/borderRadius клона к target через Web Animations API. Cross-fade clone→target в последние (1 - CLONE_FADE_OUT_OFFSET = 40%) долей.
6. Cleanup: удаляем клон, восстанавливаем target opacity.

## Документированное исключение из ANIMATIONS_GUIDE §5

Гайд требует FLIP через transform: translate + scale. Здесь это невозможно:

- Клон содержит <img object-cover>. При transform: scale(sx, sy) с разными sx/sy (aspect-ratio карточки ≠ hero) изображение деформируется.
- При uniform scale клон торчит за границы hero.
- С прямой анимацией width/height браузер каждый кадр пересчитывает object-fit: cover — crop остаётся корректным.

Layout-triggers в клоне на position: fixed затрагивают только сам клон, не дёргают остальную страницу.

## Токены из CSS

Durations и easing читаются из --dur-*/ --ease-* через getComputedStyle:
- DEFAULT duration = --dur-slow (400ms)
- DEFAULT easing = --ease-out-quart
- Fade-out при timeout = --dur-fast + --ease-out-quart

Функции readCssDurationMs(name, fallback) и readCssEasing(name, fallback) — SSR-safe парсеры CSS custom properties.

## API

- ManualFlipMorphOptions — { sourceEl, targetSelector, navigate, duration?, easing?, timeoutMs? }
- manualFlipMorph(opts): Promise<void>
