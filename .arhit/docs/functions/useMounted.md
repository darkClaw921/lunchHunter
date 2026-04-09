# useMounted

Task hydration helper hook. Возвращает boolean: false на первом (SSR/первом клиентском) рендере и true после монтирования компонента. Реализация: useState(false) + useEffect(() => setMounted(true), []). Используется для предотвращения SSR/CSR mismatch в компонентах, которые зависят от window/document или должны запускать анимации только после гидратации. Файл: src/lib/hooks/useMounted.ts. Паттерн из гайда анимаций §6.1.
