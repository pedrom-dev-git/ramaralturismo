import { test, expect } from "@playwright/test";

const cases = [
  { locale: "pt-BR", path: "/", privacyHref: "/privacy", termsHref: "/termos" },
  { locale: "en", path: "/en/", privacyHref: "/en/privacy", termsHref: "/en/termos" },
  { locale: "es", path: "/es/", privacyHref: "/es/privacy", termsHref: "/es/termos" },
];

test.describe("Footer LGPD / dados públicos", () => {
  for (const { locale, path, privacyHref, termsHref } of cases) {
    test.describe(`locale=${locale}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(path);
      });

      test("exibe CNPJ 33.876.985/0001-72 dentro do <footer>", async ({ page }) => {
        const footer = page.locator("footer");
        await expect(footer.getByText("33.876.985/0001-72")).toBeVisible();
      });

      test("exibe e-mail do encarregado dpo@ramaral.tur.br dentro do <footer>", async ({ page }) => {
        const footer = page.locator("footer");
        await expect(footer.getByText("dpo@ramaral.tur.br")).toBeVisible();
      });

      test(`link Política de Privacidade aponta para ${privacyHref}`, async ({ page }) => {
        const footer = page.locator("footer");
        const link = footer.locator(`a[href="${privacyHref}"]`);
        await expect(link).toBeVisible();
      });

      test(`link Termos de Uso aponta para ${termsHref}`, async ({ page }) => {
        const footer = page.locator("footer");
        const link = footer.locator(`a[href="${termsHref}"]`);
        await expect(link).toBeVisible();
      });
    });
  }
});
