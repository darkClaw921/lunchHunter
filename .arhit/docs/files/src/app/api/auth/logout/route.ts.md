# src/app/api/auth/logout/route.ts

POST /api/auth/logout. Читает SESSION_COOKIE_NAME, удаляет сессию через deleteSession (если есть), очищает cookie через clearSessionCookie. Всегда {ok:true}.
