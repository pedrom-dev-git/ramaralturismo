import { test, expect } from "@playwright/test";

const PATHS = ["/", "/en/", "/es/"];

for (const path of PATHS) {
  test.describe(`Hero CSP compatibility — ${path}`, () => {
    test("no inline executable scripts (CSP script-src 'self' safe)", async ({
      page,
    }) => {
      await page.goto(path);
      const inlineScripts = await page
        .locator("script:not([src])")
        .evaluateAll((scripts) =>
          (scripts as HTMLScriptElement[])
            .filter((s) => {
              const body = s.textContent?.trim() ?? "";
              if (!body) return false;
              const type = s.type || "";
              if (type === "application/json") return false;
              if (type === "application/ld+json") return false;
              // Astro Dev Toolbar (dev-only, not present in prod build)
              if (body.includes("__astro_dev_toolbar__")) return false;
              return true;
            })
            .map((s) => ({
              type: s.type || "(default)",
              preview: s.textContent!.substring(0, 100).replace(/\s+/g, " "),
            })),
        );

      if (inlineScripts.length > 0) {
        console.error(
          "Inline executable scripts detected (will be blocked by CSP in prod):",
          JSON.stringify(inlineScripts, null, 2),
        );
      }
      expect(inlineScripts).toEqual([]);
    });
  });
}
