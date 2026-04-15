# Cartão de Pagamento — R. Amaral Turismo

Manual PDF interativo (2 páginas) com botões clicáveis (tel/WhatsApp/e-mail/Instagram/Maps/PIX) e QR Code PIX EMV estático.

## Requisitos

- `pdflatex` (TeX Live full ou `texlive-latex-extra` + `texlive-pictures`)
- `inkscape` ou `rsvg-convert` (conversão SVG → PDF do logo)
- `python3` (stdlib — sem dep externa)

## Build

```bash
cd projects/turismo/pagamento
make           # gera cartao.pdf
make test      # roda suite (pytest EMV + smoke PDF)
make check     # valida log LaTeX (sem overfull/undefined)
make lint      # ruff no script Python
make clean     # limpa artefatos build/
```

Ou via monorepo:

```bash
just build turismo-pagamento
just test turismo-pagamento
just lint turismo-pagamento
```

## Dados privados

`data/empresa.tex` é **gitignored** (contém telefone/e-mail/Instagram reais).
Copie de `data/empresa.example.tex` e ajuste:

```bash
cp data/empresa.example.tex data/empresa.tex
```

O `compile.sh` faz essa cópia automaticamente no primeiro build.

## Arquitetura

- `cartao.tex` — documento LaTeX (2 páginas, hyperref + tikz + tcolorbox + qrcode)
- `scripts/pix_emv.py` — gera payload EMV estático (padrão BCB MPD 02.01.00)
- `tests/test_pix_emv.py` — TDD do gerador (CRC16 + TLV)
- `tests/test_pdf_output.sh` — smoke tests (pdfinfo, pdftotext, mutool)
- `data/empresa.example.tex` — template (versionado)
- `data/empresa.tex` — dados reais (gitignored)
- `assets/` — logo convertido (gerado por compile.sh)

## Payload PIX

Chave: CNPJ `33.876.985/0001-72` · Merchant: `R AMARAL TURISMO` · Cidade: `TIJUCAS`.
Payload reutilizável (txid = `***`).
