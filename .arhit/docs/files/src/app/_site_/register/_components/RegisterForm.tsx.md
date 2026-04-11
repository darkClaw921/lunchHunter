# src/app/(site)/register/_components/RegisterForm.tsx

Client-форма /register. React Hook Form + zod ({name:1-64, email, password:min6}). POST /api/auth/register; при успехе router.replace('/profile') + router.refresh(). Серверные ошибки в alert (в т.ч. 409 'email занят'). Ссылка на /login.
