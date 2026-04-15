#!/usr/bin/env bash
# RED-7 — QR Code PNG externo deve existir e decodificar exatamente para o payload EMV.
set -euo pipefail

PNG="scripts/qrcode.png"
PAYLOAD_TXT="scripts/pix_payload.txt"
fail=0
ok()  { printf "  ✓ %s\n" "$1"; }
bad() { printf "  ✗ %s\n" "$1"; fail=1; }

echo "▶ RED-7 — QR Code externo (qrencode + zbarimg roundtrip)"

[[ -f "$PNG" ]] && ok "$PNG existe" || { bad "$PNG ausente — rode 'make' antes"; exit 2; }
[[ -f "$PAYLOAD_TXT" ]] && ok "$PAYLOAD_TXT existe" || { bad "$PAYLOAD_TXT ausente"; exit 2; }

EXPECTED=$(cat "$PAYLOAD_TXT")
DECODED=$(zbarimg --quiet --raw "$PNG" 2>/dev/null | tr -d '\r\n' || true)

if [[ -z "$DECODED" ]]; then
  bad "zbarimg não decodificou $PNG"
elif [[ "$DECODED" == "$EXPECTED" ]]; then
  ok "zbarimg decodificou exatamente o payload (${#EXPECTED} chars)"
else
  bad "decodificado difere do payload esperado"
  echo "    esperado: $EXPECTED"
  echo "    decoded : $DECODED"
fi

# Sanity: checa que payload começa como EMV PIX e termina com CRC16.
[[ "$EXPECTED" == "000201"* ]] && ok "payload começa com Format Indicator 000201" || bad "payload não começa com 000201"
[[ "${EXPECTED: -8:4}" == "6304" ]] && ok "payload contém bloco CRC 6304" || bad "payload não termina com 6304<CRC>"

echo
if [[ "$fail" == "0" ]]; then
  echo "✓ RED-7 PASSOU — QR externo válido e fiel ao payload"
  exit 0
else
  echo "✗ RED-7 FALHOU"
  exit 1
fi
