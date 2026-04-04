import { test, expect } from "@playwright/test";

const EXPECTED_BENEFITS = [
  {
    title: "Segurança em primeiro lugar",
    description: "Veículo vistoriado e regularizado conforme as normas vigentes.",
  },
  {
    title: "Pontualidade",
    description: "Compromisso com horários para que você nunca se atrase.",
  },
  {
    title: "Conforto",
    description: "Ar-condicionado, espaço e comodidade para sua viagem.",
  },
  {
    title: "Atendimento rápido",
    description: "Resposta ágil para todas as suas necessidades de transporte.",
  },
];

test.describe("Benefits", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o título da seção", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /por que escolher a nossa van/i })
    ).toBeVisible();
  });

  test("renderiza exatamente 4 cards de benefício", async ({ page }) => {
    const section = page.locator("section.bg-light-gray");
    const cards = section.locator(".grid > div");
    await expect(cards).toHaveCount(4);
  });

  for (const benefit of EXPECTED_BENEFITS) {
    // getByRole("heading") é preciso: só casa o <h3>, não o div pai
    test(`input: página carregada → output: card "${benefit.title}" visível`, async ({ page }) => {
      const section = page.locator("section.bg-light-gray");
      await expect(
        section.getByRole("heading", { name: benefit.title, exact: true })
      ).toBeVisible();
    });

    test(`input: página carregada → output: descrição de "${benefit.title}" visível`, async ({ page }) => {
      const section = page.locator("section.bg-light-gray");
      await expect(section.getByText(benefit.description)).toBeVisible();
    });
  }
});
