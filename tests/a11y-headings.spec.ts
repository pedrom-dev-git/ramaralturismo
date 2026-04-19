/**
 * a11y headings — WCAG 2.4.6 (Headings and Labels) + WCAG 1.3.1 (Info and Relationships)
 *
 * Guards enforced for every route (/, /en/, /es/):
 *   1. Exactly 1 <h1> per page.
 *   2. The first heading element in DOM order is <h1>.
 *   3. Heading level sequence is monotonically non-skipping: each next level
 *      must be <= previous level + 1 (e.g., h1→h3 without h2 is a violation).
 *      Descending levels (h3→h2, h2→h1) are valid — only jumps up are guarded.
 *
 * Context (Sprint 5a — 2026-04-18):
 *   Static analysis of component tree:
 *     H1 → H2 → H2 → H2 → H3 × 2 → H2 → H3 × 5 → H4 × 2
 *   All deltas ≤ 1. No structural violation found.
 *   Spec committed as regression guard — RED not applicable (no violation to drive).
 *   Note: a stale dev server (reuseExistingServer=true) produced a false-positive
 *   h1 count of 5 on / during initial run. Stable green on clean server restart.
 *
 * Component source of each heading:
 *   H1  — Hero.astro (hero.title)
 *   H2  — Hero.astro (hero.formHeading), Benefits.astro, Services.astro, NewsCarousel.astro
 *   H3  — ServiceCard.astro (×2), NewsCarousel.astro slides (×5)
 *   H4  — Footer.astro (footer.nav, footer.contact)
 */

import { test, expect } from "@playwright/test";

const PAGES = ["/", "/en/", "/es/"];
const HEADING_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_SELECTOR = HEADING_TAGS.join(", ");

/** Convert a tag name like "H2" or "h2" to its numeric level (1–6). */
function tagToLevel(tag: string): number {
  return parseInt(tag.replace(/[hH]/, ""), 10);
}

for (const path of PAGES) {
  test.describe(`a11y headings — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("has exactly one h1", async ({ page }) => {
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBe(1);
    });

    test("first heading in DOM is h1", async ({ page }) => {
      const firstHeadingTag = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el ? el.tagName : null;
      }, HEADING_SELECTOR);

      expect(firstHeadingTag).not.toBeNull();
      expect(firstHeadingTag!.toLowerCase()).toBe("h1");
    });

    test("heading sequence has no skipped levels (monotonic ascent)", async ({
      page,
    }) => {
      const levels: number[] = await page.evaluate((selector) => {
        const headings = Array.from(document.querySelectorAll(selector));
        return headings.map((el) =>
          parseInt(el.tagName.replace(/[hH]/, ""), 10),
        );
      }, HEADING_SELECTOR);

      expect(levels.length).toBeGreaterThan(0);

      const violations: string[] = [];
      for (let i = 1; i < levels.length; i++) {
        const prev = levels[i - 1];
        const curr = levels[i];
        // Only ascending jumps > 1 are violations (h1→h3 skips h2).
        // Descending or same-level is always valid.
        if (curr > prev + 1) {
          violations.push(
            `Position ${i}: h${prev} → h${curr} skips a level`,
          );
        }
      }

      if (violations.length > 0) {
        throw new Error(
          `Heading level violations on ${path}:\n${violations.join("\n")}\n` +
            `Full sequence: ${levels.map((l) => `h${l}`).join(" → ")}`,
        );
      }
    });
  });
}
