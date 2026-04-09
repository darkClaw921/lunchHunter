# src/app/(site)/template.tsx

Next.js route template для route group (site). После Phase 9 сведён к минимальному pass-through wrapper <>{children}</> — собственные CSS-анимации переходов удалены. Cross-fade между маршрутами обеспечивается нативно через @view-transition { navigation: auto } в src/app/globals.css: браузер делает snapshot старой страницы, монтирует новую и кроссфейдит root между ними без участия JS. Под prefers-reduced-motion: reduce браузер автоматически отключает VT-анимации (настроено в globals.css). Экспортирует default SiteTemplate({ children }).
