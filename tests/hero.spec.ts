import { test, expect } from "@playwright/test";

const WHATSAPP_NUMBER = "5548999503368";

/** Clica no radio pill do tipo de serviço */
async function selectTipo(page: any, value: "turismo" | "escolar" | "corporativo") {
  await page.locator(`input[name='tipo'][value='${value}'] + span`).click();
}

test.describe("Hero", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  // ---------- Renderização ----------

  test("exibe o link de telefone/WhatsApp com número correto", async ({ page }) => {
    const hero = page.locator("section").first();
    const phoneLink = hero.getByRole("link", { name: /999503368/ });
    await expect(phoneLink).toBeVisible();
    await expect(phoneLink).toHaveAttribute("href", `https://wa.me/${WHATSAPP_NUMBER}`);
  });

  test("exibe o headline principal", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Sua Jornada Começa Aqui!" })).toBeVisible();
  });

  test("exibe o subtítulo descritivo", async ({ page }) => {
    const hero = page.locator("section").first();
    await expect(
      hero.getByText("Atendimento personalizado para transporte escolar e viagens em grupo.")
    ).toBeVisible();
  });

  test("exibe os campos do formulário de orçamento", async ({ page }) => {
    const form = page.locator("#hero-form");
    await expect(form.locator("#tipo-toggle")).toBeVisible();
    await expect(form.locator("input[name='origem']")).toBeVisible();
    await expect(form.locator("input[name='destino']")).toBeVisible();
    await expect(form.getByRole("button", { name: /orçamento/i })).toBeVisible();
  });

  test("toggle de tipo de serviço contém as duas opções", async ({ page }) => {
    await expect(page.locator("input[name='tipo'][value='turismo']")).toBeAttached();
    await expect(page.locator("input[name='tipo'][value='escolar']")).toBeAttached();
  });

  // ---------- Toggle pills ----------

  test("turismo é o default selecionado", async ({ page }) => {
    await expect(page.locator("input[name='tipo'][value='turismo']")).toBeChecked();
    await expect(page.locator("input[name='tipo'][value='escolar']")).not.toBeChecked();
  });

  test("pill ativo tem estilo destacado (bg-primary)", async ({ page }) => {
    const turismoSpan = page.locator("input[name='tipo'][value='turismo'] + span");
    await expect(turismoSpan).toHaveClass(/bg-primary/);
    await expect(turismoSpan).toHaveClass(/text-white/);
  });

  test("ao clicar em escolar, pill escolar fica ativo", async ({ page }) => {
    await selectTipo(page, "escolar");
    const escolarSpan = page.locator("input[name='tipo'][value='escolar'] + span");
    const turismoSpan = page.locator("input[name='tipo'][value='turismo'] + span");
    await expect(escolarSpan).toHaveClass(/bg-primary/);
    await expect(turismoSpan).toHaveClass(/bg-white/);
  });

  // ---------- Campos obrigatórios ----------

  test("origem e destino têm atributo required no modo turismo (default)", async ({ page }) => {
    await expect(page.locator("input[name='origem']")).toHaveAttribute("required", "");
    await expect(page.locator("input[name='destino']")).toHaveAttribute("required", "");
  });

  test("campos de data estão required no modo turismo (default)", async ({ page }) => {
    await expect(page.locator("#data-ini")).toHaveAttribute("required", "");
    await expect(page.locator("#data-fim")).toHaveAttribute("required", "");
  });

  test("campos de data perdem required ao trocar para escolar", async ({ page }) => {
    await selectTipo(page, "escolar");
    const iniReq = await page.locator("#data-ini").getAttribute("required");
    const fimReq = await page.locator("#data-fim").getAttribute("required");
    expect(iniReq).toBeNull();
    expect(fimReq).toBeNull();
  });

  // ---------- Campos de Data ----------

  test("wrappers de data estão visíveis no estado inicial (turismo default)", async ({ page }) => {
    await expect(page.locator("#data-ini-wrapper")).toBeVisible();
    await expect(page.locator("#data-fim-wrapper")).toBeVisible();
    await expect(page.locator("label[for='data-ini-display']")).toHaveText("Data de ida");
    await expect(page.locator("label[for='data-fim-display']")).toHaveText("Data de volta");
    // Displays mostram placeholder DD/MM/AAAA
    await expect(page.locator("#data-ini-display")).toHaveAttribute("placeholder", "DD/MM/AAAA");
    await expect(page.locator("#data-fim-display")).toHaveAttribute("placeholder", "DD/MM/AAAA");
  });

  test("data selecionada aparece formatada em DD/MM/AAAA no display", async ({ page }) => {
    // Simular seleção de data no date picker oculto
    await page.fill("#data-ini", "2026-04-10");
    await page.dispatchEvent("#data-ini", "change");
    await expect(page.locator("#data-ini-display")).toHaveValue("10/04/2026");

    await page.fill("#data-fim", "2026-04-15");
    await page.dispatchEvent("#data-fim", "change");
    await expect(page.locator("#data-fim-display")).toHaveValue("15/04/2026");
  });

  test("clicar no display de data aciona showPicker no input oculto", async ({ page }) => {
    // Verificar que o display é clicável e o input hidden existe
    const display = page.locator("#data-ini-display");
    const hidden = page.locator("#data-ini");
    await expect(display).toBeVisible();
    await expect(display).toHaveAttribute("readonly", "");
    await expect(hidden).toBeAttached();

    // Verificar que o click handler está registrado (showPicker é chamado)
    const pickerCalled = await page.evaluate(() => {
      let called = false;
      const el = document.getElementById("data-ini");
      const original = el.showPicker;
      el.showPicker = function() { called = true; };
      document.getElementById("data-ini-display").click();
      el.showPicker = original;
      return called;
    });
    expect(pickerCalled).toBe(true);
  });

  test("displays de data ficam limpos ao trocar para escolar e voltar", async ({ page }) => {
    // Preencher datas
    await page.fill("#data-ini", "2026-05-01");
    await page.dispatchEvent("#data-ini", "change");
    await expect(page.locator("#data-ini-display")).toHaveValue("01/05/2026");

    // Trocar para escolar limpa tudo
    await selectTipo(page, "escolar");
    await expect(page.locator("#data-ini-display")).toHaveValue("");

    // Voltar para turismo, displays estão vazios
    await selectTipo(page, "turismo");
    await expect(page.locator("#data-ini-display")).toHaveValue("");
    await expect(page.locator("#data-fim-display")).toHaveValue("");
  });

  test("wrappers de data somem ao trocar para escolar", async ({ page }) => {
    await selectTipo(page, "escolar");
    await expect(page.locator("#data-ini-wrapper")).toBeHidden();
    await expect(page.locator("#data-fim-wrapper")).toBeHidden();
  });

  test("wrappers de data reaparecem ao voltar para turismo", async ({ page }) => {
    await selectTipo(page, "escolar");
    await selectTipo(page, "turismo");
    await expect(page.locator("#data-ini-wrapper")).toBeVisible();
    await expect(page.locator("#data-fim-wrapper")).toBeVisible();
  });

  // ---------- Placeholders dinâmicos ----------

  test("placeholders no modo turismo são 'Cidade de partida' e 'Destino turístico'", async ({ page }) => {
    await expect(page.locator("input[name='origem']")).toHaveAttribute("placeholder", "Cidade de partida");
    await expect(page.locator("input[name='destino']")).toHaveAttribute("placeholder", "Destino turístico");
  });

  test("placeholder de origem no modo escolar é 'Origem'", async ({ page }) => {
    await selectTipo(page, "escolar");
    await expect(page.locator("input[name='origem']")).toHaveAttribute("placeholder", "Origem");
  });

  // ---------- Dropdowns no DOM ----------

  test("#origem-dropdown e #destino-dropdown existem no DOM", async ({ page }) => {
    await expect(page.locator("#origem-dropdown")).toBeAttached();
    await expect(page.locator("#destino-dropdown")).toBeAttached();
  });

  // ---------- Autocomplete (fetch mockado) ----------

  test("dropdown de origem aparece ao digitar 3+ chars no modo turismo", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Florianópolis, Santa Catarina, Brasil" },
          { display_name: "Floresta, Paraná, Brasil" },
        ]),
      });
    });

    await page.fill("input[name='origem']", "Flo");
    await page.waitForTimeout(500);
    await expect(page.locator("#origem-dropdown")).toBeVisible();
    await expect(page.locator("#origem-dropdown button").first()).toContainText("Florianópolis");
  });

  test("clicar fora fecha o dropdown", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ display_name: "Curitiba, Paraná, Brasil" }]),
      });
    });

    await page.fill("input[name='origem']", "Cur");
    await page.waitForTimeout(500);
    await expect(page.locator("#origem-dropdown")).toBeVisible();

    await page.getByRole("heading", { name: "Sua Jornada Começa Aqui!" }).click();
    await page.waitForTimeout(200);
    await expect(page.locator("#origem-dropdown")).toBeHidden();
  });

  // ---------- Submit → WhatsApp ----------

  test("formulário turismo preenchido → URL WhatsApp com dados e datas corretos", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedUrl = null;
      window.open = (url: string) => {
        (window as any).__capturedUrl = url;
        return null;
      };
    });

    await page.fill("input[name='origem']", "Curitiba");
    await page.fill("input[name='destino']", "Florianópolis");
    await page.fill("#data-ini", "2026-04-10");
    await page.dispatchEvent("#data-ini", "change");
    await page.fill("#data-fim", "2026-04-15");
    await page.dispatchEvent("#data-fim", "change");
    await page.locator("#hero-form button[type='submit']").click();

    const url = await page.evaluate(() => (window as any).__capturedUrl as string);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("wa.me/5548999503368");
    expect(decoded).toContain("Turismo e Viagens");
    expect(decoded).toContain("Curitiba");
    expect(decoded).toContain("Florianópolis");
    expect(decoded).toContain("10/04/2026");
    expect(decoded).toContain("15/04/2026");
  });

  test("serviço escolar → mensagem inclui escola selecionada sem campos de data", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedUrl = null;
      window.open = (url: string) => { (window as any).__capturedUrl = url; return null; };
    });

    await selectTipo(page, "escolar");
    await page.fill("input[name='origem']", "São Paulo");
    await page.selectOption("select[name='escola']", "Escola Planeta");
    await page.locator("#hero-form button[type='submit']").click();

    const url = await page.evaluate(() => (window as any).__capturedUrl as string);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("Transporte Escolar");
    expect(decoded).toContain("São Paulo");
    expect(decoded).toContain("Escola Planeta");
    expect(decoded).not.toContain("Data de ida");
  });

  // ---------- Dropdown de Escolas ----------

  test("dropdown de escolas está oculto no estado inicial (turismo default)", async ({ page }) => {
    await expect(page.locator("#escola-wrapper")).toBeHidden();
  });

  test("dropdown de escolas aparece ao selecionar escolar e destino texto some", async ({ page }) => {
    await selectTipo(page, "escolar");
    await expect(page.locator("#escola-wrapper")).toBeVisible();
    await expect(page.locator("#destino-text-wrapper")).toBeHidden();
  });

  test("dropdown de escolas some ao trocar para turismo", async ({ page }) => {
    await selectTipo(page, "escolar");
    await selectTipo(page, "turismo");
    await expect(page.locator("#escola-wrapper")).toBeHidden();
    await expect(page.locator("#destino-text-wrapper")).toBeVisible();
  });

  test("dropdown de escolas contém todas as 7 escolas", async ({ page }) => {
    await selectTipo(page, "escolar");
    const options = page.locator("#escola-select option:not([value=''])");
    await expect(options).toHaveCount(7);
    await expect(options.nth(0)).toHaveText("Escola Planeta");
    await expect(options.nth(1)).toHaveText("Premium Brilho do Sol");
    await expect(options.nth(2)).toHaveText("Alexandre Termes");
    await expect(options.nth(3)).toHaveText("Cruz e Souza");
    await expect(options.nth(4)).toHaveText("COC (Porto Belo)");
    await expect(options.nth(5)).toHaveText("Bom Jesus (Porto Belo)");
    await expect(options.nth(6)).toHaveText("COC (Balneário Camboriú)");
  });

  // ---------- Autocomplete por modo ----------

  test("autocomplete funciona no destino do modo turismo (default)", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Gramado, Rio Grande do Sul, Brasil" },
        ]),
      });
    });

    await page.fill("input[name='destino']", "Gra");
    await page.waitForTimeout(500);
    await expect(page.locator("#destino-dropdown")).toBeVisible();
    await expect(page.locator("#destino-dropdown button").first()).toContainText("Gramado");
  });

  test("autocomplete funciona na origem do modo escolar", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Itajaí, Santa Catarina, Brasil" },
        ]),
      });
    });

    await selectTipo(page, "escolar");
    await page.fill("input[name='origem']", "Ita");
    await page.waitForTimeout(500);
    await expect(page.locator("#origem-dropdown")).toBeVisible();
    await expect(page.locator("#origem-dropdown button").first()).toContainText("Itajaí");
  });

  test("autocomplete desativa no destino ao trocar para escolar", async ({ page }) => {
    await selectTipo(page, "escolar");
    // destino-text-wrapper está hidden, dropdown não deve abrir
    await expect(page.locator("#destino-text-wrapper")).toBeHidden();
  });

  test("toggle de tipo de serviço contém a opção corporativo", async ({ page }) => {
    await expect(page.locator("input[name='tipo'][value='corporativo']")).toBeAttached();
    await expect(page.locator("input[name='tipo'][value='corporativo'] + span")).toContainText("Corporativo");
  });

  test("autocomplete reativa na origem e destino ao voltar para turismo", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Balneário Camboriú, Santa Catarina, Brasil" },
        ]),
      });
    });

    await selectTipo(page, "escolar");
    await selectTipo(page, "turismo");
    await page.fill("input[name='destino']", "Bal");
    await page.waitForTimeout(500);
    await expect(page.locator("#destino-dropdown")).toBeVisible();
    await expect(page.locator("#destino-dropdown button").first()).toContainText("Balneário Camboriú");
  });
});

test.describe("Corporativo tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await selectTipo(page, "corporativo");
  });

  test("pill corporativo fica ativo ao selecionar", async ({ page }) => {
    const span = page.locator("input[name='tipo'][value='corporativo'] + span");
    await expect(span).toHaveClass(/bg-primary/);
    await expect(span).toHaveClass(/text-white/);
    const turismoSpan = page.locator("input[name='tipo'][value='turismo'] + span");
    await expect(turismoSpan).toHaveClass(/bg-white/);
  });

  test("campo quantidade aparece e datas + escola ficam ocultos", async ({ page }) => {
    await expect(page.locator("#quantidade-wrapper")).toBeVisible();
    await expect(page.locator("#data-ini-wrapper")).toBeHidden();
    await expect(page.locator("#data-fim-wrapper")).toBeHidden();
    await expect(page.locator("#escola-wrapper")).toBeHidden();
  });

  test("campo destino texto aparece no modo corporativo", async ({ page }) => {
    await expect(page.locator("#destino-text-wrapper")).toBeVisible();
  });

  test("quantidade é required em corporativo, não em turismo nem escolar", async ({ page }) => {
    await expect(page.locator("#quantidade-input")).toHaveAttribute("required", "");

    await selectTipo(page, "turismo");
    const reqTurismo = await page.locator("#quantidade-input").getAttribute("required");
    expect(reqTurismo).toBeNull();

    await selectTipo(page, "escolar");
    const reqEscolar = await page.locator("#quantidade-input").getAttribute("required");
    expect(reqEscolar).toBeNull();
  });

  test("datas não são required em corporativo", async ({ page }) => {
    const iniReq = await page.locator("#data-ini").getAttribute("required");
    const fimReq = await page.locator("#data-fim").getAttribute("required");
    expect(iniReq).toBeNull();
    expect(fimReq).toBeNull();
  });

  test("autocomplete de origem funciona em corporativo", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "São Paulo, São Paulo, Brasil" },
        ]),
      });
    });

    await page.fill("input[name='origem']", "São");
    await page.waitForTimeout(500);
    await expect(page.locator("#origem-dropdown")).toBeVisible();
    await expect(page.locator("#origem-dropdown button").first()).toContainText("São Paulo");
  });

  test("autocomplete de destino funciona em corporativo", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Rio de Janeiro, Rio de Janeiro, Brasil" },
        ]),
      });
    });

    await page.fill("input[name='destino']", "Rio");
    await page.waitForTimeout(500);
    await expect(page.locator("#destino-dropdown")).toBeVisible();
    await expect(page.locator("#destino-dropdown button").first()).toContainText("Rio de Janeiro");
  });

  test("submit corporativo gera URL WhatsApp com origem, destino e passageiros", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedUrl = null;
      window.open = (url: string) => { (window as any).__capturedUrl = url; return null; };
    });

    await page.fill("input[name='origem']", "São Paulo");
    await page.fill("input[name='destino']", "Rio de Janeiro");
    await page.fill("#quantidade-input", "30");
    await page.locator("#hero-form button[type='submit']").click();

    const url = await page.evaluate(() => (window as any).__capturedUrl as string);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("wa.me/5548999503368");
    expect(decoded).toContain("São Paulo");
    expect(decoded).toContain("Rio de Janeiro");
    expect(decoded).toContain("30");
    expect(decoded).not.toContain("Data de ida");
  });

  test("trocar de corporativo para turismo limpa quantidade e remove required", async ({ page }) => {
    await page.fill("#quantidade-input", "15");
    await selectTipo(page, "turismo");

    await expect(page.locator("#quantidade-wrapper")).toBeHidden();
    const req = await page.locator("#quantidade-input").getAttribute("required");
    expect(req).toBeNull();
    await expect(page.locator("#quantidade-input")).toHaveValue("");
  });
});

test.describe("Hero mobile (375x812)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("sem overflow horizontal", async ({ page }) => {
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth;
    });
    expect(overflow).toBe(true);
  });

  test("card do formulário cabe no viewport de 375px", async ({ page }) => {
    const card = page.locator(".bg-white.rounded-2xl.shadow-xl");
    const box = await card.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test("3 pills visíveis e com tamanho mínimo de toque", async ({ page }) => {
    const pills = page.locator("#tipo-toggle label span");
    await expect(pills).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const box = await pills.nth(i).boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(60);
      expect(box!.height).toBeGreaterThanOrEqual(36);
    }
  });

  test("toggle pill funciona: turismo → escolar", async ({ page }) => {
    await selectTipo(page, "escolar");
    const escolarSpan = page.locator("input[name='tipo'][value='escolar'] + span");
    await expect(escolarSpan).toHaveClass(/bg-primary/);
  });

  test("toggle pill funciona: → corporativo", async ({ page }) => {
    await selectTipo(page, "corporativo");
    await expect(page.locator("input[name='tipo'][value='corporativo']")).toBeChecked();
  });

  test("botão submit é full-width no mobile", async ({ page }) => {
    const form = page.locator("#hero-form");
    const button = form.locator("button[type='submit']");
    const formBox = await form.boundingBox();
    const btnBox = await button.boundingBox();
    expect(formBox).toBeTruthy();
    expect(btnBox).toBeTruthy();
    expect(btnBox!.width).toBeGreaterThan(formBox!.width * 0.9);
  });

  test("botão submit mostra texto 'Solicitar Orçamento' no mobile", async ({ page }) => {
    const span = page.locator("#hero-form button[type='submit'] span");
    await expect(span).toBeVisible();
    await expect(span).toContainText("Solicitar Orçamento");
  });

  test("campos de data empilham verticalmente", async ({ page }) => {
    const iniBox = await page.locator("#data-ini-wrapper").boundingBox();
    const fimBox = await page.locator("#data-fim-wrapper").boundingBox();
    expect(iniBox).toBeTruthy();
    expect(fimBox).toBeTruthy();
    expect(fimBox!.y).toBeGreaterThan(iniBox!.y + iniBox!.height - 1);
  });

  test("origem e destino empilham verticalmente", async ({ page }) => {
    const origemBox = await page.locator("#origem-input").boundingBox();
    const destinoBox = await page.locator("#destino-input").boundingBox();
    expect(origemBox).toBeTruthy();
    expect(destinoBox).toBeTruthy();
    expect(destinoBox!.y).toBeGreaterThan(origemBox!.y + origemBox!.height - 1);
  });

  test("submit funciona no mobile — gera URL WhatsApp", async ({ page }) => {
    await page.evaluate(() => {
      (window as any).__capturedUrl = null;
      window.open = (url: string) => { (window as any).__capturedUrl = url; return null; };
    });

    await page.fill("input[name='origem']", "Tijucas");
    await page.fill("input[name='destino']", "Florianópolis");
    await page.fill("#data-ini", "2026-06-01");
    await page.dispatchEvent("#data-ini", "change");
    await page.fill("#data-fim", "2026-06-05");
    await page.dispatchEvent("#data-fim", "change");
    await page.locator("#hero-form button[type='submit']").click();

    const url = await page.evaluate(() => (window as any).__capturedUrl as string);
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("wa.me/5548999503368");
    expect(decoded).toContain("Tijucas");
    expect(decoded).toContain("Florianópolis");
  });

  test("autocomplete usável no mobile — items com tamanho adequado", async ({ page }) => {
    await page.route("**/nominatim.openstreetmap.org/search**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { display_name: "Florianópolis, Santa Catarina, Brasil" },
          { display_name: "Floresta, Paraná, Brasil" },
        ]),
      });
    });

    await page.fill("input[name='origem']", "Flo");
    await page.waitForTimeout(500);
    await expect(page.locator("#origem-dropdown")).toBeVisible();

    const items = page.locator("#origem-dropdown button");
    const firstBox = await items.first().boundingBox();
    expect(firstBox).toBeTruthy();
    expect(firstBox!.width).toBeGreaterThan(200);
    expect(firstBox!.height).toBeGreaterThanOrEqual(36);

    await items.first().click();
    await expect(page.locator("input[name='origem']")).toHaveValue(/Florianópolis/);
  });

  test("modo escolar funciona no mobile — escola visível com largura adequada", async ({ page }) => {
    await selectTipo(page, "escolar");
    await expect(page.locator("#escola-wrapper")).toBeVisible();

    const selectBox = await page.locator("#escola-select").boundingBox();
    expect(selectBox).toBeTruthy();
    expect(selectBox!.width).toBeGreaterThan(200);
  });
});
