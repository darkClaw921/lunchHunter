import { TelegramAutoLogin } from "./_components/TelegramAutoLogin";

/**
 * /tg — entrypoint для Telegram Mini App.
 *
 * Рендерит client-компонент <TelegramAutoLogin/>, который на mount:
 *  1. Импортирует @twa-dev/sdk (динамически, чтобы не падал SSR),
 *  2. Вызывает WebApp.ready() + WebApp.expand(),
 *  3. Берёт WebApp.initData (сырая query-string),
 *  4. POST /api/auth/telegram,
 *  5. При success — router.replace("/"),
 *  6. При ошибке — показывает сообщение + кнопку "Продолжить как гость".
 */
export default function TgPage(): React.JSX.Element {
  return <TelegramAutoLogin />;
}
