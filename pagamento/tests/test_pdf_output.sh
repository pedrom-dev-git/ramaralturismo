#!/usr/bin/env bash
# Smoke tests for cartao.pdf — RED-1..RED-6 from the phase-0 plan.
set -euo pipefail

PDF="cartao.pdf"
LOG="build/cartao.log"
fail=0
ok()   { printf "  ✓ %s\n" "$1"; }
bad()  { printf "  ✗ %s\n" "$1"; fail=1; }

if [[ ! -f "$PDF" ]]; then
  echo "✗ $PDF não existe — rode 'make' antes."
  exit 2
fi

# Build a single text dump with all URIs from annotations on both pages.
collect_annots() {
  local dump=""
  for pageref in $(mutool show "$PDF" pages 2>/dev/null | awk -F'=' '/^page/ {gsub(/ /,"",$2); print $2}'); do
    # Get the page object, extract /Annots list, then dump each referenced object.
    local annot_ids
    annot_ids=$(mutool show "$PDF" "${pageref%0R}" 2>/dev/null \
                | grep -oE '/Annots[[:space:]]*\[[^]]*\]' \
                | grep -oE '[0-9]+ 0 R' | awk '{print $1}')
    for aid in $annot_ids; do
      dump+=$'\n'$(mutool show "$PDF" "$aid" 2>/dev/null | tr -d '\n')
    done
  done
  printf "%s" "$dump"
}

ANNOTS_DUMP=$(collect_annots)

echo "▶ RED-1 — 2 páginas"
pages=$(pdfinfo "$PDF" | awk '/^Pages:/ {print $2}')
[[ "$pages" == "2" ]] && ok "Pages: 2" || bad "Pages: $pages (esperado 2)"

echo "▶ RED-2 — 6 schemes de botão (p.1) via text + URI annots"
TXT_P1=$(pdftotext -f 1 -l 1 -layout "$PDF" - 2>/dev/null)
COMBINED="$TXT_P1"$'\n'"$ANNOTS_DUMP"
for pat in "tel:" "wa.me" "mailto:" "instagram.com" "google.com/maps"; do
  if grep -qF "$pat" <<<"$COMBINED" ; then
    ok "link encontrado: $pat"
  else
    bad "link ausente: $pat"
  fi
done
# 6th button is internal GoTo → pix; check for /GoTo with destination "pix"
if grep -qE "/GoTo" <<<"$ANNOTS_DUMP" && grep -qE '\(pix\)|/pix' <<<"$ANNOTS_DUMP"; then
  ok "link interno /GoTo pix encontrado"
else
  bad "link interno PIX ausente"
fi

echo "▶ RED-3 — CNPJ na página 2"
TXT_P2=$(pdftotext -f 2 -l 2 -layout "$PDF" - 2>/dev/null)
grep -q "33876985000172\|33\.876\.985/0001-72" <<<"$TXT_P2" \
  && ok "CNPJ presente na p.2" \
  || bad "CNPJ ausente na p.2"

echo "▶ RED-4 — CNPJ selecionável (texto, não raster)"
grep -q "33876985000172\|33\.876\.985/0001-72" <<<"$(pdftotext "$PDF" - 2>/dev/null)" \
  && ok "CNPJ extraído via pdftotext" \
  || bad "CNPJ não extraível (rasterizado?)"

echo "▶ RED-5 — anotações URI/Action válidas"
uri_count=$(grep -oE "/URI|/GoTo" <<<"$ANNOTS_DUMP" | wc -l)
if [[ "$uri_count" -ge 6 ]]; then
  ok "$uri_count referências URI/GoTo detectadas"
else
  bad "apenas $uri_count anotações detectadas (esperado ≥6)"
fi

echo "▶ RED-6 — log LaTeX limpo"
if [[ -f "$LOG" ]]; then
  bad_lines=$(grep -cE "^(! |Overfull|Undefined control sequence)" "$LOG" || true)
  [[ "$bad_lines" == "0" ]] && ok "log sem erros/overfull/undefined" \
    || bad "$bad_lines linhas problemáticas em $LOG"
else
  bad "log não encontrado em $LOG"
fi

echo
if [[ "$fail" == "0" ]]; then
  echo "✓ Todos RED-1..RED-6 PASSARAM"
  exit 0
else
  echo "✗ Alguns smoke tests falharam"
  exit 1
fi
