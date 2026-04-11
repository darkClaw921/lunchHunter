# src/app/(site)/profile/_components/ProfileNotificationsToggle.tsx

Client toggle для push-уведомлений в профиле. Использует usePushSubscription(). Кнопка-свитч (role='switch', aria-checked=isSubscribed) вызывает subscribe/unsubscribe. disabled когда !isSupported || isLoading || permission==='denied'. Рендерит подсказку 'Браузер не поддерживает' при !isSupported и 'Заблокировано в браузере' при isDenied. Размер 11/6.
