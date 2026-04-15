import { test, expect } from "@playwright/test";

test.describe("WhatsAppButton (flutuante)", () => {
  test("botão flutuante foi removido da página", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Fale conosco no WhatsApp" })).not.toBeAttached();
  });
});
