# supportsViewTransitions

Feature detection для нативного View Transitions API. Сигнатура: supportsViewTransitions(): boolean. SSR-safe: typeof document === 'undefined' → false. В браузере: typeof document.startViewTransition === 'function'. Поддерживается Chrome/Edge 111+, Safari 18+. Telegram Mini App и старые Android WebView обычно не поддерживают. Используется в navigate() для выбора между нативным VT API (ветка 2) и manual FLIP morph fallback (ветка 3). Файл: src/lib/transitions.ts.
