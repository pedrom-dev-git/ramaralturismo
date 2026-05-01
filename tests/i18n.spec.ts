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
        page.getByRole("heading", {
          name: "Explore Brazil with comfort and safety",
        }),
      ).toBeVisible();
    });

    test("benefits section heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Why choose our van?" }),
      ).toBeVisible();
    });

    test("services section heading is in English", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Our Services" }),
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
        page.getByRole("heading", {
          name: "Explora Brasil con comodidad y seguridad",
        }),
      ).toBeVisible();
    });

    test("benefits section heading is in Spanish", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: /Por qué elegir nuestra van/ }),
      ).toBeVisible();
    });

    test("services section heading is in Spanish", async ({ page }) => {
      await expect(
        page.getByRole("heading", { name: "Nuestros Servicios" }),
      ).toBeVisible();
    });
  });

  test.describe("Language Switcher", () => {
    test("language switcher is visible on home page", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.locator("[data-testid='language-switcher']").first(),
      ).toBeVisible();
    });

    test("PT link is active on home page", async ({ page }) => {
      await page.goto("/");
      const ptLink = page
        .locator("[data-testid='language-switcher'] a")
        .filter({ hasText: "PT" })
        .first();
      await expect(ptLink).toHaveAttribute("aria-current", "true");
    });

    test("EN link is active on /en/", async ({ page }) => {
      await page.goto("/en/");
      const enLink = page
        .locator("[data-testid='language-switcher'] a")
        .filter({ hasText: "EN" })
        .first();
      await expect(enLink).toHaveAttribute("aria-current", "true");
    });

    test("clicking EN navigates to /en/", async ({ page }) => {
      await page.goto("/");
      await page
        .locator("[data-testid='language-switcher'] a")
        .filter({ hasText: "EN" })
        .first()
        .click();
      await expect(page).toHaveURL(/\/en\//);
    });
  });

  test.describe("hreflang", () => {
    test("home page has hreflang alternates", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator('link[hreflang="pt-BR"]')).toHaveAttribute(
        "href",
        "https://ramaralturismo.job-3eb.workers.dev/",
      );
      await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
        "href",
        "https://ramaralturismo.job-3eb.workers.dev/en/",
      );
      await expect(page.locator('link[hreflang="es"]')).toHaveAttribute(
        "href",
        "https://ramaralturismo.job-3eb.workers.dev/es/",
      );
      await expect(page.locator('link[hreflang="x-default"]')).toHaveAttribute(
        "href",
        "https://ramaralturismo.job-3eb.workers.dev/",
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
        page.getByRole("heading", { name: "Sua Jornada Começa Aqui!" }),
      ).toBeVisible();
    });
  });

  test.describe("i18n — navbar links", () => {
    test("en: navbar link 'Destinations' present (not 'Destinos')", async ({
      page,
    }) => {
      await page.goto("/en/");
      const nav = page.locator("header nav").first();
      await expect(
        nav.getByRole("link", { name: "Destinations" }),
      ).toBeAttached();
      await expect(
        nav.getByRole("link", { name: "Destinos" }),
      ).not.toBeAttached();
    });

    test("en: navbar link 'Contact' present (not 'Contato')", async ({
      page,
    }) => {
      await page.goto("/en/");
      const nav = page.locator("header nav").first();
      await expect(nav.getByRole("link", { name: "Contact" })).toBeAttached();
      await expect(
        nav.getByRole("link", { name: "Contato" }),
      ).not.toBeAttached();
    });

    test("es: navbar link 'Destinos' present", async ({ page }) => {
      await page.goto("/es/");
      const nav = page.locator("header nav").first();
      await expect(nav.getByRole("link", { name: "Destinos" })).toBeAttached();
    });

    test("es: navbar link 'Contacto' present (not 'Contato')", async ({
      page,
    }) => {
      await page.goto("/es/");
      const nav = page.locator("header nav").first();
      await expect(nav.getByRole("link", { name: "Contacto" })).toBeAttached();
      await expect(
        nav.getByRole("link", { name: "Contato" }),
      ).not.toBeAttached();
    });

    test("en: navbar has no 'Blog' or 'Novidades' links", async ({ page }) => {
      await page.goto("/en/");
      const nav = page.locator("header nav").first();
      await expect(nav.getByRole("link", { name: "Blog" })).not.toBeAttached();
      await expect(
        nav.getByRole("link", { name: "Novidades" }),
      ).not.toBeAttached();
      await expect(nav.getByRole("link", { name: "News" })).not.toBeAttached();
    });
  });

  test.describe("i18n — footer links", () => {
    test("en: footer nav link 'Contact' present (nav list, not email link)", async ({
      page,
    }) => {
      await page.goto("/en/");
      // Nav links are in a <ul> inside footer; email link is a mailto: href
      const footerNavList = page.locator("footer ul").first();
      await expect(
        footerNavList.getByRole("link", { name: "Contact" }),
      ).toBeAttached();
      await expect(
        footerNavList.getByRole("link", { name: "Contato" }),
      ).not.toBeAttached();
    });

    test("es: footer nav link 'Contacto' present (nav list, not email link)", async ({
      page,
    }) => {
      await page.goto("/es/");
      const footerNavList = page.locator("footer ul").first();
      await expect(
        footerNavList.getByRole("link", { name: "Contacto" }),
      ).toBeAttached();
      await expect(
        footerNavList.getByRole("link", { name: "Contato" }),
      ).not.toBeAttached();
    });

    test("en: footer nav list has no 'Blog' or 'News' links", async ({
      page,
    }) => {
      await page.goto("/en/");
      const footerNavList = page.locator("footer ul").first();
      await expect(
        footerNavList.getByRole("link", { name: "Blog" }),
      ).not.toBeAttached();
      await expect(
        footerNavList.getByRole("link", { name: "News" }),
      ).not.toBeAttached();
    });
  });

  test.describe("i18n — hero radio labels and form placeholders", () => {
    test("en: hero tipo radio 'Tourism' visible in radiogroup (not 'Turismo e Viagens')", async ({
      page,
    }) => {
      await page.goto("/en/");
      const radiogroup = page.getByRole("radiogroup");
      await expect(radiogroup.getByText("Tourism")).toBeVisible();
      await expect(
        radiogroup.getByText("Turismo e Viagens"),
      ).not.toBeAttached();
    });

    test("en: hero tipo radio 'School' visible in radiogroup (not 'Transporte Escolar')", async ({
      page,
    }) => {
      await page.goto("/en/");
      const radiogroup = page.getByRole("radiogroup");
      await expect(radiogroup.getByText("School")).toBeVisible();
      await expect(
        radiogroup.getByText("Transporte Escolar"),
      ).not.toBeAttached();
    });

    test("en: hero tipo radio 'Corporate' visible in radiogroup", async ({
      page,
    }) => {
      await page.goto("/en/");
      const radiogroup = page.getByRole("radiogroup");
      await expect(radiogroup.getByText("Corporate")).toBeVisible();
    });

    test("en: departure date label is 'Departure date' (not 'Data de ida')", async ({
      page,
    }) => {
      await page.goto("/en/");
      await expect(page.getByText("Departure date")).toBeVisible();
      await expect(page.getByText("Data de ida")).not.toBeVisible();
    });

    test("en: return date label is 'Return date' (not 'Data de volta')", async ({
      page,
    }) => {
      await page.goto("/en/");
      await expect(page.getByText("Return date")).toBeVisible();
      await expect(page.getByText("Data de volta")).not.toBeVisible();
    });

    test("es: departure date label is 'Fecha de ida' (not 'Data de ida')", async ({
      page,
    }) => {
      await page.goto("/es/");
      await expect(page.getByText("Fecha de ida")).toBeVisible();
      await expect(page.getByText("Data de ida")).not.toBeVisible();
    });

    test("es: hero tipo radio 'Escolar' visible in radiogroup (not 'Transporte Escolar')", async ({
      page,
    }) => {
      await page.goto("/es/");
      const radiogroup = page.getByRole("radiogroup");
      await expect(radiogroup.getByText("Escolar")).toBeVisible();
      await expect(
        radiogroup.getByText("Transporte Escolar"),
      ).not.toBeAttached();
    });
  });

  test.describe("i18n — moved strings: CTA buttons", () => {
    test("pt-BR: CTA hero button says 'Solicitar Orçamento'", async ({
      page,
    }) => {
      await page.goto("/");
      const btn = page
        .locator("a[href='#hero-form']")
        .filter({ hasText: /Solicitar Orçamento/i })
        .first();
      await expect(btn).toBeVisible();
    });

    test("en: CTA hero button says 'Request a Quote'", async ({ page }) => {
      await page.goto("/en/");
      const btn = page
        .locator("a[href='#hero-form']")
        .filter({ hasText: /Request a Quote/i })
        .first();
      await expect(btn).toBeVisible();
    });

    test("es: CTA hero button says 'Solicitar Presupuesto'", async ({
      page,
    }) => {
      await page.goto("/es/");
      const btn = page
        .locator("a[href='#hero-form']")
        .filter({ hasText: /Solicitar Presupuesto/i })
        .first();
      await expect(btn).toBeVisible();
    });

    test("pt-BR: 'Nossos Serviços' section link is present", async ({
      page,
    }) => {
      await page.goto("/");
      const link = page
        .locator("a[href='#servicos']")
        .filter({ hasText: /Nossos Serviços/i })
        .first();
      await expect(link).toBeVisible();
    });

    test("en: 'Our Services' section link is present", async ({ page }) => {
      await page.goto("/en/");
      const link = page
        .locator("a[href='#servicos']")
        .filter({ hasText: /Our Services/i })
        .first();
      await expect(link).toBeVisible();
    });

    test("es: 'Nuestros Servicios' section link is present", async ({
      page,
    }) => {
      await page.goto("/es/");
      const link = page
        .locator("a[href='#servicos']")
        .filter({ hasText: /Nuestros Servicios/i })
        .first();
      await expect(link).toBeVisible();
    });

    test("pt-BR: quote form heading is in Portuguese", async ({ page }) => {
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: /Faça seu orçamento/i }),
      ).toBeVisible();
    });

    test("en: quote form heading is in English", async ({ page }) => {
      await page.goto("/en/");
      await expect(
        page.getByRole("heading", { name: /Get your quote/i }),
      ).toBeVisible();
    });

    test("es: quote form heading is in Spanish", async ({ page }) => {
      await page.goto("/es/");
      await expect(
        page.getByRole("heading", { name: /Solicita tu presupuesto/i }),
      ).toBeVisible();
    });

    test("pt-BR: Navbar CTA says 'Solicitar Orçamento'", async ({ page }) => {
      await page.goto("/");
      // Two CTAs exist (desktop hidden + mobile visible); at least one must be in DOM
      const navCta = page
        .locator("header a[href='#hero-form']")
        .filter({ hasText: /Solicitar Orçamento/i });
      await expect(navCta.first()).toBeAttached();
    });

    test("en: Navbar CTA says 'Request a Quote'", async ({ page }) => {
      await page.goto("/en/");
      const navCta = page
        .locator("header a[href='#hero-form']")
        .filter({ hasText: /Request a Quote/i });
      await expect(navCta.first()).toBeAttached();
    });

    test("es: Navbar CTA says 'Solicitar Presupuesto'", async ({ page }) => {
      await page.goto("/es/");
      const navCta = page
        .locator("header a[href='#hero-form']")
        .filter({ hasText: /Solicitar Presupuesto/i });
      await expect(navCta.first()).toBeAttached();
    });
  });
});
