import { test, expect } from "@playwright/test";

const PATHS = ["/sobre", "/en/sobre", "/es/sobre"];

for (const path of PATHS) {
  test.describe(`Sobre page — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("returns 200 and has a single H1 in main content", async ({
      page,
    }) => {
      await expect(page.locator("main h1")).toHaveCount(1);
      const h1Text = await page.locator("main h1").innerText();
      expect(h1Text.length).toBeGreaterThan(3);
    });

    test("page exposes the family business identity", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toContain("R. Amaral");
      expect(body).toContain("Tijucas");
    });

    test("public data block lists CNPJ, ANTT-TAF and SIE-SC", async ({
      page,
    }) => {
      const body = await page.locator("main").innerText();
      expect(body).toContain("33.876.985/0001-72");
      expect(body).toContain("006462");
      expect(body).toContain("2685/c");
    });

    test("mentions fleet of 2 vans", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toMatch(/2/);
      expect(body.toLowerCase()).toMatch(/van/);
    });

    test("page is reachable from desktop navbar link", async ({ page }) => {
      const homePath = path.startsWith("/en")
        ? "/en/"
        : path.startsWith("/es")
          ? "/es/"
          : "/";
      await page.goto(homePath);
      const link = page
        .locator("header nav a[href$='/sobre']")
        .first();
      await expect(link).toBeVisible();
    });

    test("page is reachable from footer link", async ({ page }) => {
      const homePath = path.startsWith("/en")
        ? "/en/"
        : path.startsWith("/es")
          ? "/es/"
          : "/";
      await page.goto(homePath);
      const link = page.locator("footer a[href$='/sobre']").first();
      await expect(link).toHaveCount(1);
    });
  });
}
