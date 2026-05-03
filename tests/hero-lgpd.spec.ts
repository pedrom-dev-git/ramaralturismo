import { test, expect } from "@playwright/test";

const LOCALES = [
  { path: "/", policyText: "Política de Privacidade" },
  { path: "/en/", policyText: "Privacy Policy" },
  { path: "/es/", policyText: "Política de Privacidad" },
];

async function selectTipo(
  page: any,
  value: "turismo" | "escolar" | "corporativo",
) {
  await page.locator(`input[name='tipo'][value='${value}'] + span`).click();
}

test.describe("Hero LGPD notice", () => {
  for (const { path, policyText } of LOCALES) {
    test(`form mode (turismo): notice with policy link visible @ ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      const notice = page.locator('[data-testid="hero-lgpd-notice-form"]');
      await expect(notice).toBeVisible();
      const link = notice.locator("a", { hasText: policyText });
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      expect(href).toContain("privacy");
    });

    test(`corporativo mode: notice with policy link visible @ ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await selectTipo(page, "corporativo");
      const notice = page.locator('[data-testid="hero-lgpd-notice-corp"]');
      await expect(notice).toBeVisible();
      const link = notice.locator("a", { hasText: policyText });
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      expect(href).toContain("privacy");
    });

    test(`form notice hides when switching to corporativo @ ${path}`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(
        page.locator('[data-testid="hero-lgpd-notice-form"]'),
      ).toBeVisible();
      await selectTipo(page, "corporativo");
      await expect(
        page.locator('[data-testid="hero-lgpd-notice-form"]'),
      ).toBeHidden();
      await expect(
        page.locator('[data-testid="hero-lgpd-notice-corp"]'),
      ).toBeVisible();
    });
  }
});
