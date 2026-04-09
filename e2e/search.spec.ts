import { test, expect } from "@playwright/test";

/**
 * Search flow e2e (Phase 10 task lh-2sx.3).
 *
 * Сценарий:
 *  1. Открыть главную `/`.
 *  2. Найти SearchInput, ввести "пиво", submit по Enter.
 *  3. Убедиться, что страница навигировалась на `/search?q=пиво`.
 *  4. Убедиться, что на странице есть хотя бы одна карточка с ценой
 *     (accent-текст формата "NNN ₽").
 */
test.describe("Search flow", () => {
  test("user searches for a menu item from the home page", async ({ page }) => {
    await page.goto("/");

    // SearchInput — либо у него placeholder "Пиво, суши, кофе..." (mobile/desktop),
    // либо просто type=search. Берём первый видимый input.
    const searchInput = page.getByPlaceholder(/пиво/i).first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill("пиво");
    await searchInput.press("Enter");

    await page.waitForURL(/\/search\?q=/, { timeout: 15_000 });
    expect(page.url()).toContain("q=");

    // На странице поиска должна быть хотя бы одна цена в рублях.
    const priceLocator = page.locator("text=/\\d+\\s?₽/").first();
    await expect(priceLocator).toBeVisible({ timeout: 10_000 });
  });
});
