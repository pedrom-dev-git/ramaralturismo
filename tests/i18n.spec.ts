import { test, expect } from "@playwright/test";

test.describe("i18n", () => {
  test.describe("English (/en/)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/en/");
    });

    test("page lang is 'en'", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    });

    test("hero heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Explore Brazil with comfort and safety" })
      ).toBeVisible();
    });

    test("benefits section heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Why choose our van?" })
      ).toBeVisible();
    });

    test("services section heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Our Services" })
      ).toBeVisible();
    });

    test("partners section heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Our Partners" })
      ).toBeVisible();
    });

    test("footer copyright is in English", async ({ page }) => {
      await expect(page.getByText("All rights reserved")).toBeVisible();
    });
  });

  test.describe("Spanish (/es/)", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/es/");
    });

    test("page lang is 'es'", async ({ page }) => {
      await expect(page.locator("html")).toHaveAttribute("lang", "es");
    });

    test("hero heading is in Spanish", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Explora Brasil con comodidad y seguridad" })
      ).toBeVisible();
    });

    test("benefits section heading is in Spanish", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /Por qué elegir nuestra van/ })
      ).toBeVisible();
    });

    test("services section heading is in Spanish", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Nuestros Servicios" })
      ).toBeVisible();
    });
  });

  test.describe("Language Switcher", () => {
    test("language switcher is visible on home page", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("[data-testid='language-switcher']").first()).toBeVisible();
    });

    test("PT link is active on home page", async ({ page }) => {
      await page.goto("/");
      const ptLink = page.locator("[data-testid='language-switcher'] a").filter({ hasText: "PT" }).first();
      await expect(ptLink).toHaveAttribute("aria-current", "true");
    });

    test("EN link is active on /en/", async ({ page }) => {
      await page.goto("/en/");
      const enLink = page.locator("[data-testid='language-switcher'] a").filter({ hasText: "EN" }).first();
      await expect(enLink).toHaveAttribute("aria-current", "true");
    });

    test("clicking EN navigates to /en/", async ({ page }) => {
      await page.goto("/");
      await page.locator("[data-testid='language-switcher'] a").filter({ hasText: "EN" }).first().click();
      await expect(page).toHaveURL(/\/en\//);
    });
  });

  test.describe("hreflang", () => {
    test("home page has hreflang alternates", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator('link[hreflang="pt-BR"]')).toHaveAttribute(
        "href",
        "https://ramaral.com.br/"
      );
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
        "href",
        "https://ramaral.com.br/en/"
      );
      await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
        "href",
        "https://ramaral.com.br/es/"
      );
      await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
        "href",
        "https://ramaral.com.br/"
      );
    });
  });

  test.describe("Default locale (pt-BR)", () => {
    test("home page lang is pt-BR", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    });

    test("hero heading is in Portuguese", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "Sua Jornada Começa Aqui!" })
      ).toBeVisible();
    });
  });
});
