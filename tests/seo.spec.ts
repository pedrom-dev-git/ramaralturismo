import { test, expect } from "@playwright/test";

const LOCALES = [
  { path: "/", label: "pt-BR", ogLocale: "pt_BR" },
  { path: "/en/", label: "en", ogLocale: "en_US" },
  { path: "/es/", label: "es", ogLocale: "es_ES" },
];

for (const locale of LOCALES) {
  test.describe(`SEO meta tags — ${locale.label} (${locale.path})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(locale.path);
    });

    test("has og:locale with correct value", async ({ page }) => {
      const ogLocaleEl = page.locator('meta[property="og:locale"]');
      await expect(ogLocaleEl).toHaveCount(1);
      await expect(ogLocaleEl).toHaveAttribute("content", locale.ogLocale);
    });

    test("has og:locale:alternate for the other 2 locales", async ({
      page,
    }) => {
      const alternates = page.locator('meta[property="og:locale:alternate"]');
      await expect(alternates).toHaveCount(2);
    });

    test("has og:title that matches <title> and is not empty/placeholder", async ({
      page,
    }) => {
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(5);
      expect(pageTitle).toMatch(/R\. Amaral/i);

      const ogTitleContent = await page
        .locator('meta[property="og:title"]')
        .getAttribute("content");
      expect(ogTitleContent).not.toBeNull();
      expect(ogTitleContent!.length).toBeGreaterThan(5);
      // og:title must match or be closely related to <title>
      expect(ogTitleContent).toMatch(/R\. Amaral/i);
    });

    test("has og:description that is non-empty and not generic placeholder", async ({
      page,
    }) => {
      const ogDesc = await page
        .locator('meta[property="og:description"]')
        .getAttribute("content");
      expect(ogDesc).not.toBeNull();
      expect(ogDesc!.length).toBeGreaterThan(10);
      // Must not be a bare placeholder like "description" or empty
      expect(ogDesc).not.toMatch(/^description$/i);
      // Must contain something meaningful about transport/turismo
      expect(ogDesc).toMatch(/transport|turismo|travel|viag|traslado/i);
    });

    test("has og:url meta tag pointing to current URL", async ({ page }) => {
      const ogUrl = page.locator('meta[property="og:url"]');
      await expect(ogUrl).toHaveCount(1);
      const content = await ogUrl.getAttribute("content");
      // In dev, Astro.url.href resolves to localhost; in prod, to ramaralturismo.job-3eb.workers.dev.
      // We validate it is an absolute URL containing the locale path.
      expect(content).toMatch(/^https?:\/\//);
      expect(content).toContain(locale.path);
    });

    test("has og:image meta tag with absolute URL", async ({ page }) => {
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveCount(1);
      const content = await ogImage.getAttribute("content");
      expect(content).toMatch(/^https?:\/\//);
    });

    test("has canonical link pointing to current URL", async ({ page }) => {
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = await canonical.getAttribute("href");
      // In dev, Astro.url.href resolves to localhost; in prod, to ramaralturismo.job-3eb.workers.dev.
      // We validate it is an absolute URL containing the locale path.
      expect(href).toMatch(/^https?:\/\//);
      expect(href).toContain(locale.path);
    });

    test("has twitter:card meta tag", async ({ page }) => {
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        "content",
        "summary_large_image",
      );
    });

    test("has twitter:image meta tag with absolute URL", async ({ page }) => {
      const twitterImage = page.locator('meta[name="twitter:image"]');
      await expect(twitterImage).toHaveCount(1);
      const content = await twitterImage.getAttribute("content");
      expect(content).toMatch(/^https?:\/\//);
    });

    test("has LocalBusiness JSON-LD schema", async ({ page }) => {
      const ldJson = page.locator('script[type="application/ld+json"]');
      await expect(ldJson).toHaveCount(1);
      const content = await ldJson.textContent();
      expect(content).toBeTruthy();
      const schema = JSON.parse(content!);
      expect(schema["@type"]).toBe("LocalBusiness");
      expect(schema["name"]).toBe("R. Amaral Turismo");
      expect(schema["telephone"]).toBe("+55 48 99950-3368");
      expect(schema["address"]["addressLocality"]).toBe("Tijucas");
      expect(schema["address"]["addressRegion"]).toBe("SC");
      expect(schema["url"]).toBe("https://ramaralturismo.job-3eb.workers.dev");
    });
  });
}

test.describe("robots.txt", () => {
  test("returns 200", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("contains User-agent and Allow directives", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    const body = await response?.text();
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
  });

  test("contains Sitemap directive pointing to ramaralturismo.job-3eb.workers.dev", async ({
    page,
  }) => {
    const response = await page.goto("/robots.txt");
    const body = await response?.text();
    expect(body).toContain("Sitemap:");
    expect(body).toContain("ramaralturismo.job-3eb.workers.dev");
  });
});

test.describe("sitemap.xml", () => {
  test("returns 200 with XML content-type", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toContain("xml");
  });

  test("is valid XML with urlset root element", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = await response?.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("</urlset>");
  });

  test("contains at least 3 url entries", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = await response?.text();
    const matches = body?.match(/<url>/g);
    expect(matches?.length).toBeGreaterThanOrEqual(3);
  });

  test("contains hreflang alternate links", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    const body = await response?.text();
    expect(body).toContain("hreflang");
    expect(body).toContain("pt-BR");
    expect(body).toContain("ramaralturismo.job-3eb.workers.dev/en/");
    expect(body).toContain("ramaralturismo.job-3eb.workers.dev/es/");
  });
});
