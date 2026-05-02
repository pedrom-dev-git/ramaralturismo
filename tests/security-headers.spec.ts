import { test, expect } from "@playwright/test";

const PATHS = ["/", "/en/", "/es/"];

for (const path of PATHS) {
  test.describe(`Security headers — ${path}`, () => {
    test("Content-Security-Policy is set with strict default-src", async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const csp = response.headers()["content-security-policy"];
      expect(csp).toBeTruthy();
      expect(csp).toMatch(/default-src 'self'/);
      expect(csp).toMatch(/frame-ancestors 'none'/);
      expect(csp).toMatch(/object-src 'none'/);
      expect(csp).toMatch(/base-uri 'self'/);
      expect(csp).toMatch(/form-action 'self'/);
    });

    test("CSP allowlists Nominatim and Cloudflare Insights", async ({
      request,
    }) => {
      const response = await request.get(path);
      const csp = response.headers()["content-security-policy"];
      expect(csp).toBeTruthy();
      expect(csp).toMatch(/connect-src[^;]*nominatim\.openstreetmap\.org/);
      expect(csp).toMatch(/connect-src[^;]*cloudflareinsights\.com/);
      expect(csp).toMatch(/script-src[^;]*static\.cloudflareinsights\.com/);
    });

    test("X-Content-Type-Options is nosniff", async ({ request }) => {
      const response = await request.get(path);
      expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    });

    test("Referrer-Policy is strict-origin-when-cross-origin", async ({
      request,
    }) => {
      const response = await request.get(path);
      expect(response.headers()["referrer-policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    test("Permissions-Policy disables geolocation, microphone, camera", async ({
      request,
    }) => {
      const response = await request.get(path);
      const pp = response.headers()["permissions-policy"];
      expect(pp).toBeTruthy();
      expect(pp).toMatch(/geolocation=\(\)/);
      expect(pp).toMatch(/microphone=\(\)/);
      expect(pp).toMatch(/camera=\(\)/);
    });

    test("Strict-Transport-Security is set in production (Phase 1: max-age=300; includeSubDomains)", async ({
      request,
    }) => {
      const response = await request.get(path);
      const hsts = response.headers()["strict-transport-security"];
      expect(hsts).toBeTruthy();
      expect(hsts).toMatch(/max-age=300/);
      expect(hsts).toMatch(/includeSubDomains/);
      // Phase 1 should NOT include preload yet (Oficial parecer 2026-05-01)
      expect(hsts).not.toMatch(/preload/);
    });
  });
}
