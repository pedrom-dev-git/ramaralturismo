import { test, expect } from "@playwright/test";

const LOCALES = [
  { path: "/casos/", lang: "pt-BR", heading: "Quem já viajou conosco", footerLabel: "Casos" },
  { path: "/en/casos/", lang: "en", heading: "Who's traveled with us", footerLabel: "Cases" },
  { path: "/es/casos/", lang: "es", heading: "Quién ya viajó con nosotros", footerLabel: "Casos" },
];

for (const { path, heading, footerLabel } of LOCALES) {
  test.describe(`Casos page — ${path}`, () => {
    test(`returns 200 and has a single H1 with expected heading`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      const h1 = page.locator("main h1");
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(heading);
    });

    test(`mentions McDonald's and APAE cases`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main")).toContainText("McDonald's");
      await expect(page.locator("main")).toContainText("APAE");
    });

    test(`McDonald's gallery shows 3 images`, async ({ page }) => {
      await page.goto(path);
      const gallery = page.locator('main img[src^="/casos/mc-corporativo-"]');
      await expect(gallery).toHaveCount(3);
    });

    test(`page is reachable from footer link`, async ({ page }) => {
      const homePath = path.startsWith("/en/")
        ? "/en/"
        : path.startsWith("/es/")
          ? "/es/"
          : "/";
      await page.goto(homePath);
      const footerLink = page
        .locator("footer a")
        .filter({ hasText: footerLabel })
        .first();
      await expect(footerLink).toHaveAttribute("href", path.replace(/\/$/, ""));
    });
  });
}
