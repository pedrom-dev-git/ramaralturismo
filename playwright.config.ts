import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      // Default project: dev server without analytics token.
      // Covers all specs EXCEPT the "with token" beacon scenario.
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grep: /^(?!.*with token).*/,
    },
    {
      // analytics-beacon project: dev server WITH token on :4322.
      // Only runs specs that contain "with token" in their description.
      name: "analytics-beacon",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:4322",
      },
      grep: /with token/,
    },
  ],
  webServer: [
    {
      // Server 1: no token — used by project "chromium"
      command: "pnpm dev --port 4321",
      url: "http://localhost:4321",
      reuseExistingServer: !process.env.CI,
    },
    {
      // Server 2: with token — used by project "analytics-beacon"
      // PUBLIC_ prefix makes it available in import.meta.env (Astro/Vite).
      // Fix: env must be inlined in the shell command string because the
      // Playwright webServer `env` block does not propagate through the pnpm
      // wrapper to the astro/vite child process. Confirmed 2026-04-18:
      // prefixing in the shell delivers the token; webServer.env alone does not.
      command:
        "PUBLIC_CF_ANALYTICS_TOKEN=test-token-ci pnpm dev --port 4322",
      url: "http://localhost:4322",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
