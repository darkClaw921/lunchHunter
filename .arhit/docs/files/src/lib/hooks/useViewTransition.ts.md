# src/lib/hooks/useViewTransition.ts

Обёртка над document.startViewTransition для НЕ-навигационных state-переходов ("use client"). Примеры: theme switch, accordion expand/collapse, tab switch, filter apply.

# Экспорты
- useViewTransition(): (callback: () => void) => void

Возвращает функцию, оборачивающую callback в document.startViewTransition(() => flushSync(callback)).

# Зачем flushSync
flushSync из react-dom нужен чтобы форсировать синхронный flush React updates внутри VT-коллбэка — без этого React в concurrent mode может отложить state update, и VT API снимет snapshot до применения нового состояния.

# Graceful fallback
Если document.startViewTransition недоступен (Telegram Mini App, старые WebView), коллбэк вызывается напрямую без анимации. SSR-safe: на сервере возвращает noop.

# Когда НЕ использовать
Для НАВИГАЦИОННЫХ переходов этот хук НЕ нужен — там работает @view-transition { navigation: auto } в CSS + startTransition в navigate().

# Файл
src/lib/hooks/useViewTransition.ts
