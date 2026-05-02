import { test, expect } from "@playwright/test";

test.describe("Navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ---------- Renderização ----------

  test("exibe o logo R. Amaral", async ({ page }) => {
    await expect(
      page.locator("#main-header").getByRole("link", { name: "R. Amaral" }),
    ).toBeVisible();
  });

  test("exibe os 4 links de navegação no desktop (Home, Frota, Destinos, Contato)", async ({ page }) => {
    const desktopMenu = page.locator("#main-header nav ul").first();
    await expect(desktopMenu.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(desktopMenu.getByRole("link", { name: "Frota" })).toBeVisible();
    await expect(
      desktopMenu.getByRole("link", { name: "Destinos" }),
    ).toBeVisible();
    await expect(
      desktopMenu.getByRole("link", { name: "Contato" }),
    ).toBeVisible();
    const frotaLink = desktopMenu.getByRole("link", { name: "Frota" });
    await expect(frotaLink).toHaveAttribute("href", "#fleet");
    // Blog/Novidades removed (broken anchors)
    await expect(desktopMenu.getByRole("link", { name: "Blog" })).not.toBeAttached();
    await expect(desktopMenu.getByRole("link", { name: "Novidades" })).not.toBeAttached();
  });

  test("navbar fica fixa no topo ao rolar a página", async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect(page.locator("#main-header")).toHaveCSS("position", "sticky");
  });

  // ---------- Menu mobile ----------

  test.describe("Menu mobile", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("exibe o botão hamburguer e oculta os links desktop", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(
        page.getByRole("button", { name: "Abrir menu" }),
      ).toBeVisible();
      // ul com md:flex está oculto em mobile via Tailwind
      await expect(page.locator("#main-header nav ul").first()).toBeHidden();
    });

    test("input: clique no hamburguer → output: menu mobile abre", async ({
      page,
    }) => {
      await page.goto("/");
      const mobileMenu = page.locator("#mobile-menu");

      // antes do clique: oculto
      await expect(mobileMenu).toBeHidden();

      await page.getByRole("button", { name: "Abrir menu" }).click();

      // depois do clique: visível
      await expect(mobileMenu).toBeVisible();
    });

    test("input: 2º clique no hamburguer → output: menu mobile fecha", async ({
      page,
    }) => {
      await page.goto("/");
      const btn = page.getByRole("button", { name: "Abrir menu" });
      const mobileMenu = page.locator("#mobile-menu");

      await btn.click();
      await expect(mobileMenu).toBeVisible();

      await btn.click();
      await expect(mobileMenu).toBeHidden();
    });

    test("menu mobile contém os 4 links de navegação (Home, Frota, Destinos, Contato)", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Abrir menu" }).click();

      const mobileMenu = page.locator("#mobile-menu");
      await expect(
        mobileMenu.getByRole("link", { name: "Home" }),
      ).toBeVisible();
      await expect(
        mobileMenu.getByRole("link", { name: "Frota" }),
      ).toBeVisible();
      await expect(
        mobileMenu.getByRole("link", { name: "Destinos" }),
      ).toBeVisible();
      await expect(
        mobileMenu.getByRole("link", { name: "Contato" }),
      ).toBeVisible();
      // Blog/Novidades removed (broken anchors)
      await expect(mobileMenu.getByRole("link", { name: "Blog" })).not.toBeAttached();
      await expect(mobileMenu.getByRole("link", { name: "Novidades" })).not.toBeAttached();
    });
  });
});
