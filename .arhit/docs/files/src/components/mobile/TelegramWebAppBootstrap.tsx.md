# src/components/mobile/TelegramWebAppBootstrap.tsx

Невидимый client-bootstrap для Telegram Mini App в (site)/layout.tsx.

# Что делает
useEffect на mount проверяет наличие window.Telegram.WebApp и вызывает:
- WebApp.ready() — обязательный сигнал что mini-app загружен. БЕЗ этого вызова HapticFeedback методы no-op в большинстве клиентов.
- WebApp.expand() — растягивает на полную высоту экрана (только если не expanded).

# Зачем
TelegramAutoLogin вызывает WebApp.ready() только на странице /tg, после чего делает router.replace('/'). После redirect на главную WebApp.ready() уже не вызван — и hapticFeedback на главной не работает. Этот компонент решает проблему: он монтируется в (site)/layout.tsx и вызывает ready() на каждой странице (idempotent).

# Безопасность
- Не использует @twa-dev/sdk — обращается напрямую к window.Telegram.WebApp.
- Если приложение открыто НЕ из Telegram (window.Telegram === undefined) — silent no-op.
- try/catch на ready() и expand() — не падает если методов нет.
- Возвращает null — нет визуального вывода.

# Используется
- src/app/(site)/layout.tsx — монтируется как невидимый sibling RouteProgress.
