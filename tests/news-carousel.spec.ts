import { test, expect } from "@playwright/test";

const EXPECTED_NEWS = [
  { title: "Beto Carreiro World", subtitle: "Parque temático — Penha, SC" },
  { title: "Rafting", subtitle: "Aventura em grupo" },
  { title: "Uruguai", subtitle: "Excursões internacionais" },
  { title: "Resort águas termais", subtitle: "Sul de Santa Catarina" },
  { title: "Brasília", subtitle: "Capital federal" },
];

test.describe("NewsCarousel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o título 'Destinos'", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Destinos" }),
    ).toBeVisible();
  });

  test("a seção tem fundo escuro (bg-dark)", async ({ page }) => {
    const section = page.locator("#novidades");
    await expect(section).toBeVisible();
    await expect(section).toHaveClass(/bg-dark/);
  });

  test("renderiza exatamente 5 slides de notícias", async ({ page }) => {
    const slides = page.locator(".news-swiper .swiper-slide");
    await expect(slides).toHaveCount(5);
  });

  for (const item of EXPECTED_NEWS) {
    test(`input: página carregada → output: card "${item.title}" no DOM`, async ({
      page,
    }) => {
      await expect(
        page.locator("#novidades").getByText(item.title),
      ).toBeVisible();
    });

    test(`input: página carregada → output: subtítulo "${item.subtitle}" visível`, async ({
      page,
    }) => {
      await expect(page.getByText(item.subtitle)).toBeVisible();
    });
  }

  test("exibe os botões de navegação prev e next", async ({ page }) => {
    await expect(page.locator(".news-prev")).toBeVisible();
    await expect(page.locator(".news-next")).toBeVisible();
  });

  test("input: clique em next → output: swiper avança (active slide muda)", async ({
    page,
  }) => {
    const getActiveIndex = () =>
      page.evaluate(() => {
        const el = document.querySelector(".news-swiper") as any;
        return el?.swiper?.activeIndex ?? -1;
      });

    const before = await getActiveIndex();
    await page.locator(".news-next").click();
    await page.waitForTimeout(400); // aguarda transição do Swiper
    const after = await getActiveIndex();
    expect(after).toBeGreaterThan(before);
  });

  test("input: clique em prev após next → output: swiper volta ao slide anterior", async ({
    page,
  }) => {
    const getActiveIndex = () =>
      page.evaluate(() => {
        const el = document.querySelector(".news-swiper") as any;
        return el?.swiper?.activeIndex ?? -1;
      });

    await page.locator(".news-next").click();
    await page.waitForTimeout(400);
    const afterNext = await getActiveIndex();

    await page.locator(".news-prev").click();
    await page.waitForTimeout(400);
    const afterPrev = await getActiveIndex();

    expect(afterPrev).toBeLessThan(afterNext);
  });
});
