# src/app/api/auth/register/route.ts

POST /api/auth/register. Принимает {email, password, name} (zod: email, min 6, 1-64). Нормализует email (trim+lowercase), проверяет уникальность по users.email (409 если занят), хэширует пароль argon2id через hashPassword, инсертит users с id=randomUUID, role='user', name.trim(). После инсерта createSession + setSessionCookie. Успех: {ok:true}.
