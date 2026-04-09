# src/lib/hooks/useHaptics.ts

Client-only React хук для тактильной обратной связи (haptic feedback). Кросс-платформенный: Telegram Mini App → navigator.vibrate → no-op.

## Экспорты

### HapticKind (type)
Объединение строк: tap | light | selection | success | warning | error.

### HapticsApi (interface)
Интерфейс возвращаемого хуком объекта: методы tap, light, selection, success, warning, error — все () => void.

### useHaptics(): HapticsApi
Основной хук. Возвращает стабильный (useMemo + useCallback) объект с шестью методами. Каждый метод внутри вызывает приватную функцию triggerHaptic(kind).

## Логика triggerHaptic (приватная)
1. Детект Telegram WebApp через window.Telegram.WebApp.HapticFeedback (типизирован через интерфейсы TelegramHapticFeedback/TelegramWebApp/TelegramNamespace — без any).
2. Если tg доступен:
   - success/warning/error → tg.notificationOccurred(kind)
   - selection → tg.selectionChanged()
   - tap → tg.impactOccurred("medium")
   - light → tg.impactOccurred("light")
   - return
3. Иначе, если navigator.vibrate есть И !prefersReducedMotion():
   - success → navigator.vibrate([8, 40, 8])
   - все остальные → navigator.vibrate(8)
4. Иначе no-op.

## Зависимости
- react (useCallback, useMemo)
- @/lib/transitions (prefersReducedMotion)

## Используется в
- src/components/ui/Button.tsx — haptics.tap() на клик
- src/components/ui/Chip.tsx — haptics.selection()
- src/components/ui/FavoriteButton.tsx — haptics.success()/light()
- src/components/map/RadiusSelector.tsx — haptics.selection()
- src/components/mobile/BottomTabBar.tsx — haptics.selection()

## Ограничения
- "use client" directive — работает только в client component.
- На iOS Safari navigator.vibrate игнорируется, но Telegram WebApp haptics работает внутри Telegram Mini App.
- На SSR безопасен — обращения к window/navigator внутри коллбэков, вызываемых только из client event handlers.
- prefers-reduced-motion подавляет только navigator.vibrate путь; Telegram haptics остаётся — Telegram сам управляет accessibility.
