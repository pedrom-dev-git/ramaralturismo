import { test, expect } from "@playwright/test";
import { resolve } from "node:path";

// Build asset, not a regression test. Run on demand to regenerate
// /public/og-cover.jpg from /.og-template/og-cover.html. Skipped by
// default so CI does not depend on the template (which is gitignored).
test.skip("generate og-cover.jpg from .og-template/og-cover.html", async ({
  page,
}) => {
  const root = process.cwd();
  const tmpl = resolve(root, ".og-template", "og-cover.html");
  const out = resolve(root, "public", "og-cover.jpg");
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.goto("file://" + tmpl);
  await page.waitForLoadState("networkidle");
  await page.screenshot({
    path: out,
    type: "jpeg",
    quality: 90,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  expect(true).toBe(true);
});
