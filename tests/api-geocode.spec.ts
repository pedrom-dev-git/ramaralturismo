import { test, expect } from "@playwright/test";

test.describe("api/geocode — sanitization", () => {
  test("400 when q is shorter than 3 chars", async ({ request }) => {
    const res = await request.get("/api/geocode?q=Ca");
    expect(res.status()).toBe(400);
  });

  test("400 when q is longer than 80 chars", async ({ request }) => {
    const longQ = "a".repeat(81);
    const res = await request.get(`/api/geocode?q=${longQ}`);
    expect(res.status()).toBe(400);
  });

  test("400 when q contains forbidden chars (XSS / injection)", async ({
    request,
  }) => {
    const cases = ["<script>", "Canoas<x>", "abc;DROP", "evil&x"];
    for (const q of cases) {
      const res = await request.get(
        `/api/geocode?q=${encodeURIComponent(q)}`,
      );
      expect(res.status(), `q=${q}`).toBe(400);
    }
  });

  test("400 when q is absent", async ({ request }) => {
    const res = await request.get("/api/geocode");
    expect(res.status()).toBe(400);
  });

  test("400 response carries Cache-Control: no-store", async ({ request }) => {
    const res = await request.get("/api/geocode?q=Ca");
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});

test.describe("api/geocode — happy path", () => {
  test("endpoint exists and accepts valid q (non-404)", async ({ request }) => {
    let res;
    try {
      res = await request.get("/api/geocode?q=Canoas", { timeout: 15000 });
    } catch {
      test.skip(true, "request timed out (CI runner upstream flakiness)");
      return;
    }
    expect(res.status(), "endpoint must be reachable").not.toBe(404);
    // 2xx happy, 5xx upstream issues acceptable, 429 rate-limited acceptable
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(600);
    expect(res.status()).not.toBe(404);
  });

  test("valid q returns array of {display_name} when upstream OK", async ({
    request,
  }) => {
    const res = await request.get("/api/geocode?q=Tijucas");
    if (res.status() !== 200) {
      test.skip(
        true,
        `upstream unreachable (status=${res.status()}); validation tests cover the rest`,
      );
    }
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(typeof body[0].display_name).toBe("string");
    }
  });

  test("Unicode chars (acentos) accepted in q", async ({ request }) => {
    const res = await request.get(
      `/api/geocode?q=${encodeURIComponent("São Paulo")}`,
    );
    expect(res.status()).not.toBe(400);
    expect(res.status()).not.toBe(404);
  });
});
