"""TDD for pix_emv.py — PIX EMV static payload generator (BCB MPD 02.01.00)."""

import sys
import unittest
from pathlib import Path

# Allow import from ../scripts
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

import pix_emv  # noqa: E402


class TestCRC16(unittest.TestCase):
    """CRC16-CCITT-FALSE: poly=0x1021, init=0xFFFF, no reflect, xorout=0x0000."""

    def test_crc16_empty_string(self):
        self.assertEqual(pix_emv.crc16_ccitt(b""), 0xFFFF)

    def test_crc16_known_vector_123456789(self):
        # Standard CRC16-CCITT-FALSE test vector.
        self.assertEqual(pix_emv.crc16_ccitt(b"123456789"), 0x29B1)

    def test_crc16_returns_int_in_range(self):
        result = pix_emv.crc16_ccitt(b"hello")
        self.assertIsInstance(result, int)
        self.assertTrue(0 <= result <= 0xFFFF)


class TestTLV(unittest.TestCase):
    """TLV encoding: ID (2 chars) + Length (2 chars, zero-padded) + Value."""

    def test_tlv_simple(self):
        self.assertEqual(pix_emv.tlv("00", "01"), "000201")

    def test_tlv_pads_length(self):
        self.assertEqual(pix_emv.tlv("52", "0000"), "52040000")

    def test_tlv_long_value(self):
        val = "A" * 25
        result = pix_emv.tlv("59", val)
        self.assertTrue(result.startswith("5925"))
        self.assertEqual(len(result), 2 + 2 + 25)


class TestPayload(unittest.TestCase):
    """End-to-end payload generation for R. Amaral Turismo."""

    def setUp(self):
        self.payload = pix_emv.build_payload(
            pix_key="33876985000172",
            merchant_name="R AMARAL TURISMO",
            merchant_city="TIJUCAS",
            txid="***",
        )

    def test_payload_starts_with_format_indicator(self):
        # ID 00, len 02, value 01 (Payload Format Indicator MPD 02.01)
        self.assertTrue(self.payload.startswith("000201"))

    def test_payload_contains_pix_key(self):
        self.assertIn("33876985000172", self.payload)

    def test_payload_contains_bcb_gui(self):
        # Required GUI value for PIX (uppercase per BCB MPD 02.01.00).
        self.assertIn("BR.GOV.BCB.PIX", self.payload)

    def test_payload_contains_merchant_name(self):
        self.assertIn("R AMARAL TURISMO", self.payload)

    def test_payload_contains_merchant_city(self):
        self.assertIn("TIJUCAS", self.payload)

    def test_payload_contains_country_br(self):
        # ID 58 len 02 value BR
        self.assertIn("5802BR", self.payload)

    def test_payload_contains_currency_brl(self):
        # ID 53 len 03 value 986 (BRL ISO 4217)
        self.assertIn("5303986", self.payload)

    def test_payload_includes_62_when_txid_is_placeholder(self):
        # txid "***" -> field 62 present with "***" as Reference Label.
        # BCB requires field 62 even for static payloads (post-2022 bank apps
        # reject QR codes without it).
        self.assertIn("62070503***", self.payload)

    def test_payload_includes_62_when_txid_is_real(self):
        p = pix_emv.build_payload(
            "33876985000172", "R AMARAL TURISMO", "TIJUCAS", "AB123"
        )
        self.assertIn("62090505AB123", p)

    def test_payload_ends_with_valid_crc(self):
        # Last 8 chars: "6304" + 4 hex uppercase
        self.assertEqual(self.payload[-8:-4], "6304")
        crc_hex = self.payload[-4:]
        self.assertEqual(len(crc_hex), 4)
        self.assertTrue(all(c in "0123456789ABCDEF" for c in crc_hex))

    def test_payload_crc_roundtrip(self):
        # Recompute CRC on everything up to and including "6304" prefix;
        # must match the trailing 4 chars.
        body = self.payload[:-4]
        expected = pix_emv.crc16_ccitt(body.encode("ascii"))
        self.assertEqual(self.payload[-4:], f"{expected:04X}")

    def test_payload_ascii_only(self):
        # EMV payload must be ASCII-safe for the QR.
        self.payload.encode("ascii")

    def test_payload_length_reasonable(self):
        # Sanity: static payload for CNPJ typically 100–180 chars.
        self.assertTrue(80 <= len(self.payload) <= 250)


class TestPayloadDeterminism(unittest.TestCase):
    def test_same_inputs_same_output(self):
        a = pix_emv.build_payload("33876985000172", "R AMARAL TURISMO", "TIJUCAS", "***")
        b = pix_emv.build_payload("33876985000172", "R AMARAL TURISMO", "TIJUCAS", "***")
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
