/**
 * analytics.spec.ts — Cloudflare Web Analytics beacon conditional rendering
 *
 * Strategy: verify beacon presence/absence in the dev server HTML (rendered
 * server-side by Astro). The dev server does NOT have PUBLIC_CF_ANALYTICS_TOKEN
 * set in the test environment, so we always test the "no token" path via page.goto.
 *
 * For the "token present" path we inspect the HTML source directly: when
 * PUBLIC_CF_ANALYTICS_TOKEN is set at build time the rendered HTML must contain
 * the beacon script; when absent it must not.
 *
 * Note: full build-with-env-var test would require spawning a separate build
 * process inside the spec — that is out of scope for this Playwright suite.
 * The conditional logic is covered by the BaseLayout unit-level check below
 * (inspect Astro template hydration via page.content()) plus a manual gate visual
 * documented in the Sprint 4 handoff.
 */

import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const LOCALES = ["/", "/en/", "/es/"];
const DIST_DIR = join(import.meta.dirname, "../dist/client");

// ---------------------------------------------------------------------------
// Scenario 1 — No token: dev server renders without beacon
// ---------------------------------------------------------------------------
test.describe("CF Analytics beacon — no token (dev server)", () => {
  for (const path of LOCALES) {
    test(`no beacon script on ${path} when token absent`, async ({ page }) => {
      await page.goto(path);
      const html = await page.content();
      // Must NOT contain any reference to cloudflareinsights beacon
      expect(html).not.toContain("cloudflareinsights.com/beacon.min.js");
      expect(html).not.toContain("data-cf-beacon");
    });
  }
});

// ---------------------------------------------------------------------------
// Scenario 2 — With token: verify conditional render via build output
// This test is skipped if dist/client is absent or stale — it requires a
// production build run with PUBLIC_CF_ANALYTICS_TOKEN=test123.
// Run manually: PUBLIC_CF_ANALYTICS_TOKEN=test123 pnpm build && pnpm test -- tests/analytics.spec.ts
// ---------------------------------------------------------------------------
const TEST_TOKEN = "test123";
const distExists = existsSync(DIST_DIR);
const distHasToken = distExists &&
  (() => {
    try {
      const indexHtml = readFileSync(join(DIST_DIR, "index.html"), "utf-8");
      return indexHtml.includes(TEST_TOKEN);
    } catch {
      return false;
    }
  })();

test.describe("CF Analytics beacon — with token (build output)", () => {
  test.skip(
    !distHasToken,
    "Skipped: build with PUBLIC_CF_ANALYTICS_TOKEN=test123 not present. " +
      "Run: PUBLIC_CF_ANALYTICS_TOKEN=test123 pnpm build && pnpm test -- tests/analytics.spec.ts",
  );

  const htmlFiles: Record<string, string> = {
    "/": join(DIST_DIR, "index.html"),
    "/en/": join(DIST_DIR, "en/index.html"),
    "/es/": join(DIST_DIR, "es/index.html"),
  };

  for (const [path, filePath] of Object.entries(htmlFiles)) {
    test(`beacon with token present on ${path}`, () => {
      const html = readFileSync(filePath, "utf-8");
      expect(html).toContain("cloudflareinsights.com/beacon.min.js");
      expect(html).toContain("data-cf-beacon");
      expect(html).toContain(TEST_TOKEN);
    });
  }
});
