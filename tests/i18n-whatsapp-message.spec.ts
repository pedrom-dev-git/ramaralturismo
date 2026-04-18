import { test, expect } from "@playwright/test";

// Helper: fill turismo form, intercept window.open, capture wa.me URL text param
async function getWhatsappText(
  page: import("@playwright/test").Page,
  url: string,
): Promise<string> {
  let capturedUrl: string | null = null;

  await page.exposeFunction("__recordOpenedUrl", (u: string) => {
    capturedUrl = u;
  });

  await page.goto(url);
  await page.waitForLoadState("networkidle");

  // Patch window.open AFTER Astro scripts initialise (networkidle)
  await page.evaluate(() => {
    window.open = (u?: string | URL | null, ..._args: any[]) => {
      if (u) (window as any).__recordOpenedUrl(u.toString());
      return null;
    };
  });

  // Fill turismo form (default tab = turismo — needs dates)
  await page.locator("#origem-input").fill("São Paulo");
  await page.locator("#destino-input").waitFor({ state: "visible" });
  await page.locator("#destino-input").fill("Florianópolis");

  // Set hidden date inputs (required for turismo)
  await page.locator("#data-ini").evaluate((el: HTMLInputElement) => {
    el.value = "2026-05-01";
    el.dispatchEvent(new Event("change"));
  });
  await page.locator("#data-fim").evaluate((el: HTMLInputElement) => {
    el.value = "2026-05-05";
    el.dispatchEvent(new Event("change"));
  });

  // Submit
  await page.locator("#hero-form button[type='submit']").click();
  await page.waitForTimeout(150);

  expect(
    capturedUrl,
    "window.open should have been called with a wa.me URL",
  ).not.toBeNull();

  const u = new URL(capturedUrl!);
  return u.searchParams.get("text") ?? "";
}

test.describe("i18n WhatsApp message — locale-aware submit", () => {
  test("en: WhatsApp message contains English greeting, not Portuguese", async ({
    page,
  }) => {
    const text = await getWhatsappText(page, "/en/");

    expect(text).toMatch(/Hello!/i);
    expect(text).not.toMatch(/Olá/);
    expect(text).not.toMatch(/Gostaria/);
    expect(text).toContain("São Paulo");
    expect(text).toContain("Florianópolis");
  });

  test("es: WhatsApp message contains Spanish greeting, not Portuguese", async ({
    page,
  }) => {
    const text = await getWhatsappText(page, "/es/");

    expect(text).toMatch(/¡Hola!/);
    expect(text).not.toMatch(/Olá/);
    expect(text).not.toMatch(/Gostaria/);
    expect(text).toContain("São Paulo");
    expect(text).toContain("Florianópolis");
  });

  test("pt-BR: WhatsApp message contains Portuguese greeting", async ({
    page,
  }) => {
    const text = await getWhatsappText(page, "/");

    expect(text).toMatch(/Olá/);
    expect(text).toContain("São Paulo");
    expect(text).toContain("Florianópolis");
  });
});
