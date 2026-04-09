import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e configuration.
 *
 * - Запускает `pnpm dev` как webServer на 3000 порту перед тестами.
 * - Тесты лежат в `e2e/` (смотрим туда, а не в src/__tests__).
 * - Один браузер по умолчанию — `chromium` (для CI достаточно, при необходимости
 *   добавить webkit / firefox).
 * - `reuseExistingServer: true` в локальной разработке не поднимет второй сервер,
 *   если уже запущен `pnpm dev`.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
