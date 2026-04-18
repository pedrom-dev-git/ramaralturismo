import { test, expect } from "@playwright/test";

/**
 * Anchor scroll tests — verifies that CTAs pointing to #hero-form
 * do not hide the form behind the sticky navbar (72px height).
 *
 * Assertiva: after scroll settle, the top of #hero-form is >= 72px
 * from the viewport top (i.e. not obscured by the sticky navbar).
 */

const NAVBAR_HEIGHT = 72;

/** Wait for scroll to settle after a click */
async function waitForScrollSettle(page: any) {
  await page.waitForTimeout(600);
}

test.describe("Anchor scroll — #hero-form not hidden behind sticky navbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Scroll down first so we're not already at top
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);
  });

  test("Hero CTA 'Solicitar Orçamento' scrolls form into view below navbar", async ({ page }) => {
    const heroCta = page
      .locator("section")
      .first()
      .getByRole("link", { name: "Solicitar Orçamento" });

    await heroCta.click();
    await waitForScrollSettle(page);

    const box = await page.locator("#hero-form").boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_HEIGHT);
  });

  test("Navbar desktop CTA scrolls form into view below navbar", async ({ page }) => {
    // Desktop CTA is hidden md:inline-flex — use desktop viewport (default)
    const desktopCta = page
      .locator("header")
      .getByRole("link", { name: "Solicitar Orçamento" })
      .filter({ hasText: "Solicitar Orçamento" })
      .first();

    await desktopCta.click();
    await waitForScrollSettle(page);

    const box = await page.locator("#hero-form").boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_HEIGHT);
  });

  test("Navbar mobile CTA scrolls form into view below navbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(200);

    // Open mobile menu first
    await page.locator("#menu-toggle").click();
    await page.waitForTimeout(200);

    // Mobile CTA is inside #mobile-menu
    const mobileCta = page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Solicitar Orçamento" });

    await mobileCta.click();
    await waitForScrollSettle(page);

    const box = await page.locator("#hero-form").boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_HEIGHT);
  });
});
