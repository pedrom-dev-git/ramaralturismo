import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o nome da empresa no footer", async ({ page }) => {
    const footer = page.locator("footer");
    // Usa getByRole("heading") para ser preciso — evita match no copyright "2026 R. Amaral Turismo"
    await expect(footer.getByRole("heading", { name: "R. Amaral", exact: true })).toBeVisible();
  });

  test("exibe a descrição da empresa", async ({ page }) => {
    // Escopa ao footer — a frase similar existe na seção Hero também
    const footer = page.locator("footer");
    await expect(footer.getByText(/Atendimento personalizado para transporte escolar/)).toBeVisible();
  });

  test("exibe link de telefone com href correto", async ({ page }) => {
    const footer = page.locator("footer");
    const phoneLink = footer.getByRole("link", { name: /999503368/ });
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute("href", "tel:+5548999503368");
  });

  test("exibe link de e-mail com href correto", async ({ page }) => {
    const footer = page.locator("footer");
    const emailLink = footer.getByRole("link", { name: /contato@ramaral/ });
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveAttribute("href", "mailto:contato@ramaral.com.br");
  });

  test("exibe a localização 'Santa Catarina, Brasil'", async ({ page }) => {
    await expect(page.getByText("Santa Catarina, Brasil")).toBeVisible();
  });

  test("exibe os links de redes sociais (Instagram, Facebook, WhatsApp)", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Facebook" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "WhatsApp" })).toBeVisible();
  });

  test("link WhatsApp do footer aponta para o número correto", async ({ page }) => {
    const footer = page.locator("footer");
    const waLink = footer.getByRole("link", { name: "WhatsApp" });
    await expect(waLink).toHaveAttribute("href", "https://wa.me/5548999503368");
  });

  test("exibe os 5 links de navegação no footer", async ({ page }) => {
    // Escopa à <ul> de navegação dentro do footer para não capturar os links da navbar
    const footerNav = page.locator("footer ul");
    await expect(footerNav.getByRole("link", { name: "Home", exact: true })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: "Destinos", exact: true })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: "Blog", exact: true })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: "Novidades", exact: true })).toBeVisible();
    await expect(footerNav.getByRole("link", { name: "Contato", exact: true })).toBeVisible();
  });

  test("exibe o copyright com o ano 2026", async ({ page }) => {
    await expect(page.getByText(/2026 R\. Amaral Turismo/)).toBeVisible();
  });

  test("footer tem id='contato' (âncora de navegação)", async ({ page }) => {
    await expect(page.locator("footer#contato")).toBeAttached();
  });
});
