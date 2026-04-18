# a11y Audit — Sprint 5a Baseline

> Medido em 2026-04-18 via Lighthouse 13 (headless Chromium 1217) contra build de produção
> servido por `wrangler dev` em `http://localhost:4322`.
> JSONs brutos em `.lighthouse/baseline-{pt,en,es}.json` (gitignored).

---

## Seção 1 — Scores

| Locale | Performance | Accessibility | Best Practices | SEO |
|--------|-------------|---------------|----------------|-----|
| `/` (pt-BR) | 99 | **86** | 100 | 100 |
| `/en/` | 99 | **86** | 100 | 100 |
| `/es/` | 99 | **86** | 100 | 100 |

> Baseline anterior (Sprint 4 pre-push, CLAUDE.md): a11y 84, perf 99–100, BP 100, SEO 100.
> Sprint 5a: a11y subiu 2 pontos (84 → 86). Performance, BP e SEO mantidos.

---

## Seção 2 — Issues a11y Priorizadas

Critério de ordenação: peso Lighthouse (campo `weight` em `auditRefs`) desc.
Os 3 locales apresentam **exatamente as mesmas falhas** (site SSG com conteúdo idêntico por locale).

### 1. `button-name` — Botões sem nome acessível

- **Weight:** 10 (crítico)
- **Score:** 0
- **WCAG:** 4.1.2 Name, Role, Value (Nível A)
- **Locales:** pt, en, es
- **Componente:** `NewsCarousel.astro`
- **Elementos afetados (2):**
  - `<button class="news-prev ...">` — botão "anterior" do carrossel de notícias, desabilitado e sem `aria-label`
  - `<button class="news-next ...">` — botão "próximo" do carrossel de notícias, sem `aria-label`
- **Impacto:** Leitores de tela anunciam apenas "button" — sem contexto de ação para usuário cego.

### 2. `label` — Inputs de formulário sem label associado

- **Weight:** 10 (crítico)
- **Score:** 0
- **WCAG:** 1.3.1 Info and Relationships (Nível A) / 4.1.2 Name, Role, Value (Nível A)
- **Locales:** pt, en, es
- **Componente:** `Hero.astro` (formulário de orçamento)
- **Elementos afetados (2):**
  - `<input id="data-ini" type="date" class="sr-only">` — input de data de ida, oculto visualmente mas sem `<label>` ou `aria-label`
  - `<input id="data-fim" type="date" class="sr-only">` — input de data de volta, mesmo problema
- **Impacto:** Campos ficam sem rótulo audível para SR; o `sr-only` esconde visualmente mas não fornece label semântico.

### 3. `color-contrast` — Contraste insuficiente

- **Weight:** 7 (sério)
- **Score:** 0
- **WCAG:** 1.4.3 Contrast (Minimum) (Nível AA)
- **Locales:** pt, en, es
- **Elementos afetados (2):**
  - `<span>` dentro do botão CTA "Solicitar Orçamento" (`bg-green-500` / `text-white` sobre fundo dinâmico) — Lighthouse não conseguiu calcular `contrastRatio` (DOM ambíguo)
  - `<p class="text-primary ...">` com texto "DESTINOS" na seção `#novidades` sobre fundo `bg-dark` — contraste `#0138AD` sobre `#143E58` presumivelmente < 4.5:1
- **Impacto:** Texto difícil ou impossível de ler para usuários com baixa visão.

---

## Seção 3 — Mapa bloco → gap

| Bloco | Título previsto | Issues mapeadas | Audit IDs |
|-------|----------------|-----------------|-----------|
| **B1** | Contraste | `text-primary` (#0138AD) sobre `bg-dark` (#143E58) na seção Novidades; CTA verde ambíguo | `color-contrast` |
| **B2** | Headings | — | — |
| **B3** | Forms | `<input id="data-ini">` e `<input id="data-fim">` sem `<label>` ou `aria-label` no Hero form | `label` |
| **B4** | Keyboard + SR | Botões `news-prev` / `news-next` do NewsCarousel sem `aria-label`; `news-prev` desabilitado sem `aria-disabled` semântico | `button-name` |
| **B5** | Reduced motion | — | — |

> B2 e B5 não têm issues abertas no baseline Sprint 5a — Lighthouse não detectou falhas de heading order nem preferência de movimento. Gap de B2/B5 pode surgir em auditoria manual (ex.: AXE ou screen reader real).

---

## Notas de medição

- Lighthouse rodado com `--only-categories=accessibility,performance,seo,best-practices`.
- Chrome headless: Playwright Chromium 1217 (`~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`).
- Servidor: `wrangler dev --port 4322` (Cloudflare adapter local, SSG prerendered).
- 3 locales medidos separadamente; resultados idênticos entre locales confirmam que as falhas são estruturais (não de conteúdo i18n).
