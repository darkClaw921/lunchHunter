# src/app/api/upload/route.ts

API route для user-level загрузки файлов. POST — multipart upload с ресайзом через sharp (max 1600px, WebP quality 85). Требует авторизованную сессию (validateSession). Сохраняет в /public/uploads/{uuid}.webp. Копия паттерна из admin/upload/route.ts, но с пользовательской авторизацией.
