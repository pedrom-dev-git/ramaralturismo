import { test, expect } from "@playwright/test";

const PATHS = ["/", "/en/", "/es/"];

for (const path of PATHS) {
  test.describe(`FleetBanner — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("section #fleet is rendered between Hero and Benefits", async ({
      page,
    }) => {
      const fleet = page.locator("section#fleet");
      await expect(fleet).toBeVisible();
      const benefits = page.locator("#beneficios, [data-section='benefits']");
      const fleetBox = await fleet.boundingBox();
      const benefitsCount = await benefits.count();
      if (benefitsCount > 0) {
        const benefitsBox = await benefits.first().boundingBox();
        expect(fleetBox?.y ?? 0).toBeLessThan(benefitsBox?.y ?? Infinity);
      }
    });

    test("van photo is rendered with non-empty alt", async ({ page }) => {
      const img = page.locator(
        "section#fleet img[src*='van-amaral']",
      );
      await expect(img).toBeVisible();
      const alt = await img.getAttribute("alt");
      expect(alt).toBeTruthy();
      expect(alt!.length).toBeGreaterThan(3);
    });

    test("5 credibility chips are rendered", async ({ page }) => {
      const chips = page.locator("section#fleet ul[aria-label] > li");
      await expect(chips).toHaveCount(5);
    });

    test("3 credentials are clickable links to public consultation portals", async ({
      page,
    }) => {
      const links = page.locator("section#fleet a[target='_blank']");
      await expect(links).toHaveCount(3);
      const hrefs = await links.evaluateAll((els) =>
        (els as HTMLAnchorElement[]).map((a) => a.href),
      );
      expect(hrefs.some((h) => h.includes("cadastur.turismo.gov.br"))).toBe(
        true,
      );
      expect(hrefs.some((h) => h.includes("portal.antt.gov.br"))).toBe(true);
      expect(hrefs.some((h) => h.includes("sc.gov.br"))).toBe(true);
    });

    test("external links carry rel noopener+noreferrer (security baseline)", async ({
      page,
    }) => {
      const links = page.locator("section#fleet a[target='_blank']");
      const rels = await links.evaluateAll((els) =>
        (els as HTMLAnchorElement[]).map((a) => a.rel),
      );
      for (const rel of rels) {
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
      }
    });

    test("ANTT chip explicitly mentions TAF (fretamento, not RNTRC cargas)", async ({
      page,
    }) => {
      const anttChip = page.locator("section#fleet a", {
        hasText: /ANTT/i,
      });
      await expect(anttChip).toBeVisible();
      await expect(anttChip).toContainText(/TAF/);
      await expect(anttChip).toContainText(/006462/);
    });

    test("SIE-SC chip carries the registration number 2685/c", async ({
      page,
    }) => {
      const sieChip = page.locator("section#fleet a", {
        hasText: /SIE/i,
      });
      await expect(sieChip).toContainText(/2685\/c/);
    });
  });
}
