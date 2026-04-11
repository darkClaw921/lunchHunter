# src/app/api/notifications/subscribe/route.ts

API endpoint для управления push-подписками. POST — сохранить подписку (upsert по endpoint), DELETE — удалить подписку. Требует аутентификацию через validateSession().
