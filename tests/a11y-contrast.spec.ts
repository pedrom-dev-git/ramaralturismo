/**
 * a11y contrast — WCAG 1.4.3 AA
 *
 * Covers two pairs identified in Sprint 5a baseline audit:
 *   1. text-primary (#0138AD) over bg-dark (#143E58) — NewsCarousel "DESTINOS" label
 *   2. text-white (#FFFFFF) over bg-green-700 (#15803d) — Hero WhatsApp CTA button
 *      (green-500 fails AA; green-700 is the fix target)
 *
 * Thresholds:
 *   - Small text (< 18pt / < 14pt bold): ratio >= 4.5
 *   - Large text (>= 18pt normal OR >= 14pt bold): ratio >= 3.0
 *   - UI components / graphical objects: ratio >= 3.0
 *
 * Test strategy:
 *   - page.evaluate reads computed color/background-color via getComputedStyle.
 *   - Tailwind 4 may return oklch() for some colors. We resolve to rgb via a
 *     temporary canvas pixel-read trick (draw computed color on canvas, read pixel).
 *   - WCAG relative luminance formula applied to resolved rgb values.
 */
import { test, expect } from "@playwright/test";

// ── WCAG helpers injected into browser context ────────────────────────────────

const wcagScript = `
function srgbToLinear(v) {
  v = v / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
function contrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Resolve any CSS color string (rgb, rgba, oklch, hsl, named, hex...) to [r, g, b].
 * Uses a 1x1 canvas to let the browser do the color parsing and conversion.
 */
function resolveColor(cssColor) {
  // Fast path: already rgb(r, g, b)
  const rgbMatch = cssColor.match(/^rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)$/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  // Canvas path: works for oklch, hsl, named colors, etc.
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    // alpha=0 means transparent / unsupported color
    if (a === 0) return null;
    return [r, g, b];
  } catch {
    return null;
  }
}
`;

// ── Test data ─────────────────────────────────────────────────────────────────

const LOCALES = [
  { path: "/",    label: "pt-BR" },
  { path: "/en/", label: "en"    },
  { path: "/es/", label: "es"    },
];

// ── Pair 1: NewsCarousel "DESTINOS" label — text-primary over bg-dark ─────────

for (const { path, label } of LOCALES) {
  test.describe(`[${label}] color-contrast — NewsCarousel DESTINOS label`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("Destinos heading contrast ratio >= 4.5 (WCAG AA small text)", async ({
      page,
    }) => {
      await expect(page.locator("#novidades")).toBeVisible();

      const ratio = await page.evaluate(
        ({ script }) => {
          // eslint-disable-next-line no-eval
          eval(script);
          // The <h2> "Destinos" heading inside the novidades section
          const fgEl = document.querySelector(
            "#novidades h2",
          ) as HTMLElement | null;
          const bgEl = document.querySelector("#novidades") as HTMLElement | null;
          if (!fgEl || !bgEl) return -1;
          // @ts-ignore — injected
          const fg = resolveColor(getComputedStyle(fgEl).color);
          // @ts-ignore
          const bg = resolveColor(getComputedStyle(bgEl).backgroundColor);
          if (!fg || !bg) return -1;
          // @ts-ignore
          return contrastRatio(relativeLuminance(...fg), relativeLuminance(...bg));
        },
        { script: wcagScript },
      );

      // Current broken state: #0138AD over #143E58 yields ~1.17 — RED
      // Target: text-white over bg-dark yields ~11.29 — GREEN
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
}

// ── Pair 2: Hero WhatsApp CTA — text-white over bg-green (must be >= 4.5) ────
//
// The button comment says "DEVE ser verde — NÃO alterar". Fix uses green-700
// (#15803d, ratio ~5.02 with white) to preserve brand identity while meeting AA.

for (const { path, label } of LOCALES) {
  test.describe(`[${label}] color-contrast — Hero WhatsApp CTA button`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path);
    });

    test("WhatsApp CTA button text contrast ratio >= 4.5 (WCAG AA small text)", async ({
      page,
    }) => {
      const btn = page.locator('#hero-form button[type="submit"]');
      await expect(btn).toBeVisible();

      const ratio = await page.evaluate(
        ({ script }) => {
          // eslint-disable-next-line no-eval
          eval(script);
          const btn = document.querySelector(
            '#hero-form button[type="submit"]',
          ) as HTMLElement | null;
          if (!btn) return -1;
          const style = getComputedStyle(btn);
          // @ts-ignore — injected
          const fg = resolveColor(style.color);
          // @ts-ignore
          const bg = resolveColor(style.backgroundColor);
          if (!fg || !bg) return -1;
          // @ts-ignore
          return contrastRatio(relativeLuminance(...fg), relativeLuminance(...bg));
        },
        { script: wcagScript },
      );

      // Current broken state: white over green-500 yields ~2.28 — RED
      // Target: white over green-700 yields ~5.02 — GREEN
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
}
