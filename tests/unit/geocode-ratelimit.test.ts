/**
 * Unit test (node:test) — RED
 *
 * Asserts that GET /api/geocode returns 429 with Retry-After: 60
 * when the Cloudflare Rate Limiter binding reports success: false.
 *
 * RED rationale: the current handler only destructures { request } from
 * APIContext and never consults locals.runtime.env.GEOCODE_RATE_LIMITER.
 * Therefore it will proceed to the Nominatim fetch path and return 200,
 * NOT the expected 429. This test will fail until B3 wires the binding.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// Stub globalThis.fetch so the handler never hits the real Nominatim
// upstream. Without this, the handler would perform a live network call
// and return 200, which would mask the RED nature of the test with noise.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_input: RequestInfo | URL, _init?: RequestInit) => {
  return new Response(
    JSON.stringify([
      { display_name: "Canoas, Rio Grande do Sul, Brasil" },
    ]),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
};

// Dynamic import placed after fetch stub to ensure the module resolves
// in an environment where fetch is already overridden.
const { GET } = await import("../../src/pages/api/geocode.ts");

// Restore fetch after import to keep the environment tidy.
globalThis.fetch = originalFetch;

test("GET /api/geocode returns 429 when rate limiter denies the request", async () => {
  const fakeContext = {
    request: new Request("https://ramaral.tur.br/api/geocode?q=Canoas"),
    locals: {
      runtime: {
        env: {
          GEOCODE_RATE_LIMITER: {
            limit: async ({ key }: { key: string }) => {
              // Simulates the binding exhausting the quota for this IP.
              void key;
              return { success: false };
            },
          },
        },
      },
    },
  } as Parameters<typeof GET>[0];

  // Stub fetch for the actual call so the handler does not hit the network.
  globalThis.fetch = async (_input: RequestInfo | URL, _init?: RequestInit) => {
    return new Response(
      JSON.stringify([{ display_name: "Canoas, Rio Grande do Sul, Brasil" }]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const response = await GET(fakeContext);

  // Restore fetch.
  globalThis.fetch = originalFetch;

  // RED: handler currently ignores locals — will return 200, not 429.
  assert.strictEqual(
    response.status,
    429,
    `Expected 429 Too Many Requests but got ${response.status}. ` +
      "Handler must read locals.runtime.env.GEOCODE_RATE_LIMITER (B3).",
  );

  assert.strictEqual(
    response.headers.get("Retry-After"),
    "60",
    `Expected Retry-After: 60 but got "${response.headers.get("Retry-After")}".`,
  );
});
