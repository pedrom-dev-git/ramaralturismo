import { test, expect } from "@playwright/test";

const EXPECTED_SERVICES = [
  {
    title: "Transporte Escolar",
    description: "Segurança e pontualidade para o dia a dia do seu filho.",
  },
  {
    title: "Turismo e Viagens",
    description: "Conforto e praticidade para viagens em grupo.",
  },
];

test.describe("Services", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o título 'Nossos Serviços'", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /nossos serviços/i })
    ).toBeVisible();
  });

  test("renderiza exatamente 2 cards de serviço", async ({ page }) => {
    const section = page.locator("section").filter({ hasText: "Nossos Serviços" });
    const grid = section.locator(".grid > div");
    await expect(grid).toHaveCount(2);
  });

  for (const service of EXPECTED_SERVICES) {
    // Usa getByRole("heading") para evitar strict mode com options do <select> do Hero
    test(`input: página carregada → output: card "${service.title}" visível`, async ({ page }) => {
      const section = page.locator("section").filter({ hasText: "Nossos Serviços" });
      await expect(
        section.getByRole("heading", { name: service.title, exact: true })
      ).toBeVisible();
    });

    test(`input: página carregada → output: descrição de "${service.title}" visível`, async ({ page }) => {
      const section = page.locator("section").filter({ hasText: "Nossos Serviços" });
      await expect(section.getByText(service.description)).toBeVisible();
    });
  }

  test("exibe o botão 'See all'", async ({ page }) => {
    await expect(page.getByRole("link", { name: /see all/i })).toBeVisible();
  });

  test("botão 'See all' está estilizado como outlined (tem classe border)", async ({ page }) => {
    const btn = page.getByRole("link", { name: /see all/i });
    await expect(btn).toHaveClass(/border/);
  });
});
