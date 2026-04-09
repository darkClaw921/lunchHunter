# src/components/ui/TransitionLink.tsx

DELETED in Phase 3 (ANIMATIONS_GUIDE refactor). Причина: wrapper-компонент с ручным startViewTransition и timing-костылями (data-vt-active + magic-numbers + requestAnimationFrame цепочки) был заменён на чистый next/link + нативный @view-transition { navigation: auto } в globals.css. Для Telegram Mini App fallback без VT API используется manualFlipMorph через хук useFlipMorph или функцию navigate() из src/lib/transitions.ts. См. также architecture.md секция "Переходы и анимации".
