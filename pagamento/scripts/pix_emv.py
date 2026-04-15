"""Generate a static PIX EMV payload (BCB MPD 02.01.00).

Reference: BACEN "Manual de Padrões para Iniciação do Pix" v2.2.
Encoding: EMV QR Code TLV with CRC16-CCITT-FALSE suffix.

Usage:
    python3 pix_emv.py > pix_payload.txt

The payload is ASCII-safe and suitable as input for LaTeX qrcode package.

All data is static and public (CNPJ + merchant name + city). No secrets.
"""

from __future__ import annotations

import sys
from pathlib import Path

# --- Default merchant (R. Amaral Turismo) ------------------------------------
DEFAULT_PIX_KEY = "33876985000172"       # CNPJ (sem formatação)
DEFAULT_MERCHANT_NAME = "R AMARAL TURISMO"
DEFAULT_MERCHANT_CITY = "TIJUCAS"
DEFAULT_TXID = "***"                      # reusable static payload


def crc16_ccitt(data: bytes) -> int:
    """CRC16-CCITT-FALSE: poly=0x1021, init=0xFFFF, no reflect, xorout=0x0000."""
    crc = 0xFFFF
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return crc


def tlv(tag: str, value: str) -> str:
    """Encode an EMV TLV field: ID(2) + Length(2, zero-padded) + Value."""
    return f"{tag}{len(value):02d}{value}"


def build_payload(
    pix_key: str = DEFAULT_PIX_KEY,
    merchant_name: str = DEFAULT_MERCHANT_NAME,
    merchant_city: str = DEFAULT_MERCHANT_CITY,
    txid: str = DEFAULT_TXID,
) -> str:
    """Build a static PIX EMV payload string (including CRC16 suffix).

    Inputs must be ASCII; merchant_name ≤ 25 chars, merchant_city ≤ 15 chars.
    """
    if not merchant_name.isascii() or not merchant_city.isascii():
        raise ValueError("merchant_name and merchant_city must be ASCII")
    if len(merchant_name) > 25:
        raise ValueError("merchant_name exceeds 25 chars")
    if len(merchant_city) > 15:
        raise ValueError("merchant_city exceeds 15 chars")

    # ID 26 — Merchant Account Information (PIX)
    #   00: GUI "BR.GOV.BCB.PIX"
    #   01: chave PIX
    mai = tlv("00", "BR.GOV.BCB.PIX") + tlv("01", pix_key)

    # ID 62 — Additional Data Field Template (Reference Label / txid).
    # Optional in static payloads. Some bank apps reject "***" as txid value,
    # so we omit 62 entirely when txid is empty or "***".
    include_add = bool(txid) and txid != "***"
    add = tlv("05", txid) if include_add else ""

    body = (
        tlv("00", "01")              # Payload Format Indicator
        + tlv("26", mai)             # Merchant Account Information
        + tlv("52", "0000")          # Merchant Category Code (default)
        + tlv("53", "986")           # Transaction Currency (BRL)
        + tlv("58", "BR")            # Country
        + tlv("59", merchant_name)   # Merchant Name
        + tlv("60", merchant_city)   # Merchant City
        + (tlv("62", add) if add else "")  # Additional Data (optional)
    )
    # CRC16 is computed over body + "6304" (ID 63, len 04) and appended as 4 hex upper.
    to_crc = body + "6304"
    crc = crc16_ccitt(to_crc.encode("ascii"))
    return f"{to_crc}{crc:04X}"


def main() -> int:
    payload = build_payload()
    # Write to stdout; Makefile redirects to scripts/pix_payload.txt.
    sys.stdout.write(payload)
    # Also emit a LaTeX helper. Key constraint: when a TeX macro containing
    # ASCII spaces is later re-expanded inside \qrcode/\fancyqr, the spaces
    # are lost because they were tokenized at \def-time with catcode 10.
    # Fix: define the macro inside a group that sets space catcode to 12
    # (other) so spaces are preserved as character tokens in the macro body.
    # fancyqr is a drop-in replacement for qrcode with identical payload
    # handling but allows styling (see cartao.tex).
    helper = Path(__file__).parent / "pix_payload.tex"
    tex_body = (
        "\\begingroup\n"
        "\\catcode`\\ =12\\relax\n"
        "\\gdef\\pixpayload{" + payload + "}%\n"
        "\\gdef\\drawpixqr{\\fancyqr[height=5.5cm,level=H,"
        "color=pixdark]{" + payload + "}}%\n"
        "\\endgroup\n"
    )
    helper.write_text(tex_body, encoding="ascii")
    return 0


if __name__ == "__main__":
    sys.exit(main())
