import { test, expect } from "@playwright/test";

// Regression: Navbar/Footer anchor links must point to home (#fleet, #destinos,
// #contato) regardless of the page the visitor is on. Before the fix,
// href="#fleet" was relative to the current path, breaking on /sobre,
// /credenciais, /privacy etc (visitor stuck on the same page instead of
// jumping to the home anchor).

const PAGES_TO_CHECK = [
  "/",
  "/sobre/",
  "/credenciais/",
  "/privacy/",
  "/termos/",
  "/contato-lgpd/",
  "/en/",
  "/en/sobre/",
];

const ANCHOR_LINKS = [
  { label: "frota", expectedHref: "/#fleet" },
  { label: "destinos", expectedHref: "/#destinos" },
  { label: "contato", expectedHref: "/#contato" },
];

for (const path of PAGES_TO_CHECK) {
  test.describe(`Anchor links — ${path}`, () => {
    for (const { label, expectedHref } of ANCHOR_LINKS) {
      test(`navbar+footer ${label} link points to home (${expectedHref}, not ${path}${expectedHref.replace(
        "/",
        "",
      )})`, async ({ page }) => {
        await page.goto(path);
        const navOrFooterLinks = page.locator(
          `a[href$="${expectedHref.replace("/", "")}"]`,
        );
        const count = await navOrFooterLinks.count();
        expect(count).toBeGreaterThanOrEqual(2);

        const allHrefs = await navOrFooterLinks.evaluateAll((links) =>
          links.map((a) => (a as HTMLAnchorElement).getAttribute("href")),
        );

        for (const href of allHrefs) {
          expect(href).not.toContain("/sobre#");
          expect(href).not.toContain("/credenciais#");
          expect(href).not.toContain("/privacy#");
          expect(href).not.toContain("/termos#");
          expect(href).not.toContain("/contato-lgpd#");
        }
      });
    }
  });
}
