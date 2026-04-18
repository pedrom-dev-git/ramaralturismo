# R. Amaral Turismo — Cartão de Pagamento (LaTeX + Python EMV)
# Alvos: all, test, check, lint, fmt, clean

.PHONY: all test check lint fmt clean

SHELL := /bin/bash
LATEX := pdflatex
LATEX_FLAGS := -interaction=nonstopmode -halt-on-error -output-directory=build

all: cartao.pdf

cartao.pdf: cartao.tex data/empresa.tex assets/logo-amaral.pdf scripts/pix_payload.txt scripts/pix_payload.tex scripts/qrcode.png
	@mkdir -p build
	TEXINPUTS=.:./data:./assets:./build: $(LATEX) $(LATEX_FLAGS) cartao.tex
	TEXINPUTS=.:./data:./assets:./build: $(LATEX) $(LATEX_FLAGS) cartao.tex
	@cp build/cartao.pdf cartao.pdf
	@echo "✓ cartao.pdf gerado"

data/empresa.tex: data/empresa.example.tex
	@if [ ! -f data/empresa.tex ]; then \
		cp data/empresa.example.tex data/empresa.tex; \
		echo "→ data/empresa.tex criado a partir do template (edite se necessário)"; \
	fi

assets/logo-amaral.pdf: ../public/logo-amaral.svg
	@mkdir -p assets
	@if command -v inkscape >/dev/null 2>&1; then \
		inkscape --export-type=pdf --export-filename=assets/logo-amaral.pdf ../public/logo-amaral.svg >/dev/null 2>&1; \
	elif command -v rsvg-convert >/dev/null 2>&1; then \
		rsvg-convert -f pdf -o assets/logo-amaral.pdf ../public/logo-amaral.svg; \
	else \
		echo "✗ inkscape/rsvg-convert não encontrado"; exit 1; \
	fi
	@echo "✓ logo convertido"

scripts/pix_payload.txt scripts/pix_payload.tex: scripts/pix_emv.py data/empresa.tex
	@python3 scripts/pix_emv.py > scripts/pix_payload.txt
	@echo "✓ payload PIX gerado (.txt + .tex)"

scripts/qrcode.png: scripts/pix_payload.txt
	@qrencode -o scripts/qrcode.png -l H -s 30 -m 2 "$$(cat scripts/pix_payload.txt)"
	@mogrify -alpha off -background white -flatten scripts/qrcode.png
	@echo "✓ QR PNG gerado (qrencode, level H, 1470px, sem alpha)"

test: all
	@echo "▶ Testing PIX EMV generator (pytest stdlib)..."
	@python3 -m unittest discover -s tests -p 'test_*.py' -v
	@echo "▶ Testing PDF output (smoke)..."
	@bash tests/test_pdf_output.sh
	@echo "▶ Testing QR image (roundtrip zbarimg)..."
	@bash tests/test_qr_image.sh

check: all
	@echo "▶ Checking LaTeX log..."
	@! grep -E "(Overfull|Undefined|^!)" build/cartao.log || (echo "✗ warnings no log"; exit 1)
	@echo "✓ LaTeX log limpo"

lint:
	@echo "▶ Linting Python (ruff)..."
	@if command -v ruff >/dev/null 2>&1; then \
		ruff check scripts/ tests/; \
	else \
		python3 -m py_compile scripts/pix_emv.py && echo "✓ py_compile OK (ruff ausente)"; \
	fi

fmt:
	@if command -v ruff >/dev/null 2>&1; then \
		ruff format scripts/ tests/; \
	fi

clean:
	rm -rf build/ scripts/pix_payload.txt scripts/pix_payload.tex scripts/qrcode.png assets/logo-amaral.pdf assets/logo-amaral.png
	@echo "✓ clean"
