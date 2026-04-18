import { test, expect } from "@playwright/test";

const PAGES = ["/", "/en/", "/es/"];

for (const path of PAGES) {
  test.describe(`a11y landmarks — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("has exactly one <main> element", async ({ page }) => {
      const mains = page.locator("main");
      await expect(mains).toHaveCount(1);
    });

    test("<main> has id='main'", async ({ page }) => {
      await expect(page.locator("main#main")).toHaveCount(1);
    });

    test("skip link is present in DOM before header", async ({ page }) => {
      const skipLink = page.locator("a[href='#main']");
      await expect(skipLink).toHaveCount(1);
      // Skip link must come before the header in DOM order
      const bodyHTML = await page.locator("body").innerHTML();
      const skipIdx = bodyHTML.indexOf('href="#main"');
      const headerIdx = bodyHTML.indexOf("<header");
      expect(skipIdx).toBeGreaterThanOrEqual(0);
      expect(headerIdx).toBeGreaterThanOrEqual(0);
      expect(skipIdx).toBeLessThan(headerIdx);
    });

    test("skip link is first focusable element (Tab from body)", async ({
      page,
    }) => {
      // Move focus to body first
      await page.evaluate(() => (document.body as HTMLElement).focus());
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tag: el.tagName, href: el.getAttribute("href") } : null;
      });
      expect(focused).not.toBeNull();
      expect(focused!.tag.toLowerCase()).toBe("a");
      expect(focused!.href).toBe("#main");
    });

    test("skip link becomes visible on focus", async ({ page }) => {
      await page.evaluate(() => (document.body as HTMLElement).focus());
      await page.keyboard.press("Tab");
      const skipLink = page.locator("a[href='#main']");
      // After Tab, skip link should be visible (not sr-only)
      await expect(skipLink).toBeVisible();
    });

    test("<header> and <footer> are outside <main>", async ({ page }) => {
      // header inside main → fail; footer inside main → fail
      const headerInMain = page.locator("main header");
      const footerInMain = page.locator("main footer");
      await expect(headerInMain).toHaveCount(0);
      await expect(footerInMain).toHaveCount(0);
    });
  });
}
