# src/lib/hooks/useMounted.ts

Task hydration helper хук ("use client"). Возвращает boolean: false на первом (SSR/первом клиентском) рендере и true после монтирования компонента через useState(false) + useEffect(() => setMounted(true), []).

# Экспорты
- useMounted(): boolean

# Зачем
Используется для предотвращения SSR/CSR mismatch в компонентах, которые зависят от window/document или запускают анимации только после гидратации. В SSR Next.js рендерит компонент с mounted=false (например, скрывает client-only UI), а после hydrate становится true и компонент показывает реальный контент.

# Файл
src/lib/hooks/useMounted.ts

# Используется
- Везде где нужен guard "монтирован ли компонент" — например, для условного рендера DOM-операций, инициализации IntersectionObserver, запуска клиент-анимаций после hydrate.
