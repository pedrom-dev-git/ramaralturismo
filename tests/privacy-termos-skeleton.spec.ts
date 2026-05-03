import { test, expect } from "@playwright/test";

const PATHS = [
  "/privacy",
  "/en/privacy",
  "/es/privacy",
  "/termos",
  "/en/termos",
  "/es/termos",
];

for (const path of PATHS) {
  test.describe(`Privacy/Termos skeleton — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      const resp = await page.goto(path);
      expect(resp?.status()).toBe(200);
    });

    test("has a single H1 in main content", async ({ page }) => {
      await expect(page.locator("main h1")).toHaveCount(1);
      const h1Text = await page.locator("main h1").innerText();
      expect(h1Text.length).toBeGreaterThan(3);
    });

    test("displays a DRAFT banner", async ({ page }) => {
      const banner = page.locator("main [data-draft-banner]");
      await expect(banner).toBeVisible();
      const text = await banner.innerText();
      expect(text.toUpperCase()).toContain("DRAFT");
    });

    test("links to /contato-lgpd (locale-aware)", async ({ page }) => {
      const link = page.locator("main a[href$='/contato-lgpd']").first();
      await expect(link).toHaveCount(1);
    });
  });
}
