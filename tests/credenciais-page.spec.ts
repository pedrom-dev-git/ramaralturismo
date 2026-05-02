import { test, expect } from "@playwright/test";

const PATHS = ["/credenciais", "/en/credenciais", "/es/credenciais"];

for (const path of PATHS) {
  test.describe(`Credenciais page — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("returns 200 and has a single H1 in main content", async ({
      page,
    }) => {
      // Scoped to <main> — Astro Dev Toolbar widgets inject extra h1s
      // into shadow DOM in dev mode, which we don't want to assert on.
      await expect(page.locator("main h1")).toHaveCount(1);
      const h1Text = await page.locator("main h1").innerText();
      expect(h1Text.length).toBeGreaterThan(3);
    });

    test("renders 4 credential articles", async ({ page }) => {
      const articles = page.locator("main article");
      await expect(articles).toHaveCount(4);
    });

    test("3 articles have external 'verify' link to public portal", async ({
      page,
    }) => {
      const verifyLinks = page.locator("main article a[target='_blank']");
      await expect(verifyLinks).toHaveCount(3);
      const hrefs = await verifyLinks.evaluateAll((els) =>
        (els as HTMLAnchorElement[]).map((a) => a.href),
      );
      expect(hrefs.some((h) => h.includes("cadastur.turismo.gov.br"))).toBe(
        true,
      );
      expect(hrefs.some((h) => h.includes("portal.antt.gov.br"))).toBe(true);
      expect(hrefs.some((h) => h.includes("sc.gov.br"))).toBe(true);
    });

    test("verify links carry rel noopener+noreferrer", async ({ page }) => {
      const verifyLinks = page.locator("main article a[target='_blank']");
      const rels = await verifyLinks.evaluateAll((els) =>
        (els as HTMLAnchorElement[]).map((a) => a.rel),
      );
      for (const rel of rels) {
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });

    test("ANTT card mentions TAF and 006462", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toContain("ANTT");
      expect(body).toContain("TAF");
      expect(body).toContain("006462");
    });

    test("SIE card mentions 2685/c", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toContain("2685/c");
    });

    test("disclaimer + last updated date are visible", async ({ page }) => {
      const body = await page.locator("main").innerText();
      expect(body).toMatch(/2026-/);
    });

    test("page is reachable from footer credentials link", async ({ page }) => {
      const homePath = path.startsWith("/en")
        ? "/en/"
        : path.startsWith("/es")
          ? "/es/"
          : "/";
      await page.goto(homePath);
      const link = page.locator("footer a[href='/credenciais']").first();
      await expect(link).toBeVisible();
    });
  });
}
