# Performance Baseline — R. Amaral Turismo

## Baseline 2026-04-18

**Commit**: `8216a86` (pré-Sprint 3 push — Sprint 3 fechada localmente, ainda não publicada)
**Ferramenta**: Lighthouse 12 via `pnpm dlx lighthouse@latest`
**Chromium**: Playwright bundle `chromium-1217`
**URLs**: `https://ramaralturismo.job-3eb.workers.dev/`

> **Nota**: Baseline medido contra o Worker em produção no estado pré-Sprint 3.
> Re-medir após Sprint 3 publicada com `pnpm push` autorizado pelo Rei.

### Scores

| URL  | Performance | A11y | Best Practices | SEO |
|------|-------------|------|----------------|-----|
| `/`    | 99          | 84   | 100            | 100 |
| `/en/` | 99          | 84   | 100            | 100 |
| `/es/` | 100         | 84   | 100            | 100 |

### Core Web Vitals (pt-BR `/`)

| Métrica | Valor |
|---------|-------|
| FCP (First Contentful Paint) | 1.3 s |
| LCP (Largest Contentful Paint) | 1.3 s |
| TBT (Total Blocking Time) | 10 ms |
| CLS (Cumulative Layout Shift) | 0.001 |
| Speed Index | 2.7 s |
| TTI (Time to Interactive) | 1.8 s |

### A11y — itens falhando (score 84)

| Audit | Score | Nota |
|-------|-------|------|
| `landmark-one-main` | 0 | Corrigido na Sprint 3 (local), re-medir após push |
| `button-name` | 0 | Botões sem nome acessível — Sprint 5a |
| `color-contrast` | 0 | Contraste insuficiente — Sprint 5a |
| `label` | 0 | Inputs sem label associado — Sprint 5a |

---

## Quick Wins Identificados (T2)

Baseado no baseline e análise do código atual:

| # | Item | Esforço | Sprint Alvo | Motivo |
|---|------|---------|-------------|--------|
| 1 | **Preload Inter 600 + 700** (`inter-latin-600-normal.woff2`, `inter-latin-700-normal.woff2`) — hoje só 400 tem preload hint | Baixo (2 linhas em `BaseLayout.astro`) | 5a | FCP já é bom (1.3s), mas pesos bold causam FOUT em conexões lentas |
| 2 | **Workbox cache woff2** (`globPatterns` inclui `woff2`) — fontes não cacheadas pelo SW hoje | Baixo (1 linha em `astro.config.mjs`) | 4 (T5) | Elimina FOUT em retorno ao site; zero custo de bundle |
| 3 | **Swiper: importar módulos individuais** em vez de `swiper/bundle` — bundle inclui todos os módulos (Pagination, Navigation, Scrollbar, etc.) mesmo os não usados | Médio (requer mapeamento de quais módulos Partners/News usam) | 6 | Bundle completo do Swiper é ~55KB gzip; módulos usados provavelmente são Autoplay + Pagination = ~12KB |

> **Nota**: A11y está em 84 — o maior ganho absoluto virá da Sprint 5a (`button-name`, `color-contrast`, `label`). Esses 3 audits failing juntos custam ~16 pontos.

---

## Como Re-medir

```bash
# A partir de ~/Desktop/projetos/turismo/
CHROME_PATH=~/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome \
pnpm dlx lighthouse@latest \
  https://ramaralturismo.job-3eb.workers.dev/ \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json \
  --output-path=./.lighthouse/baseline-YYYY-MM.json \
  --quiet \
  --chrome-flags="--headless --no-sandbox --disable-dev-shm-usage"
```

**Frequência sugerida**: a cada push para produção (Sprint fechada) e após cada sprint de performance (5a, 6, 7).

O arquivo `.lighthouse/baseline-2026-04.json` contém os scores consolidados das 3 URLs.
Os arquivos individuais (`baseline-pt.json`, `baseline-en.json`, `baseline-es.json`) contêm o JSON completo do Lighthouse e estão no `.gitignore` — apenas o consolidado é versionado.
