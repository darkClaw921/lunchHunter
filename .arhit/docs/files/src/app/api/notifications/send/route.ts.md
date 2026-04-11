# src/app/api/notifications/send/route.ts

API endpoint отправки push-уведомлений (только admin). POST принимает title, body, url. Отправляет через web-push всем подписчикам, чистит невалидные подписки (410/404).
