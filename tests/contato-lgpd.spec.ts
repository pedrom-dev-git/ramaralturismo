import { test, expect } from "@playwright/test";

const PATHS = ["/contato-lgpd", "/en/contato-lgpd", "/es/contato-lgpd"];

for (const path of PATHS) {
  test.describe(`Contato LGPD page — ${path}`, () => {
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

    test("displays dpo@ramaral.tur.br as plain text", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toContain("dpo@ramaral.tur.br");
    });

    test("does not contain any form or input element", async ({ page }) => {
      await expect(page.locator("main form")).toHaveCount(0);
      await expect(page.locator("main input")).toHaveCount(0);
      await expect(page.locator("main textarea")).toHaveCount(0);
    });

    test("contains a clickable internal privacy/transparency link", async ({
      page,
    }) => {
      const credenciaisHref = path.startsWith("/en")
        ? "/en/credenciais"
        : path.startsWith("/es")
          ? "/es/credenciais"
          : "/credenciais";
      const link = page.locator(`main a[href='${credenciaisHref}']`).first();
      await expect(link).toBeVisible();
    });

    test("page is reachable from footer link", async ({ page }) => {
      const homePath = path.startsWith("/en")
        ? "/en/"
        : path.startsWith("/es")
          ? "/es/"
          : "/";
      await page.goto(homePath);
      const link = page.locator("footer a[href$='/contato-lgpd']").first();
      await expect(link).toHaveCount(1);
    });
  });
}
