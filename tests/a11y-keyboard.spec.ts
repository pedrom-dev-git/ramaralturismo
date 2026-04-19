import { test, expect } from "@playwright/test";

/**
 * WCAG 2.1 keyboard navigation + accessible name spec
 * Covers: 2.1.1 (keyboard), 2.4.3 (focus order), 4.1.2 (name/role/value)
 *
 * RED: news-prev/next aria-label absent; Esc handler absent on mobile menu.
 */

const locales = [
  { name: "pt-BR", path: "/" },
  { name: "en", path: "/en/" },
  { name: "es", path: "/es/" },
];

// ── 4.1.2: icon-only buttons must have accessible names ─────────────────

for (const { name, path } of locales) {
  test(`[${name}] news-prev button has non-empty aria-label`, async ({
    page,
  }) => {
    await page.goto(path);
    const btn = page.locator("button.news-prev");
    await expect(btn).toHaveAttribute("aria-label", /.+/);
  });

  test(`[${name}] news-next button has non-empty aria-label`, async ({
    page,
  }) => {
    await page.goto(path);
    const btn = page.locator("button.news-next");
    await expect(btn).toHaveAttribute("aria-label", /.+/);
  });

  test(`[${name}] hamburger button has non-empty aria-label`, async ({
    page,
  }) => {
    await page.goto(path);
    const btn = page.locator("#menu-toggle");
    await expect(btn).toHaveAttribute("aria-label", /.+/);
  });
}

// ── 4.1.2: accessibility snapshot — all role:button nodes must have a name ─

test("pt-BR: accessibility snapshot — no unnamed buttons", async ({ page }) => {
  await page.goto("/");
  const snapshot = await page.accessibility.snapshot({ interestingOnly: true });
  expect(snapshot).not.toBeNull();

  function collectUnnamedButtons(
    node: NonNullable<typeof snapshot>
  ): string[] {
    const issues: string[] = [];
    if (node.role === "button" && (!node.name || node.name.trim() === "")) {
      issues.push(`unnamed button (children: ${JSON.stringify(node.children?.map((c) => c.name))})`);
    }
    for (const child of node.children ?? []) {
      issues.push(...collectUnnamedButtons(child));
    }
    return issues;
  }

  const unnamedButtons = collectUnnamedButtons(snapshot!);
  expect(unnamedButtons, `Unnamed buttons found: ${unnamedButtons.join(", ")}`).toHaveLength(0);
});

// ── 2.4.3: tab order — skip link is first focusable element ─────────────

test("pt-BR: skip link receives focus on first Tab", async ({ page }) => {
  await page.goto("/");
  // Press Tab from a neutral state — skip link should be the very first focus
  await page.keyboard.press("Tab");
  const skipLink = page.locator('a[href="#main"]');
  await expect(skipLink).toBeFocused();
});

test("pt-BR: tab order — navbar logo is second focusable after skip link", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab"); // 1st: skip link
  await page.keyboard.press("Tab"); // 2nd: navbar logo (the img-wrapping anchor)
  // Use first() to target the logo anchor specifically (not the language switcher /en/ link)
  const logo = page.locator('header .flex.items-center > a').first();
  await expect(logo).toBeFocused();
});

// ── 2.1.1: Esc closes mobile menu ───────────────────────────────────────

test("pt-BR: Esc key closes mobile menu when open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const toggle = page.locator("#menu-toggle");
  const menu = page.locator("#mobile-menu");

  // The toggle script adds/removes the standalone "hidden" class.
  // Before click the menu has "hidden" in its class list (the plain utility, not md:hidden).
  // We check visibility via isVisible which respects display:none from the hidden class.
  await expect(menu).not.toBeVisible();

  // Open menu via click
  await toggle.click();
  await expect(menu).toBeVisible();

  // Close via Escape — this is the GREEN behaviour we are asserting.
  // RED: no Escape handler exists yet, so menu stays open.
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
});

// ── 2.1.1: Arrow keys navigate radio group ──────────────────────────────

test("pt-BR: ArrowRight moves focus between tipo radios", async ({ page }) => {
  await page.goto("/");

  // Focus the first radio (turismo)
  const firstRadio = page.locator('input[name="tipo"][value="turismo"]');
  await firstRadio.focus();
  await expect(firstRadio).toBeFocused();

  // Arrow right — should move to escolar
  await page.keyboard.press("ArrowRight");
  const secondRadio = page.locator('input[name="tipo"][value="escolar"]');
  await expect(secondRadio).toBeFocused();
});
