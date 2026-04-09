import { test, expect } from "@playwright/test";

/**
 * Admin login / dashboard e2e (Phase 10 task lh-2sx.4).
 *
 * Требует seed-админа: email `admin@lunchhunter.local`, пароль `admin12345`
 * (см. `src/lib/db/seed.ts` → seedAdmin).
 *
 * Сценарий:
 *  1. Зайти на `/admin/login`.
 *  2. Ввести email/password, submit.
 *  3. После редиректа на `/admin` увидеть 4 статкарточки дашборда.
 */
test.describe("Admin flow", () => {
  test("admin logs in and sees dashboard stat cards", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByLabel(/email/i).fill("admin@lunchhunter.local");
    await page.getByLabel(/парол/i).fill("admin12345");
    await page.getByRole("button", { name: /войти/i }).click();

    await page.waitForURL(/\/admin\/?$/, { timeout: 15_000 });

    // Dashboard — 4 статистических метрики: Рестораны / Позиции меню /
    // Пользователи / Поисков сегодня. Проверяем видимость заголовков.
    await expect(
      page.getByRole("heading", { level: 1, name: /дашборд/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/рестораны/i).first()).toBeVisible();
    await expect(page.getByText(/позици/i).first()).toBeVisible();
  });
});
