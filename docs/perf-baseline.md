# Performance Baseline — R. Amaral Turismo

## Baseline 2026-05-03 (atual)

**Commit**: `62763a8` (pós-sprint redesign+polish + página /sobre trilíngue)
**Ferramenta**: Lighthouse 13.2.0 via `./scripts/lighthouse-baseline.sh --local`
**Chrome**: `~/.cache/puppeteer/chrome/linux-131.0.6778.204` (Chrome ≥146 quebra com NO_FCP — ver `~/.claude/.../project_lighthouse_chrome_147_blocked.md`)
**URL**: `http://127.0.0.1:4322/` (production build via `pnpm preview`, evita anti-bot Cloudflare)
**JSON consolidado**: `.lighthouse/baseline-2026-05-local.json`

> **Nota**: Modo `--local` mede o bundle production servido localmente (mesmos artefatos que vão pra Cloudflare Pages). Diferenças vs prod externa: zero RTT Cloudflare (FCP/LCP ~50ms otimistas), sem CDN cache (LCP pode ser pior em prod first-paint), HSTS/CSP idênticos.

### Scores

| URL  | Performance | A11y | Best Practices | SEO |
|------|-------------|------|----------------|-----|
| `/`  | 99          | 100  | 100            | 100 |

### Core Web Vitals (`/`)

| Métrica | Valor | vs 2026-04-18 |
|---------|-------|---------------|
| FCP | 1.6 s | +0.3s |
| LCP | 1.8 s | +0.5s |
| TBT | 0 ms | -10ms |
| CLS | 0.001 | igual |
| Speed Index | 1.6 s | -1.1s ✓ |
| TTI | 1.8 s | igual |

### A11y — full pass (100)

Quick wins da Sprint 5a entregaram: `landmark-one-main`, `button-name`, `color-contrast`, `label` todos passando. Nenhum audit a11y pendente.

---

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
cd ~/Desktop/projetos/turismo
./scripts/lighthouse-baseline.sh --local       # production build local (recomendado)
./scripts/lighthouse-baseline.sh               # contra prod (https://ramaral.tur.br)
./scripts/lighthouse-baseline.sh --visible     # janela Chrome em foreground
```

Script em `scripts/lighthouse-baseline.sh` auto-detecta Chrome estável (≤145), valida JSON, imprime scores resumidos. Sufixo `-local` no filename quando modo `--local`.

**Frequência sugerida**: a cada push para produção (Sprint fechada) e após cada sprint de performance.

`.lighthouse/baseline-YYYY-MM*.json` versionado via `.gitignore` (glob `baseline-2026-*.json`). Os runs históricos `baseline-pt/en/es.json` e `sprint5a-*.json` ficam fora do git.
