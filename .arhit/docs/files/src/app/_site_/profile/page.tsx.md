# src/app/(site)/profile/page.tsx

Серверная страница профиля. Читает сессию через validateSession, для залогиненного пользователя дополнительно получает getUserFavoritesCount и users.city из БД. SettingRow-ы теперь обёрнуты в next/link: Избранные → /favorites, История поиска → /profile/history, Город → /profile/city, О приложении → /profile/about. Уведомления — client toggle без href. Кнопка Выйти пока без обработчика (logout-user endpoint отсутствует).
