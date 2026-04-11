# src/app/api/notifications/vapid-public-key/route.ts

GET /api/notifications/vapid-public-key. Возвращает { publicKey: string } — VAPID public key для подписки на push-уведомления. Источник: process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY. Если ключ не задан — 500 с {error:'VAPID public key not configured'}. Используется usePushSubscription.subscribe() в момент запроса подписки, чтобы не инлайнить ключ в клиентский бандл и менять его без пересборки фронта.
