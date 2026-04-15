import { test, expect } from "@playwright/test";

const EXPECTED_PARTNERS = [
  "Cozybnb",
  "Serendipity",
  "Hideaway",
  "Earthly",
  "The Nook",
  "Horizon",
];

test.describe("Partners", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o título 'Nossos Parceiros'", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /nossos parceiros/i })
    ).toBeVisible();
  });

  test("o swiper de parceiros está presente no DOM", async ({ page }) => {
    await expect(page.locator(".partners-swiper")).toBeVisible();
  });

  for (const partner of EXPECTED_PARTNERS) {
    test(`input: página carregada → output: parceiro "${partner}" no DOM`, async ({ page }) => {
      // Swiper duplica slides para loop — locator().first() garante ao menos 1
      await expect(page.getByText(partner).first()).toBeAttached();
    });
  }

  test("renderiza no mínimo 6 slides de parceiros", async ({ page }) => {
    // Swiper pode duplicar slides; verifica ao menos 6 originais
    const slides = page.locator(".partners-swiper .swiper-slide");
    const count = await slides.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });
});
