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

  // Hero CTA "Solicitar Orçamento" foi removido na simplificação do Hero
  // (2026-05-04). Único CTA agora é o do Navbar (testado abaixo) + WhatsApp
  // direto via wa.me link no Hero.

  test("Navbar desktop CTA scrolls form into view below navbar", async ({
    page,
  }) => {
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
    // Tolerância de 1px pra fractional pixel rounding em CI runners (visto
    // 71.5 consistente no GitHub Actions com NAVBAR_HEIGHT=72).
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_HEIGHT - 1);
  });

  test("Navbar mobile CTA scrolls form into view below navbar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Force instant scroll (some pages enable scroll-behavior:smooth globally)
    await page.evaluate(() => {
      window.scrollTo({ top: 800, behavior: "instant" as ScrollBehavior });
    });
    await page.waitForTimeout(400);

    // Open mobile menu first
    await page.locator("#menu-toggle").click();
    await page.waitForTimeout(400);

    // Mobile CTA is inside #mobile-menu
    const mobileCta = page
      .locator("#mobile-menu")
      .getByRole("link", { name: "Solicitar Orçamento" });

    await mobileCta.click();
    // Wait for form to enter viewport before measuring (more robust than
    // a fixed scrollSettle delay in slow CI runners)
    await expect(page.locator("#hero-form")).toBeInViewport();
    await waitForScrollSettle(page);

    const box = await page.locator("#hero-form").boundingBox();
    expect(box).toBeTruthy();
    // Tolerância de 1px pra fractional pixel rounding em CI runners (visto
    // 71.5 consistente no GitHub Actions com NAVBAR_HEIGHT=72).
    expect(box!.y).toBeGreaterThanOrEqual(NAVBAR_HEIGHT - 1);
  });
});
