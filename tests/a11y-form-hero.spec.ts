/**
 * a11y-form-hero.spec.ts
 *
 * WCAG 3.3.2 + 4.1.2 — Hero form label association and semantics.
 *
 * RED: these assertions must FAIL before the GREEN implementation in Hero.astro.
 * GREEN commit: fix(turismo): GREEN — associate hero form labels and semantics per WCAG 3.3.2
 */
import { test, expect } from "@playwright/test";

const PAGES = ["/", "/en/", "/es/"];

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Clicks the label span next to a radio to select a tipo */
async function selectTipo(
  page: any,
  value: "turismo" | "escolar" | "corporativo",
) {
  await page.locator(`input[name='tipo'][value='${value}'] + span`).click();
}

// ── Tests scoped to each locale ───────────────────────────────────────────────

for (const path of PAGES) {
  test.describe(`a11y-form-hero — ${path}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    // ── Radios: fieldset + legend ─────────────────────────────────────────────

    test("tipo radios are wrapped in <fieldset>", async ({ page }) => {
      // The radiogroup div must be inside a fieldset element
      const fieldset = page.locator("#hero-form fieldset");
      await expect(fieldset).toHaveCount(1);
    });

    test("fieldset has a <legend> with text content", async ({ page }) => {
      const legend = page.locator("#hero-form fieldset legend");
      await expect(legend).toHaveCount(1);
      const text = await legend.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    });

    // ── Hidden date inputs: aria-hidden ───────────────────────────────────────

    test("plumbing date input #data-ini has aria-hidden='true'", async ({
      page,
    }) => {
      await expect(page.locator("#data-ini")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    test("plumbing date input #data-fim has aria-hidden='true'", async ({
      page,
    }) => {
      await expect(page.locator("#data-fim")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    // ── Display date inputs: already have <label for>, check aria-required ────

    test("data-ini-display has aria-required='true'", async ({ page }) => {
      await expect(page.locator("#data-ini-display")).toHaveAttribute(
        "aria-required",
        "true",
      );
    });

    test("data-fim-display has aria-required='true'", async ({ page }) => {
      await expect(page.locator("#data-fim-display")).toHaveAttribute(
        "aria-required",
        "true",
      );
    });

    // ── Visible text inputs: label association ────────────────────────────────

    test("origem-input has an associated <label> via for attribute", async ({
      page,
    }) => {
      const label = page.locator("label[for='origem-input']");
      await expect(label).toHaveCount(1);
    });

    test("destino-input has an associated <label> via for attribute", async ({
      page,
    }) => {
      const label = page.locator("label[for='destino-input']");
      await expect(label).toHaveCount(1);
    });

    // ── Corporativo: quantidade label ─────────────────────────────────────────

    test("quantidade-input has an associated <label> via for attribute", async ({
      page,
    }) => {
      // Input is hidden until corporativo is selected, but label must exist in DOM
      const label = page.locator("label[for='quantidade-input']");
      await expect(label).toHaveCount(1);
    });

    // ── Escolar: escola-select label ──────────────────────────────────────────

    test("escola-select has an associated <label> via for attribute", async ({
      page,
    }) => {
      const label = page.locator("label[for='escola-select']");
      await expect(label).toHaveCount(1);
    });

    // ── AX snapshot: all named controls in turismo mode (default) ────────────

    test("all visible form controls have an accessible name (turismo default)", async ({
      page,
    }) => {
      // Collect all interactive, non-hidden inputs within the hero form
      const controls = await page.locator("#hero-form").evaluate((form: HTMLFormElement) => {
        const interactiveSelector = "input:not([type='hidden']):not([aria-hidden='true']):not([tabindex='-1']), select, textarea, button[type='submit']";
        const nodes = Array.from(form.querySelectorAll(interactiveSelector));
        return nodes.map((el: Element) => {
          const input = el as HTMLInputElement;
          // Collect potential label sources
          const labelEl = input.id
            ? form.querySelector(`label[for='${input.id}']`)
            : null;
          const ariaLabel = input.getAttribute("aria-label");
          const ariaLabelledBy = input.getAttribute("aria-labelledby");
          const ariaHidden = input.getAttribute("aria-hidden");
          const tabindex = input.getAttribute("tabindex");
          return {
            tag: input.tagName,
            id: input.id || null,
            name: input.getAttribute("name") || null,
            type: input.getAttribute("type") || null,
            hasLabel: !!labelEl,
            hasAriaLabel: !!ariaLabel,
            hasAriaLabelledBy: !!ariaLabelledBy,
            ariaHidden,
            tabindex,
          };
        });
      });

      for (const ctrl of controls) {
        const isNamed = ctrl.hasLabel || ctrl.hasAriaLabel || ctrl.hasAriaLabelledBy;
        expect(
          isNamed,
          `Control ${ctrl.tag}#${ctrl.id ?? ctrl.name} must have an accessible name`,
        ).toBe(true);
      }
    });

    // ── Escolar mode: escola-select accessible name ───────────────────────────

    test("escola-select is accessible in escolar mode", async ({ page }) => {
      await selectTipo(page, "escolar");
      // Label must exist in DOM even while wrapper was hidden initially
      const label = page.locator("label[for='escola-select']");
      await expect(label).toHaveCount(1);
    });

    // ── Corporativo mode: quantidade accessible name ──────────────────────────

    test("quantidade-input is accessible in corporativo mode", async ({
      page,
    }) => {
      await selectTipo(page, "corporativo");
      const label = page.locator("label[for='quantidade-input']");
      await expect(label).toHaveCount(1);
      const ctrl = page.locator("#quantidade-input");
      await expect(ctrl).toBeVisible();
    });
  });
}
