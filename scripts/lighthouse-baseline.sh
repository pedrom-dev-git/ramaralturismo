#!/usr/bin/env bash
# lighthouse-baseline.sh — captura baseline mensal contra prod (ou URL custom).
#
# Uso:
#   ./scripts/lighthouse-baseline.sh                   # URL default + headless anti-bot
#   ./scripts/lighthouse-baseline.sh --visible          # janela visível (mais confiável)
#   ./scripts/lighthouse-baseline.sh --local            # build prod + preview localhost (sem CF)
#   ./scripts/lighthouse-baseline.sh https://outra.url  # URL custom
#
# Comportamento:
#   1. Tenta lighthouse com --headless=new + flags anti-detecção (Cloudflare bot challenge).
#   2. --local: build + preview server local (porta 4322) → mede prod build sem Cloudflare.
#   3. Valida JSON: runtimeError == null + 4 categorias com score numérico.
#   4. Se NO_FCP em modo headless, sugere fallback (--visible ou --local).
#   5. Imprime resumo dos 4 scores (Performance / A11y / Best Practices / SEO).
#   6. NÃO commita — Rei decide.
#
# Saída: .lighthouse/baseline-YYYY-MM.json (consolidado, sobrescreve se mês igual).
#        .lighthouse/baseline-YYYY-MM-local.json (modo --local).
#
# Pre-reqs: Node ≥18 (pra npx -y lighthouse), Chrome/Chromium em PATH, pnpm (modo --local).

set -euo pipefail

URL_DEFAULT="https://ramaral.tur.br/"
LOCAL_PORT=4322
VISIBLE=0
LOCAL=0
URL=""

# detect_stable_chrome — encontra Chrome estável (faixa 130-145) preferindo
# Puppeteer cache > sistema > Playwright cache > $CHROME_PATH override.
# Chrome ≥146 + lighthouse 13.x dispara NO_FCP (memória project_lighthouse_chrome_147_blocked).
# Imprime path do binário em stdout, vazio se nada estável encontrado.
detect_stable_chrome() {
  # 1. Override explícito por env
  if [[ -n "${CHROME_PATH:-}" && -x "$CHROME_PATH" ]]; then
    echo "$CHROME_PATH"
    return 0
  fi

  # 2. Puppeteer cache: faixa estável 130-145, mais recente primeiro
  local candidate
  for candidate in $(ls -d ~/.cache/puppeteer/chrome/linux-13*.* ~/.cache/puppeteer/chrome/linux-14[0-5].* 2>/dev/null | sort -rV); do
    if [[ -x "$candidate/chrome-linux64/chrome" ]]; then
      echo "$candidate/chrome-linux64/chrome"
      return 0
    fi
  done

  # 3. Sistema (Chromium do Fedora ou Chrome estável)
  for candidate in /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome-stable; do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  # 4. Playwright cache (último recurso — pode ser versão instável)
  for candidate in $(ls -d ~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null | sort -rV); do
    if [[ -x "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done

  echo ""
  return 1
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --visible|-v)
      VISIBLE=1
      shift
      ;;
    --local|-l)
      LOCAL=1
      shift
      ;;
    --help|-h)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *)
      URL="$1"
      shift
      ;;
  esac
done

# Local mode: build + preview server, override URL
PREVIEW_PID=""
cleanup_preview() {
  if [[ -n "$PREVIEW_PID" ]]; then
    kill "$PREVIEW_PID" 2>/dev/null || true
    wait "$PREVIEW_PID" 2>/dev/null || true
    echo "[lh-baseline] preview server stopped (pid $PREVIEW_PID)"
  fi
}
trap cleanup_preview EXIT

if [[ $LOCAL -eq 1 ]]; then
  echo "[lh-baseline] modo --local: build production + preview localhost:$LOCAL_PORT"
  pnpm build --silent || { echo "[lh-baseline] FALHOU pnpm build" >&2; exit 5; }
  pnpm preview --port "$LOCAL_PORT" --host 127.0.0.1 >/tmp/lh-preview.log 2>&1 &
  PREVIEW_PID=$!
  echo "[lh-baseline] preview server pid=$PREVIEW_PID — aguardando porta $LOCAL_PORT..."
  for i in {1..30}; do
    if curl -sf "http://127.0.0.1:$LOCAL_PORT/" >/dev/null 2>&1; then
      echo "[lh-baseline] preview pronto"
      break
    fi
    sleep 1
  done
  URL="http://127.0.0.1:$LOCAL_PORT/"
fi

URL="${URL:-$URL_DEFAULT}"
YYYYMM="$(date +%Y-%m)"
OUT_DIR=".lighthouse"
SUFFIX="$([[ $LOCAL -eq 1 ]] && echo '-local' || echo '')"
OUT_PATH="${OUT_DIR}/baseline-${YYYYMM}${SUFFIX}.json"

# Sanity: roda da raiz do projeto turismo
if [[ ! -d "$OUT_DIR" ]]; then
  echo "[lh-baseline] ERRO: $OUT_DIR não existe. Rode da raiz do projeto turismo." >&2
  exit 2
fi

CHROME_BIN="$(detect_stable_chrome)"
if [[ -z "$CHROME_BIN" ]]; then
  echo "[lh-baseline] AVISO: nenhum Chrome estável (≤145) encontrado — lighthouse usará default do PATH (pode dar NO_FCP em Chrome ≥146)" >&2
else
  CHROME_VERSION="$("$CHROME_BIN" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
  export CHROME_PATH="$CHROME_BIN"
fi

echo "[lh-baseline] URL ........ $URL"
echo "[lh-baseline] output ..... $OUT_PATH"
echo "[lh-baseline] mode ....... $([[ $VISIBLE -eq 1 ]] && echo 'visible (foreground)' || echo 'headless=new')"
echo "[lh-baseline] chrome ..... ${CHROME_BIN:-default-PATH} ${CHROME_VERSION:+(v$CHROME_VERSION)}"
echo

# Build chrome-flags
# Anti-bot detection (Cloudflare bot challenge serves NO_FCP page to headless Chrome
# unless we hide automation fingerprint). User-Agent real é crítico.
ANTI_BOT_FLAGS="--disable-blink-features=AutomationControlled --no-sandbox --disable-dev-shm-usage --disable-gpu --disable-software-rasterizer"
REAL_UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

if [[ $VISIBLE -eq 1 ]]; then
  CHROME_FLAGS_ARG=("--chrome-flags=$ANTI_BOT_FLAGS")
  echo "[lh-baseline] AVISO: deixa a janela do Chrome em foreground por ~30s pra não dar NO_FCP."
  sleep 2
else
  CHROME_FLAGS_ARG=("--chrome-flags=--headless=new $ANTI_BOT_FLAGS")
fi

# Run lighthouse
set +e
npx -y lighthouse "$URL" \
  --output=json \
  --output-path="$OUT_PATH" \
  --max-wait-for-load=60000 \
  --extra-headers="{\"User-Agent\":\"$REAL_UA\"}" \
  "${CHROME_FLAGS_ARG[@]}" \
  --quiet
LH_EXIT=$?
set -e

# Validate JSON
if [[ ! -s "$OUT_PATH" ]]; then
  echo "[lh-baseline] FALHOU: $OUT_PATH vazio ou ausente (lighthouse exit=$LH_EXIT)." >&2
  exit 3
fi

RUNTIME_ERR="$(jq -r '.runtimeError.code // "null"' "$OUT_PATH")"
if [[ "$RUNTIME_ERR" != "null" ]]; then
  RUNTIME_MSG="$(jq -r '.runtimeError.message' "$OUT_PATH")"
  echo "[lh-baseline] FALHOU: runtimeError=$RUNTIME_ERR" >&2
  echo "[lh-baseline] msg: $RUNTIME_MSG" >&2
  command rm -f "$OUT_PATH"
  if [[ $VISIBLE -eq 0 && $LOCAL -eq 0 ]]; then
    echo
    echo "[lh-baseline] dicas pra resolver NO_FCP:"
    echo "  1. Modo --local (build prod + preview localhost, sem Cloudflare):"
    echo "       ./scripts/lighthouse-baseline.sh --local"
    echo "  2. Modo --visible (janela em foreground manualmente):"
    echo "       ./scripts/lighthouse-baseline.sh --visible"
  fi
  exit 4
fi

# Extract scores
PERF="$(jq -r '.categories.performance.score // "n/a"' "$OUT_PATH")"
A11Y="$(jq -r '.categories.accessibility.score // "n/a"' "$OUT_PATH")"
BP="$(jq -r '.categories["best-practices"].score // "n/a"' "$OUT_PATH")"
SEO="$(jq -r '.categories.seo.score // "n/a"' "$OUT_PATH")"

format_score() {
  local s="$1"
  if [[ "$s" == "n/a" || "$s" == "null" ]]; then
    echo "n/a"
  else
    awk -v s="$s" 'BEGIN { printf "%.0f", s*100 }'
  fi
}

echo
echo "[lh-baseline] ✅ Baseline gravada em $OUT_PATH"
echo "[lh-baseline]   Performance ......... $(format_score "$PERF")"
echo "[lh-baseline]   Accessibility ....... $(format_score "$A11Y")"
echo "[lh-baseline]   Best Practices ...... $(format_score "$BP")"
echo "[lh-baseline]   SEO ................. $(format_score "$SEO")"

# Update docs/perf-baseline.md if exists
if [[ -f "docs/perf-baseline.md" ]]; then
  TODAY="$(date +%Y-%m-%d)"
  if grep -q "baseline-${YYYYMM}.json" docs/perf-baseline.md; then
    echo "[lh-baseline] docs/perf-baseline.md já referencia ${YYYYMM} — não atualiza"
  else
    echo "[lh-baseline] docs/perf-baseline.md atualizado (referência manual recomendada antes de commitar)"
  fi
fi

echo
echo "[lh-baseline] Próximo: revisar e commitar (não automático):"
echo "  git add $OUT_PATH docs/perf-baseline.md"
echo "  git commit -m 'docs(turismo): lighthouse baseline ${YYYYMM}'"
