#!/usr/bin/env bash
# Smoke: every SVG in output/ must contain <svg> root within first KB.
# RED before migration (output/ empty); GREEN after git mv of map-patterns.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/../output"

count=0
failed=0

shopt -s nullglob
for svg in "$OUT"/*.svg; do
    count=$((count + 1))
    if ! head -c 2048 "$svg" | grep -q '<svg'; then
        echo "✗ $(basename "$svg") — missing <svg> root"
        failed=$((failed + 1))
    fi
done

if [[ $count -eq 0 ]]; then
    echo "✗ No SVGs found in output/"
    exit 1
fi

if [[ $failed -gt 0 ]]; then
    echo "✗ $failed of $count SVGs invalid"
    exit 1
fi

echo "✓ $count SVGs pass smoke"
