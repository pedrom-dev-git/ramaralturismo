/**
 * a11y-motion-landmarks.spec.ts
 *
 * Guards:
 * 1. prefers-reduced-motion: reduce — CSS transitions and animations must be
 *    suppressed for users who request reduced motion (WCAG 2.3.3).
 * 2. Landmark structure snapshot — nav elements have aria-label, footer tag
 *    present, counts stable across all three locales.
 */

import { test, expect } from "@playwright/test";

const PAGES = ["/", "/en/", "/es/"];

// ---------------------------------------------------------------------------
// 1. Reduced motion
// ---------------------------------------------------------------------------

for (const path of PAGES) {
  test.describe(`reduced-motion — ${path}`, () => {
    test.use({
      colorScheme: "no-preference",
    });

    test("hamburger spans have transition-duration 0s under reduced-motion", async ({
      page,
    }) => {
      // Emulate reduced motion preference
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);

      // All three hamburger spans carry Tailwind transition-transform / transition-opacity
      const spans = page.locator("#menu-toggle span[aria-hidden='true']");
      await expect(spans).toHaveCount(3);

      // Each span must have transition-duration computed as 0s
      const durations: string[] = await spans.evaluateAll((els) =>
        els.map(
          (el) => getComputedStyle(el).transitionDuration
        )
      );

      for (const d of durations) {
        // CSS sets 0.01ms as the near-zero value (0s can be ignored by some
        // browsers when !important is involved). Accept anything < 50ms as
        // "effectively instant" — the meaningful threshold is < 100ms per WCAG.
        const ms =
          d.endsWith("ms") ? parseFloat(d) : parseFloat(d) * 1000;
        expect(ms, `expected near-zero transition on span, got ${d}`).toBeLessThan(
          50
        );
      }
    });

    test("news slide hover overlay has transition-duration 0s under reduced-motion", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);

      // The overlay div inside each swiper-slide carries transition-colors duration-300
      const overlay = page
        .locator(".news-swiper .swiper-slide")
        .first()
        .locator("div.absolute");
      await expect(overlay).toBeAttached();

      const duration = await overlay.evaluate(
        (el) => getComputedStyle(el).transitionDuration
      );
      const ms =
        duration.endsWith("ms")
          ? parseFloat(duration)
          : parseFloat(duration) * 1000;
      expect(ms, `expected near-zero transition on overlay, got ${duration}`).toBeLessThan(
        50
      );
    });
  });
}

// ---------------------------------------------------------------------------
// 2. Landmark structure snapshot
// ---------------------------------------------------------------------------

for (const path of PAGES) {
  test.describe(`landmark snapshot — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("page has exactly one <footer> element", async ({ page }) => {
      await expect(page.locator("footer")).toHaveCount(1);
    });

    test("all <nav> elements have aria-label or aria-labelledby", async ({
      page,
    }) => {
      const navs = page.locator("nav");
      const count = await navs.count();
      expect(count).toBeGreaterThanOrEqual(1);

      for (let i = 0; i < count; i++) {
        const nav = navs.nth(i);
        const label = await nav.getAttribute("aria-label");
        const labelledby = await nav.getAttribute("aria-labelledby");
        expect(
          label !== null || labelledby !== null,
          `nav[${i}] on ${path} must have aria-label or aria-labelledby`
        ).toBe(true);
      }
    });

    test("all <nav> aria-labels are unique per page", async ({ page }) => {
      const navs = page.locator("nav[aria-label]");
      const count = await navs.count();
      const labels: string[] = await navs.evaluateAll((els) =>
        els.map((el) => el.getAttribute("aria-label") ?? "")
      );
      const unique = new Set(labels);
      expect(unique.size).toBe(count);
    });
  });
}
