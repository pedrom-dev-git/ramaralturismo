/**
 * analytics.spec.ts — Cloudflare Web Analytics beacon conditional rendering
 *
 * Two Playwright projects cover both scenarios:
 *   - "chromium"          → dev server on :4321, no token → asserts beacon absent
 *   - "analytics-beacon"  → dev server on :4322, token set → asserts beacon present
 *
 * Run all: just test turismo
 * Run one project: pnpm playwright test --project=analytics-beacon
 */

import { test, expect } from "@playwright/test";

const LOCALES = ["/", "/en/", "/es/"];
const BEACON_SRC =
  "https://static.cloudflareinsights.com/beacon.min.js";
const TEST_TOKEN = "test-token-ci";

// ---------------------------------------------------------------------------
// Scenario 1 — No token: dev server on :4321 renders without beacon
// Covered by project "chromium" (grep: /no token/)
// ---------------------------------------------------------------------------
test.describe("CF Analytics beacon — no token", () => {
  for (const path of LOCALES) {
    test(`no beacon script on ${path} when token absent`, async ({ page }) => {
      await page.goto(path);
      const html = await page.content();
      expect(html).not.toContain("cloudflareinsights.com/beacon.min.js");
      expect(html).not.toContain("data-cf-beacon");
    });
  }
});

// ---------------------------------------------------------------------------
// Scenario 2 — With token: dev server on :4322 (PUBLIC_CF_ANALYTICS_TOKEN set)
// Covered by project "analytics-beacon" (grep: /with token/)
// baseURL override points to :4322 where the token-aware dev server runs.
// ---------------------------------------------------------------------------
test.describe("CF Analytics beacon — with token", () => {
  test.use({ baseURL: "http://localhost:4322" });

  for (const path of LOCALES) {
    test(`beacon present with correct attrs on ${path}`, async ({ page }) => {
      await page.goto(path);
      const html = await page.content();

      // beacon script must be present
      expect(html).toContain(BEACON_SRC);

      // must have defer attribute
      const scriptHandle = page.locator(
        `script[src="${BEACON_SRC}"]`,
      );
      await expect(scriptHandle).toHaveAttribute("defer", "");

      // data-cf-beacon must be valid JSON containing the token
      const beaconAttr = await scriptHandle.getAttribute("data-cf-beacon");
      expect(beaconAttr).not.toBeNull();
      let parsed: unknown;
      expect(() => {
        parsed = JSON.parse(beaconAttr!);
      }).not.toThrow();
      expect((parsed as Record<string, unknown>).token).toBe(TEST_TOKEN);
    });
  }
});
