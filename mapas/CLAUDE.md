# CLAUDE.md — Projeto Turismo Mapas

## Identidade

- **O quê**: Gerador de padrões SVG do Brasil (e de Santa Catarina / Rio Grande do Sul) a partir de dados OpenStreetMap via Overpass API. Python stdlib, saída em `output/`, consumido por assets visuais (fingerprints de marca, backgrounds, decorativos).
- **Por quê**: padronizar identidade visual do turismo R. Amaral com mapas estilizados próprios, sem depender de assets comprados ou APIs online; manter geração reprodutível e versionada.
- **Pra quê**: SVGs usados em landing page, materiais gráficos, impressos, cartão pagamento.
- **Para quem**: projeto turismo (consumidor de assets), equipe R. Amaral (marca).

## Comandos

```bash
just build turismo-mapas    # Gera todos os SVGs em output/
just test turismo-mapas     # Suite Python + smoke SVG
just lint turismo-mapas     # ruff nos scripts
```

Ou via Makefile:

```bash
cd projects/turismo/mapas
make           # roda osm2svg.py (Python) — geração padrão
make test      # pytest/unittest + smoke
make lint      # ruff
make clean     # limpa .osm-cache/ e output derivado
```

## Stack

- **Python 3.14 stdlib** — sem deps externas por ora
- **Node** (opcional) — `scripts/generate-map-svgs.mjs` é alternativa paralela
- **Overpass API** (openstreetmap.org) — fonte dos dados geográficos
- **Test runner**: `unittest` stdlib

## Estrutura

```
mapas/
├── CLAUDE.md, README.md, Makefile, .gitignore
├── scripts/
│   ├── osm2svg.py                # Gerador Python principal
│   └── generate-map-svgs.mjs     # Gerador Node alternativo
├── output/                       # SVGs gerados (galeria histórica — 3 gens)
├── tests/
│   ├── test_osm2svg.py           # Unit tests (bbox, out_dir, CLI)
│   └── test_svg_smoke.sh         # Smoke XML-bem-formado em output/
└── .osm-cache/                   # Gitignored — cache Overpass (regenerável)
```

## Convenções

- `output/` contém todas as gerações históricas de SVG — galeria, não apenas "última versão"
- `.osm-cache/` é gitignored (dados regeneráveis via `--refresh`)
- Qualquer PR em `scripts/` roda testes antes (TDD obrigatório por Lei 1)
- Arquivos `.7z` são backups comprimidos de SVGs grandes — mantidos versionados

## Fronteira

- Projeto **consumido por** turismo (landing page), mas é independente em build/test/lint
- Não importa código do turismo; não modifica arquivos de turismo/src
- Para usar um SVG gerado na landing, copiar manualmente para `projects/turismo/public/` ou criar symlink

## Histórico

Extraído de `projects/turismo/scripts/` + `projects/turismo/assets/images/map-patterns/` em 2026-04-14, como parte de split arquitetural para desacoplar geração de assets de landing page.
