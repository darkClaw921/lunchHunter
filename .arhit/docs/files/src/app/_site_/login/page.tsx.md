# src/app/(site)/login/page.tsx

Страница /login — server component. validateSession: если уже авторизован → redirect /profile. Рендерит LoginForm внутри Suspense (useSearchParams требует границу). Брендированный layout: лого LH + карточка с формой. dynamic='force-dynamic'.
