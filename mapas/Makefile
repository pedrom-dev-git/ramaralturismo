# R. Amaral Turismo — Mapas SVG (OSM → SVG via Python stdlib)
# Alvos: all, test, lint, fmt, clean

.PHONY: all test lint fmt clean

SHELL := /bin/bash

all: output

output:
	@mkdir -p output
	python3 scripts/osm2svg.py
	@echo "✓ SVGs gerados em output/"

test:
	@python3 -m unittest discover -s tests -p 'test_*.py' -v
	@bash tests/test_svg_smoke.sh

lint:
	@command -v ruff >/dev/null 2>&1 && ruff check scripts/ tests/ || echo "ruff não instalado (opcional)"

fmt:
	@command -v ruff >/dev/null 2>&1 && ruff format scripts/ tests/ || echo "ruff não instalado (opcional)"

clean:
	rm -rf .osm-cache __pycache__ scripts/__pycache__ tests/__pycache__ .ruff_cache
	@echo "✓ cache limpo (output/ preservado — é artefato versionado)"
