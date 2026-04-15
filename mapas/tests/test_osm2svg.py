"""TDD baseline for osm2svg.py — runs against new subproject layout.

Tests assume osm2svg lives at scripts/osm2svg.py within projects/turismo/mapas/.
Before the migration (git mv), these tests RED with ImportError or path mismatch.
After migration + OUT_DIR adjustment, they go GREEN.
"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


class TestOsm2svgModule(unittest.TestCase):
    def test_module_importable(self):
        from scripts import osm2svg  # noqa: F401

    def test_bbox_str_full(self):
        from scripts.osm2svg import bbox_str
        self.assertEqual(bbox_str("full"), "-35.2,-59.0,-22.0,-47.5")

    def test_bbox_str_sc(self):
        from scripts.osm2svg import bbox_str
        self.assertEqual(bbox_str("sc"), "-29.5,-53.8,-25.9,-48.3")

    def test_bboxes_has_expected_regions(self):
        from scripts.osm2svg import BBOXES
        for name in ("full", "sc", "rs", "pr", "sc_pr", "rs_sc", "coast", "foz"):
            self.assertIn(name, BBOXES)

    def test_out_dir_resolves_to_project_output(self):
        """After migration OUT_DIR must point to <mapas>/output, not <turismo>/assets."""
        from scripts.osm2svg import OUT_DIR
        self.assertEqual(OUT_DIR.name, "output")
        self.assertTrue(
            str(OUT_DIR).endswith("mapas/output"),
            f"OUT_DIR={OUT_DIR} still points to old turismo/assets path",
        )

    def test_cache_dir_inside_mapas(self):
        from scripts.osm2svg import CACHE_DIR
        self.assertEqual(CACHE_DIR.name, ".osm-cache")
        self.assertIn("mapas", str(CACHE_DIR))


if __name__ == "__main__":
    unittest.main()
