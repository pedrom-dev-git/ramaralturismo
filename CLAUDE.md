# CLAUDE.md — Projeto Turismo

## Identidade

- **O quê**: Landing page trilíngue (pt-BR/en/es) em Astro 6 + Tailwind 4 para a R. Amaral (transportadora e turismo da família em Tijucas-SC); potencial de evolução para SaaS multi-nicho.
- **Por quê**: gerar receita direta para a família; dominar frontend moderno (Astro, Tailwind 4, Playwright); validar modelo SaaS descrito em `projects/politic/projeto-turismo-saas.md`.
- **Pra quê**: leads e vendas para a R. Amaral; base replicável para SaaS; vitrine técnica de frontend contemporâneo.
- **Para quem**: família (empresa), clientes finais (turistas), comunidade técnica / recrutadores.

## Visão Geral

Landing page para **R. Amaral**, empresa de transporte e turismo (transporte escolar + viagens em grupo) em Tijucas, SC. WhatsApp: +48 999503368. Expansão multi-página planejada — ver `PLANO-PAGINAS.md`.

## Comandos

```bash
just test turismo       # Playwright E2E (18 specs)
just build turismo      # Build Astro SSG
just lint turismo       # astro check
just dev turismo        # Dev server (localhost:4321)
just setup turismo      # pnpm install
```

Ou diretamente no diretório:

```bash
pnpm dev                # Dev server (port 4321)
pnpm build              # Production build
pnpm test               # Playwright E2E
pnpm test -- tests/hero.spec.ts  # Teste específico
```

## Stack

- **Astro 6** (SSG) com componentes `.astro`
- **Tailwind CSS 4** via `@tailwindcss/vite` (`@theme` directive, não `tailwind.config.js`)
- **Swiper** para carrosséis (Partners, News)
- **Playwright** para E2E (Chromium only)
- **@vite-pwa/astro** para PWA/service worker
- **Google Fonts**: Inter (400, 600, 700) + custom `ALVATER Rough`

## Arquitetura

- `src/pages/index.astro` — Homepage pt-BR (default locale, sem prefixo)
- `src/pages/{en,es}/index.astro` — Páginas por locale
- `src/components/PageContent.astro` — Composição de todas as seções (Navbar → Hero → Benefits → Partners → Services → NewsCarousel → Footer)
- `src/layouts/BaseLayout.astro` — Shell HTML com meta tags, fonts, CSS global
- `src/i18n/` — Sistema de tradução: `t(locale, key)`, fallback para pt-BR
- `src/styles/global.css` — Tailwind + design tokens via `@theme`

### i18n

- Default: `pt-BR` (sem prefixo `/`), outros: `/en/`, `/es/`
- Traduções em `src/i18n/translations/{pt-BR,en,es}.ts`
- `pt-BR.ts` é source of truth — define o tipo `TranslationKey`
- Componentes recebem prop `locale` e usam `t(locale, 'key')`

## Design Tokens

Definidos em `src/styles/global.css` via `@theme`. Usar classes Tailwind, não hex direto.

| Token | Hex | Classe |
|-------|-----|--------|
| primary | `#0138AD` | `bg-primary`, `text-primary` |
| accent | `#9D0013` | `bg-accent`, `text-accent` |
| dark | `#143E58` | `bg-dark`, `text-dark` |
| light-gray | `#F5F5F5` | `bg-light-gray` |
| dark-gray | `#333333` | `text-dark-gray` |
| medium-gray | `#666666` | `text-medium-gray` |
| light-blue | `#DCF0F7` | `bg-light-blue` |

## Convenções

- Todos componentes são Astro-only (sem React/Vue/Svelte)
- Swiper inicializado via `<script>` dentro do `.astro`, import de `swiper/bundle`
- Hero form: hidden native inputs + styled elements (date picker com `showPicker()`, radio pills, Nominatim autocomplete)
- **Testes**: 1 arquivo por componente (`Hero.astro` → `tests/hero.spec.ts`). Rodar teste afetado após cada mudança
- Playwright auto-inicia dev server (`reuseExistingServer: true`, `baseURL: http://localhost:4321`)
- Assets: `assets/images/{hero,gallery,icons,logos}`, `assets/fonts/`, `assets/videos/`
- Referência de design: `ASSETS.md` (Figma spec), `figma/figma-page-1.jpeg`

## Analytics

Stack: **Cloudflare Web Analytics** (cookieless, LGPD-safe). Sem GA4, sem Plausible.

- **Token**: env var `PUBLIC_CF_ANALYTICS_TOKEN` no Worker (nunca commitar)
- **Render condicional**: se `PUBLIC_CF_ANALYTICS_TOKEN` ausente → script omitido. Seguro em local dev e CI sem configuração adicional.
- **Ativar**: `pnpm wrangler secret put PUBLIC_CF_ANALYTICS_TOKEN` → cola valor do dashboard CF → re-deploy
- **Desativar**: remova a var no dashboard CF → re-deploy
- **Dashboard**: https://dash.cloudflare.com/<account>/web-analytics
- **Exemplo de env local**: `.env.example` na raiz do projeto
- **Conversion tracking customizado**: Sprint 7 Worker-side — não via front-end

## Performance Baseline

Baseline medido em 2026-04-18 (pré-Sprint 3 push):

| URL  | Perf | A11y | BP  | SEO |
|------|------|------|-----|-----|
| `/`    | 99   | 84   | 100 | 100 |
| `/en/` | 99   | 84   | 100 | 100 |
| `/es/` | 100  | 84   | 100 | 100 |

Detalhes e quick wins identificados em `docs/perf-baseline.md`.
Re-medir após cada sprint publicada (comando documentado no arquivo).
