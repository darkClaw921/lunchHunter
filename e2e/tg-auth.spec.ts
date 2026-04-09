import { test, expect } from "@playwright/test";

/**
 * Telegram Mini App auth flow e2e (Phase 10 task lh-2sx.5).
 *
 * Реальный `initData` подписан HMAC'ом бота и не может быть сгенерирован
 * в тестах без токена. Вместо этого мокаем endpoint `/api/auth/telegram`:
 * любой POST возвращает 200 + фейкового пользователя, как будто валидация
 * прошла успешно.
 *
 * Сценарий:
 *  1. Mock route `**\/api/auth/telegram` → `route.fulfill({status: 200, json})`.
 *  2. Подкладываем фейковый `window.Telegram.WebApp` ДО гидратации страницы,
 *     через `page.addInitScript`, чтобы `@twa-dev/sdk` забрал initData на mount.
 *  3. Открываем `/tg`.
 *  4. Ждём редиректа на `/` (TelegramAutoLogin → router.replace("/")).
 */
test.describe("Telegram Mini App auth", () => {
  test("auto-login redirects to home after successful /api/auth/telegram", async ({
    page,
  }) => {
    await page.route("**/api/auth/telegram", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          user: {
            id: "tg-fake-uuid",
            tgId: 123456,
            name: "Test User",
            username: "testuser",
            avatarUrl: null,
          },
        }),
      });
    });

    await page.addInitScript(() => {
      // Минимальный stub @twa-dev/sdk / window.Telegram.WebApp, которого
      // достаточно для TelegramAutoLogin (ready/expand/initData).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { Telegram: unknown }).Telegram = {
        WebApp: {
          ready: () => undefined,
          expand: () => undefined,
          initData:
            "query_id=AAH&user=%7B%22id%22%3A123456%7D&auth_date=9999999999&hash=deadbeef",
          initDataUnsafe: { user: { id: 123456 } },
          platform: "test",
          version: "7.0",
        },
      };
    });

    await page.goto("/tg");
    await page.waitForURL((url) => url.pathname === "/", { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/");
  });
});
