# src/app/(site)/layout.tsx

Server component, адаптивный shell route group (site).

Mobile (<md): скрывает TopNav, показывает fixed BottomTabBar, центрирует колонку max-w 430px на тёплом фоне.
Desktop (>=md): TopNav 64px сверху, полноширинный контент. Страницы внутри рендерят mobile и desktop варианты как siblings.

Client-компонент <RouteProgress /> смонтирован первым элементом shell — глобальная прогресс-полоска переходов. Слушает CustomEvent "routeprogress:start" от BackButton/обёрток Link и usePathname для завершения.

Native cross-fade переходов между страницами обеспечивается через @view-transition { navigation: auto } в globals.css — браузер делает snapshot старой страницы автоматически. template.tsx внутри (site) — минимальный pass-through wrapper без собственных CSS-анимаций.

Импорты: next/metadata, BottomTabBar, TopNav, RouteProgress. Ссылка: src/app/(site)/layout.tsx
