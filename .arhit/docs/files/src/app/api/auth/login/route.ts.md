# src/app/api/auth/login/route.ts

POST /api/auth/login. End-user login по email+password (в отличие от /api/admin/auth/login не ограничивает role). Zod валидация, lookup по users.email (нормализация trim+lowercase), verifyPassword argon2, createSession + setSessionCookie. 401 при несовпадении.
