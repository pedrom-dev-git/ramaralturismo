# Mapas SVG — R. Amaral Turismo

Gerador de padrões SVG do Brasil / SC / RS a partir de dados OpenStreetMap (Overpass API). Python stdlib, sem deps externas.

## Requisitos

- `python3` (3.14+ recomendado, stdlib only)
- Conexão com internet (Overpass API em primeira geração; `.osm-cache/` evita rehit)
- `xmllint` (opcional, para smoke test) — pacote `libxml2`

## Uso

```bash
cd projects/turismo/mapas
make           # gera todos os SVGs em output/
make test      # roda suite (unittest + smoke XML)
make lint      # ruff (se instalado)
make clean     # limpa caches (preserva output/)
```

Ou via monorepo:

```bash
just build turismo-mapas
just test turismo-mapas
just lint turismo-mapas
```

## Saída

`output/` contém 3 gerações históricas de SVGs:

- `*-full-*`, `*-sc-*`, `*-rs-*` — gerações março 2026 (variações de traços)
- `*-preto-*`, `*-azul-*`, `*-vermelho-*`, etc. — geração abril 2026 (paleta de marca)

SVGs grandes (`~17MB`) têm backup comprimido `.svg.7z` ao lado.

## Cache

`.osm-cache/` contém respostas Overpass em JSON/GeoJSON. Gitignored. Regenerável via flag `--refresh` no script.

## Alternativa em Node

`scripts/generate-map-svgs.mjs` é um gerador paralelo em Node (814 linhas), mantido por compatibilidade de pipeline. Mesmo output, abordagem diferente.
