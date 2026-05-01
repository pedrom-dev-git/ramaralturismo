import { test, expect } from "@playwright/test";

test.describe("Footer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o nome da empresa no footer", async ({ page }) => {
    const footer = page.locator("footer");
    // Logo da empresa como imagem com alt="R. Amaral"
    await expect(
      footer.getByRole("img", { name: "R. Amaral", exact: true }),
    ).toBeVisible();
  });

  test("exibe a descrição da empresa", async ({ page }) => {
    // Escopa ao footer — a frase similar existe na seção Hero também
    const footer = page.locator("footer");
    await expect(
      footer.getByText(/Atendimento personalizado para transporte escolar/),
    ).toBeVisible();
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
    await expect(emailLink).toHaveAttribute(
      "href",
      "mailto:contato@ramaral.tur.br",
    );
  });

  test("exibe a localização 'Santa Catarina, Brasil'", async ({ page }) => {
    await expect(page.getByText("Santa Catarina, Brasil")).toBeVisible();
  });

  test("exibe os links de redes sociais (Instagram, Facebook, WhatsApp)", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "Facebook" })).toBeVisible();
    await expect(footer.getByRole("link", { name: "WhatsApp" })).toBeVisible();
  });

  test("link WhatsApp do footer aponta para o número correto", async ({
    page,
  }) => {
    const footer = page.locator("footer");
    const waLink = footer.getByRole("link", { name: "WhatsApp" });
    await expect(waLink).toHaveAttribute("href", "https://wa.me/5548999503368");
  });

  test("exibe os 3 links de navegação no footer (Blog/Novidades removidos)", async ({ page }) => {
    // Escopa à primeira <ul> de navegação dentro do footer
    const footerNav = page.locator("footer ul").first();
    await expect(
      footerNav.getByRole("link", { name: "Home", exact: true }),
    ).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: "Destinos", exact: true }),
    ).toBeVisible();
    await expect(
      footerNav.getByRole("link", { name: "Contato", exact: true }),
    ).toBeVisible();
    // Blog/Novidades removed (broken anchors — decision Rei Q1 2026-04-18)
    await expect(
      footerNav.getByRole("link", { name: "Blog", exact: true }),
    ).not.toBeAttached();
    await expect(
      footerNav.getByRole("link", { name: "Novidades", exact: true }),
    ).not.toBeAttached();
  });

  test("exibe o copyright com o ano 2026", async ({ page }) => {
    await expect(page.getByText(/2026 R\. Amaral Turismo/)).toBeVisible();
  });

  test("footer tem id='contato' (âncora de navegação)", async ({ page }) => {
    await expect(page.locator("footer#contato")).toBeAttached();
  });
});
