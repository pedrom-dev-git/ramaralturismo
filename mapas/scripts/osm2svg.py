#!/usr/bin/env python3
"""
Gera SVGs de mapa do Sul do Brasil a partir do OpenStreetMap (Overpass API).
Sem dependências externas — usa apenas stdlib do Python.
Dados são cacheados em .osm-cache/ para não re-baixar.

Uso:
  python3 scripts/osm2svg.py                  # gera 1 SVG de teste
  python3 scripts/osm2svg.py --all            # gera todas as 30 variações
  python3 scripts/osm2svg.py --refresh        # re-baixa dados do OSM
"""

import json
import math
import os
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / ".osm-cache"
OUT_DIR = ROOT / "output"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# ─── Bounding boxes ──────────────────────────────────────────
BBOXES = {
    "full":    (-35.2, -59.0, -22.0, -47.5),
    "sc":      (-29.5, -53.8, -25.9, -48.3),
    "rs":      (-33.8, -57.7, -27.0, -49.5),
    "pr":      (-26.8, -54.8, -22.5, -48.0),
    "sc_pr":   (-29.5, -54.8, -22.5, -48.0),
    "rs_sc":   (-33.8, -57.7, -25.9, -48.0),
    "coast":   (-29.5, -50.0, -25.5, -48.0),
    "foz":     (-26.0, -55.5, -24.5, -53.5),
}

# ─── Overpass queries ─────────────────────────────────────────
def bbox_str(name="full"):
    s, w, n, e = BBOXES[name]
    return f"{s},{w},{n},{e}"

QUERIES = {
    "states": """
[out:json][timeout:120][maxsize:50000000];
(
  relation["admin_level"="4"]["name"="Santa Catarina"];
  relation["admin_level"="4"]["name"="Paraná"];
  relation["admin_level"="4"]["name"="Rio Grande do Sul"];
);
(._;>;);
out skel qt;
""",
    "countries": """
[out:json][timeout:120][maxsize:50000000];
(
  relation["admin_level"="2"]["name"="Brasil"];
  relation["admin_level"="2"]["name"="Argentina"];
  relation["admin_level"="2"]["name"="Paraguay"];
  relation["admin_level"="2"]["name"="Uruguay"];
);
(._;>;);
out skel qt;
""",
    "rivers_major": """
[out:json][timeout:90];
(
  relation["waterway"="river"]["name"~"Paraná|Uruguai|Uruguay|Iguaçu|Iguazu|Itajaí|Jacuí|Guaíba|Tibagi|Ivaí|Paranapanema|Negro|Canoas|Pelotas|Chapecó|Peixe|Ijuí|Taquari|Camaquã"]({bbox});
  way["waterway"="river"]["name"~"Paraná|Uruguai|Uruguay|Iguaçu|Iguazu|Itajaí|Jacuí|Guaíba|Tibagi|Ivaí|Paranapanema|Negro|Canoas|Pelotas|Chapecó|Peixe|Ijuí|Taquari|Camaquã"]({bbox});
);
out body; >; out skel qt;
""",
    "rivers_secondary": """
[out:json][timeout:90];
way["waterway"="river"]({bbox});
out body; >; out skel qt;
""",
    "highways_major": """
[out:json][timeout:60];
way["highway"~"motorway|trunk"]({bbox});
out body; >; out skel qt;
""",
    "highways_primary": """
[out:json][timeout:60];
way["highway"="primary"]({bbox});
out body; >; out skel qt;
""",
    "highways_secondary": """
[out:json][timeout:90];
way["highway"="secondary"]({bbox});
out body; >; out skel qt;
""",
    "coastline": """
[out:json][timeout:120];
way["natural"="coastline"]({bbox});
out body qt; >; out body qt;
""",
    "water_areas": """
[out:json][timeout:120][maxsize:50000000];
(
  way["natural"="water"]({bbox});
  relation["natural"="water"]({bbox});
);
out body; >; out skel qt;
""",
    "railways": """
[out:json][timeout:90];
way["railway"="rail"]({bbox});
out body; >; out skel qt;
""",
    "rivers_secondary": """
[out:json][timeout:120][maxsize:50000000];
way["waterway"="river"]({bbox});
out body; >; out skel qt;
""",
    "highways_secondary": """
[out:json][timeout:120][maxsize:50000000];
way["highway"="secondary"]({bbox});
out body; >; out skel qt;
""",
}


def fetch_overpass(query_key, bbox_name="full", retries=3):
    """Fetch data from Overpass API, with file cache and retry."""
    cache_file = CACHE_DIR / f"{query_key}_{bbox_name}.json"
    if cache_file.exists():
        print(f"  [cache] {query_key} ({bbox_name})")
        with open(cache_file) as f:
            return json.load(f)

    query = QUERIES[query_key].replace("{bbox}", bbox_str(bbox_name))

    for attempt in range(1, retries + 1):
        print(f"  [fetch] {query_key} ({bbox_name}) tentativa {attempt}/{retries}...", end="", flush=True)
        data = urllib.parse.urlencode({"data": query}).encode()
        req = urllib.request.Request(OVERPASS_URL, data=data)
        req.add_header("User-Agent", "ramaral-map-gen/1.0")

        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                # Read in chunks to avoid IncompleteRead
                chunks = []
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    chunks.append(chunk)
                raw = b"".join(chunks)
            result = json.loads(raw.decode())
            n = len(result.get("elements", []))
            print(f" OK ({n} elements, {len(raw)//1024} KB)")
            with open(cache_file, "w") as f:
                json.dump(result, f)
            return result
        except Exception as e:
            print(f" ERRO: {e}")
            if attempt < retries:
                wait = attempt * 5
                print(f"         aguardando {wait}s antes de retry...")
                time.sleep(wait)

    print(f"  [FALHA] {query_key} — usando dados vazios")
    return {"elements": []}


def merge_osm(a, b):
    """Merge two OSM JSON responses, deduplicating by element id+type."""
    seen = set()
    merged = []
    for el in a.get("elements", []) + b.get("elements", []):
        key = (el.get("type"), el.get("id"))
        if key not in seen:
            seen.add(key)
            merged.append(el)
    return {"elements": merged}


def fetch_split(query_key, bbox_name="full"):
    """Fetch a large query by splitting bbox into north/south halves."""
    s, w, n, e = BBOXES[bbox_name]
    mid = (s + n) / 2

    # Create temp bboxes
    BBOXES["_north"] = (mid, w, n, e)
    BBOXES["_south"] = (s, w, mid, e)

    print(f"  [split] {query_key} em norte + sul...")
    north = fetch_overpass(query_key, "_north")
    time.sleep(3)
    south = fetch_overpass(query_key, "_south")

    # Clean up temp bboxes
    del BBOXES["_north"]
    del BBOXES["_south"]

    merged = merge_osm(north, south)
    # Cache the merged result
    cache_file = CACHE_DIR / f"{query_key}_{bbox_name}.json"
    with open(cache_file, "w") as f:
        json.dump(merged, f)
    print(f"  [merged] {query_key}: {len(merged['elements'])} elements")
    return merged


# ─── GeoJSON sources (land-only boundaries) ─────────────────
GEOJSON_URLS = {
    "br_states": "https://raw.githubusercontent.com/giuliano-macedo/geodata-br-states/main/geojson/br_states.json",
    "ne_countries": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
}


def fetch_geojson(name, retries=3):
    """Fetch GeoJSON data with file cache."""
    cache_file = CACHE_DIR / f"{name}.geojson"
    if cache_file.exists():
        print(f"  [cache] {name} (geojson)")
        with open(cache_file) as f:
            return json.load(f)

    url = GEOJSON_URLS[name]
    for attempt in range(1, retries + 1):
        print(f"  [fetch] {name} tentativa {attempt}/{retries}...", end="", flush=True)
        req = urllib.request.Request(url)
        req.add_header("User-Agent", "ramaral-map-gen/1.0")
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                chunks = []
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    chunks.append(chunk)
                raw = b"".join(chunks)
            result = json.loads(raw.decode())
            n = len(result.get("features", []))
            print(f" OK ({n} features, {len(raw)//1024} KB)")
            with open(cache_file, "w") as f:
                json.dump(result, f)
            return result
        except Exception as e:
            print(f" ERRO: {e}")
            if attempt < retries:
                time.sleep(3)

    print(f"  [FALHA] {name}")
    return {"type": "FeatureCollection", "features": []}


def extract_geojson_polys(geojson_data, bbox, name_filter=None, name_key="NAME"):
    """Extract polygon coordinate rings from GeoJSON features.
    Returns list of {coords: [(lat,lon),...], name: str}."""
    s, w, n, e = bbox
    results = []

    for feature in geojson_data.get("features", []):
        props = feature.get("properties", {})
        name = props.get(name_key, "") or props.get("name", "") or props.get("Estado", "")

        if name_filter and name not in name_filter:
            continue

        geom = feature.get("geometry", {})
        geom_type = geom.get("type", "")
        coord_sets = []

        if geom_type == "Polygon":
            coord_sets = geom.get("coordinates", [])
        elif geom_type == "MultiPolygon":
            for poly in geom.get("coordinates", []):
                coord_sets.extend(poly)

        for ring in coord_sets:
            # GeoJSON is [lon, lat], convert to (lat, lon)
            coords = [(pt[1], pt[0]) for pt in ring]
            # Check if any point is within bbox
            if any(s <= lat <= n and w <= lon <= e for lat, lon in coords):
                results.append({"coords": coords, "name": name})

    return results


def fetch_all(bbox_name="full", refresh=False):
    """Fetch all layers. Returns dict of layer_name -> data."""
    CACHE_DIR.mkdir(exist_ok=True)
    if refresh:
        for f in CACHE_DIR.glob("*.json"):
            f.unlink()
        for f in CACHE_DIR.glob("*.geojson"):
            f.unlink()

    layers = {}

    # GeoJSON sources (land-only boundaries)
    layers["br_states"] = fetch_geojson("br_states")
    layers["ne_countries"] = fetch_geojson("ne_countries")

    # OSM fetches (rivers, roads, railways — no maritime issue)
    simple = [
        ("rivers_major", bbox_name),
        ("rivers_secondary", bbox_name),
        ("coastline", bbox_name),
        ("railways", bbox_name),
    ]
    for i, (key, bb) in enumerate(simple):
        layers[key] = fetch_overpass(key, bb)
        if i < len(simple) - 1:
            time.sleep(1.5)

    # Large fetches — split if not cached
    for key in ["highways_major", "highways_primary", "highways_secondary", "water_areas"]:
        cache_file = CACHE_DIR / f"{key}_{bbox_name}.json"
        if cache_file.exists():
            size = cache_file.stat().st_size
            if size > 500:
                print(f"  [cache] {key} ({bbox_name})")
                with open(cache_file) as f:
                    layers[key] = json.load(f)
                continue
            else:
                cache_file.unlink()

        if "--skip-fetch" in sys.argv:
            print(f"  [skip] {key} (--skip-fetch)")
            layers[key] = {"elements": []}
            continue

        layers[key] = fetch_split(key, bbox_name)
        time.sleep(3)

    return layers


# ─── OSM data → polylines ────────────────────────────────────
def extract_ways(osm_data):
    """Extract polylines from OSM JSON response."""
    nodes = {}
    ways = []
    relations = []

    for el in osm_data.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lat"], el["lon"])
        elif el["type"] == "way":
            ways.append(el)
        elif el["type"] == "relation":
            relations.append(el)

    polylines = []
    way_map = {w["id"]: w for w in ways}

    # Direct ways
    for way in ways:
        coords = [nodes[nid] for nid in way.get("nodes", []) if nid in nodes]
        if len(coords) >= 2:
            polylines.append({
                "coords": coords,
                "tags": way.get("tags", {}),
                "id": way["id"],
            })

    # Ways from relations
    for rel in relations:
        for member in rel.get("members", []):
            if member["type"] == "way" and member["ref"] in way_map:
                w = way_map[member["ref"]]
                coords = [nodes[nid] for nid in w.get("nodes", []) if nid in nodes]
                if len(coords) >= 2:
                    polylines.append({
                        "coords": coords,
                        "tags": {**rel.get("tags", {}), **w.get("tags", {})},
                        "id": w["id"],
                        "role": member.get("role", ""),
                    })

    return polylines


def extract_polygons(osm_data):
    """Assemble relation ways into closed polygon rings."""
    nodes = {}
    ways_raw = []
    relations = []

    for el in osm_data.get("elements", []):
        if el["type"] == "node":
            nodes[el["id"]] = (el["lat"], el["lon"])
        elif el["type"] == "way":
            ways_raw.append(el)
        elif el["type"] == "relation":
            relations.append(el)

    way_map = {w["id"]: w for w in ways_raw}
    polygons = []

    for rel in relations:
        # Collect outer role ways
        outer_ways = []
        for member in rel.get("members", []):
            if member["type"] == "way" and member.get("role", "") in ("outer", "") and member["ref"] in way_map:
                w = way_map[member["ref"]]
                coords = [nodes[nid] for nid in w.get("nodes", []) if nid in nodes]
                if len(coords) >= 2:
                    outer_ways.append(coords)

        # Chain ways end-to-end into rings
        rings = _chain_ways(outer_ways)
        for ring in rings:
            if len(ring) >= 3:
                polygons.append({
                    "coords": ring,
                    "tags": rel.get("tags", {}),
                    "name": rel.get("tags", {}).get("name", ""),
                })

    return polygons


def _chain_ways(way_list):
    """Chain way segments end-to-end into closed rings."""
    if not way_list:
        return []

    remaining = [list(w) for w in way_list]
    rings = []

    while remaining:
        chain = remaining.pop(0)
        changed = True
        while changed:
            changed = False
            for i, seg in enumerate(remaining):
                # Try to connect seg to end of chain
                if _coords_close(chain[-1], seg[0]):
                    chain.extend(seg[1:])
                    remaining.pop(i)
                    changed = True
                    break
                elif _coords_close(chain[-1], seg[-1]):
                    chain.extend(reversed(seg[:-1]))
                    remaining.pop(i)
                    changed = True
                    break
                elif _coords_close(chain[0], seg[-1]):
                    chain = seg[:-1] + chain
                    remaining.pop(i)
                    changed = True
                    break
                elif _coords_close(chain[0], seg[0]):
                    chain = list(reversed(seg[1:])) + chain
                    remaining.pop(i)
                    changed = True
                    break
        rings.append(chain)

    return rings


def _coords_close(a, b, tol=0.001):
    """Check if two lat/lon coords are approximately equal."""
    return abs(a[0] - b[0]) < tol and abs(a[1] - b[1]) < tol


def polygon_to_path(coords, proj, tolerance=1.0):
    """Convert polygon coords to a closed SVG path."""
    projected = [proj(lat, lon) for lat, lon in coords]
    simplified = simplify(projected, tolerance)
    if len(simplified) < 3:
        return ""
    return "M" + "L".join(f"{p[0]},{p[1]}" for p in simplified) + "Z"


def build_coast_lookup(coastline_data, lat_step=0.1):
    """Build a lookup: for each latitude band, the easternmost coast longitude.
    Points east of this are in the ocean."""
    coast_lons = {}  # lat_band -> max_lon (easternmost coast point)
    ways = extract_ways(coastline_data)
    for way in ways:
        for lat, lon in way["coords"]:
            band = round(lat / lat_step) * lat_step
            # Coast is on the east side — we want the easternmost point per band
            if band not in coast_lons or lon > coast_lons[band]:
                coast_lons[band] = lon
    return coast_lons, lat_step


def is_on_land(lat, lon, coast_lons, lat_step, margin=0.05):
    """Check if a point is on land (west of coastline)."""
    band = round(lat / lat_step) * lat_step
    if band not in coast_lons:
        # No coast data for this latitude — assume land (interior)
        return True
    return lon < coast_lons[band] + margin


def filter_land_segments(coords, coast_lons, lat_step):
    """Split a polygon/polyline into segments that are on land only."""
    segments = []
    current = []
    for lat, lon in coords:
        if is_on_land(lat, lon, coast_lons, lat_step):
            current.append((lat, lon))
        else:
            if len(current) >= 2:
                segments.append(current)
            current = []
    if len(current) >= 2:
        segments.append(current)
    return segments


# ─── Projection ──────────────────────────────────────────────
def merc_y(lat):
    rad = math.radians(lat)
    return math.log(math.tan(math.pi / 4 + rad / 2))


def make_projector(bbox, width, height, padding=30):
    s, w, n, e = bbox
    lon_min = math.radians(w)
    lon_max = math.radians(e)
    lon_range = lon_max - lon_min
    merc_top = merc_y(n)
    merc_bot = merc_y(s)
    merc_range = merc_top - merc_bot

    scale_x = (width - 2 * padding) / lon_range
    scale_y = (height - 2 * padding) / merc_range
    scale = min(scale_x, scale_y)

    map_w = lon_range * scale
    map_h = merc_range * scale
    off_x = padding + ((width - 2 * padding) - map_w) / 2
    off_y = padding + ((height - 2 * padding) - map_h) / 2

    def proj(lat, lon):
        px = off_x + (math.radians(lon) - lon_min) * scale
        py = off_y + (merc_top - merc_y(lat)) * scale
        return (round(px, 1), round(py, 1))

    return proj


# ─── Path simplification (Douglas-Peucker) ───────────────────
def _sq_dist(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    if dx != 0 or dy != 0:
        t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)))
        dx, dy = a[0] + t * dx - p[0], a[1] + t * dy - p[1]
    else:
        dx, dy = a[0] - p[0], a[1] - p[1]
    return dx * dx + dy * dy


def simplify(points, tolerance=1.0):
    if len(points) <= 2:
        return points
    max_d, idx = 0, 0
    for i in range(1, len(points) - 1):
        d = _sq_dist(points[i], points[0], points[-1])
        if d > max_d:
            max_d, idx = d, i
    if max_d > tolerance * tolerance:
        left = simplify(points[:idx + 1], tolerance)
        right = simplify(points[idx:], tolerance)
        return left[:-1] + right
    return [points[0], points[-1]]


# ─── SVG generation ──────────────────────────────────────────
def coords_to_path(coords, proj, tolerance=1.0):
    projected = [proj(lat, lon) for lat, lon in coords]
    simplified = simplify(projected, tolerance)
    if len(simplified) < 2:
        return ""
    return "M" + "L".join(f"{p[0]},{p[1]}" for p in simplified)


def in_bbox(coords, bbox):
    s, w, n, e = bbox
    return any(s <= lat <= n and w <= lon <= e for lat, lon in coords)


CAPITALS = [
    ("Florianópolis", -27.5954, -48.5480, "state"),
    ("Porto Alegre", -30.0346, -51.2177, "state"),
    ("Curitiba", -25.4284, -49.2733, "state"),
    ("Buenos Aires", -34.6037, -58.3816, "country"),
    ("Assunção", -25.2637, -57.5759, "country"),
    ("Montevidéu", -34.9011, -56.1645, "country"),
]

CITIES = [
    ("Tijucas", -27.2411, -48.6325),
    ("Joinville", -26.3045, -48.8487),
    ("Blumenau", -26.9194, -49.0661),
    ("Chapecó", -27.1006, -52.6158),
    ("Foz do Iguaçu", -25.5163, -54.5854),
    ("Londrina", -23.3045, -51.1696),
    ("Maringá", -23.4205, -51.9333),
    ("Pelotas", -31.7654, -52.3376),
    ("Caxias do Sul", -29.1681, -51.1794),
    ("B. Camboriú", -26.9906, -48.6352),
    ("Criciúma", -28.6775, -49.3697),
    ("Cascavel", -24.9573, -53.4550),
    ("Ponta Grossa", -25.0916, -50.1668),
    ("Lages", -27.8161, -50.3261),
    ("Passo Fundo", -28.2622, -52.4083),
    ("Santa Maria", -29.6842, -53.8069),
    ("Guarapuava", -25.3935, -51.4620),
    ("Itajaí", -26.9078, -48.6617),
    ("São José", -27.6136, -48.6366),
    ("Paranaguá", -25.5205, -48.5095),
    ("Rio Grande", -32.0350, -52.0986),
    ("Uruguaiana", -29.7547, -57.0883),
    ("Bagé", -31.3289, -54.1069),
    ("Novo Hamburgo", -29.6788, -51.1305),
    ("São Leopoldo", -29.7604, -51.1472),
    ("Canoas", -29.9178, -51.1740),
    ("Gravataí", -29.9447, -50.9919),
    ("Viamão", -30.0811, -51.0233),
    ("Francisco Beltrão", -26.0783, -53.0550),
    ("Toledo", -24.7136, -53.7428),
    ("Umuarama", -23.7664, -53.3250),
    ("Paranavaí", -23.0732, -52.4652),
    ("Campo Mourão", -24.0463, -52.3832),
    ("Tubarão", -28.4747, -49.0067),
    ("São Bento do Sul", -26.2503, -49.3786),
    ("Concórdia", -27.2342, -52.0278),
    ("Xanxerê", -26.8747, -52.4036),
    ("Erechim", -27.6342, -52.2742),
    ("Santo Ângelo", -28.2992, -54.2631),
    ("Ijuí", -28.3878, -53.9147),
    ("Cruz Alta", -28.6386, -53.6064),
    ("Venâncio Aires", -29.6061, -52.1917),
]


def generate_svg(opts, layers):
    bbox_name = opts.get("bbox", "full")
    bbox = BBOXES[bbox_name]
    w = opts.get("width", 1200)
    h = opts.get("height", 1400)
    title = opts.get("title", "")
    bg = opts.get("bg", "none")
    opacity = opts.get("opacity", 1)
    tolerance = opts.get("tolerance", 1.0)

    # Colors
    state_color = opts.get("state_color", "#1a1a2e")
    country_color = opts.get("country_color", "#333355")
    coast_color = opts.get("coast_color", "#2a5a8a")
    river_color = opts.get("river_color", "#4a90d9")
    road_major_color = opts.get("road_major_color", "#777777")
    road_primary_color = opts.get("road_primary_color", "#999999")
    road_secondary_color = opts.get("road_secondary_color", "#bbbbbb")
    capital_color = opts.get("capital_color", "#d62828")
    city_color = opts.get("city_color", "#555555")
    water_color = opts.get("water_color", "#a8d5e8")

    # Stroke widths
    sw = opts.get("stroke_width", 1.0)
    state_sw = opts.get("state_sw", sw * 1.2)
    coast_sw = opts.get("coast_sw", sw * 2.5)
    river_sw = opts.get("river_sw", sw * 0.6)
    road_major_sw = opts.get("road_major_sw", sw * 0.7)
    road_primary_sw = opts.get("road_primary_sw", sw * 0.45)
    road_secondary_sw = opts.get("road_secondary_sw", sw * 0.3)

    # Feature toggles
    show = opts.get("show", {})
    show_states = show.get("states", True)
    show_countries = show.get("countries", True)
    show_coast = show.get("coast", True)
    show_rivers_major = show.get("rivers_major", True)
    show_rivers_secondary = show.get("rivers_secondary", False)
    show_highways_major = show.get("highways_major", True)
    show_highways_primary = show.get("highways_primary", True)
    show_highways_secondary = show.get("highways_secondary", False)
    show_capitals = show.get("capitals", True)
    show_cities = show.get("cities", False)
    show_water = show.get("water_areas", False)
    show_railways = show.get("railways", False)

    # Extra colors/widths
    railway_color = opts.get("railway_color", "#888888")
    railway_sw = opts.get("railway_sw", sw * 0.35)
    river_secondary_color = opts.get("river_secondary_color", river_color)
    river_secondary_sw = opts.get("river_secondary_sw", sw * 0.3)

    proj = make_projector(bbox, w, h)

    lines = []
    lines.append(f'<?xml version="1.0" encoding="UTF-8"?>')
    lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">')
    if title:
        lines.append(f"<!-- {title} -->")
    lines.append(f'<defs><clipPath id="c"><rect width="{w}" height="{h}"/></clipPath></defs>')
    if bg != "none":
        lines.append(f'<rect width="{w}" height="{h}" fill="{bg}"/>')
    lines.append(f'<g opacity="{opacity}" clip-path="url(#c)">')

    # Per-region fill colors (optional)
    country_fills = opts.get("country_fills", {})  # {"Argentina": "#abc", ...}
    state_fills = opts.get("state_fills", {})      # {"Santa Catarina": "#abc", ...}
    default_fill = opts.get("default_fill", "none")
    fill_opacity = opts.get("fill_opacity", 1.0)

    # Countries (Natural Earth GeoJSON — land-only boundaries)
    if show_countries and "ne_countries" in layers:
        country_names = {"Argentina", "Brazil", "Paraguay", "Uruguay"}
        polys = extract_geojson_polys(layers["ne_countries"], bbox, name_filter=country_names, name_key="NAME")
        if polys:
            lines.append(f'<g id="countries" stroke="{country_color}" stroke-width="{state_sw}" stroke-linecap="round">')
            for poly in polys:
                d = polygon_to_path(poly["coords"], proj, tolerance)
                if d:
                    fill = country_fills.get(poly["name"], default_fill)
                    fo = f' fill-opacity="{fill_opacity}"' if fill != "none" and fill_opacity < 1 else ''
                    lines.append(f'  <path d="{d}" fill="{fill}"{fo}/>')
            lines.append("</g>")

    # States (geodata-br-states GeoJSON — land-only)
    if show_states and "br_states" in layers:
        state_names = {"Santa Catarina", "Paraná", "Rio Grande do Sul"}
        polys = extract_geojson_polys(layers["br_states"], bbox, name_filter=state_names, name_key="Estado")
        if polys:
            lines.append(f'<g id="states" stroke="{state_color}" stroke-width="{state_sw}" stroke-linecap="round" stroke-linejoin="round">')
            for poly in polys:
                d = polygon_to_path(poly["coords"], proj, tolerance)
                if d:
                    fill = state_fills.get(poly["name"], default_fill)
                    fo = f' fill-opacity="{fill_opacity}"' if fill != "none" and fill_opacity < 1 else ''
                    lines.append(f'  <path d="{d}" fill="{fill}"{fo}/>')
            lines.append("</g>")

    # Rivers
    if show_rivers_major and "rivers_major" in layers:
        ways = extract_ways(layers["rivers_major"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance)
                if d:
                    paths.append(d)
        if paths:
            op = opts.get("rivers_opacity", 0.7)
            lines.append(f'<g id="rivers" fill="none" stroke="{river_color}" stroke-width="{river_sw}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Major highways (motorway/trunk)
    if show_highways_major and "highways_major" in layers:
        ways = extract_ways(layers["highways_major"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance * 0.8)
                if d:
                    paths.append(d)
        if paths:
            op = opts.get("roads_major_opacity", 1.0)
            lines.append(f'<g id="highways-major" fill="none" stroke="{road_major_color}" stroke-width="{road_major_sw}" stroke-linecap="round" opacity="{op}">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Primary roads
    if show_highways_primary and "highways_primary" in layers:
        ways = extract_ways(layers["highways_primary"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance * 0.8)
                if d:
                    paths.append(d)
        if paths:
            op = opts.get("roads_primary_opacity", 0.6)
            lines.append(f'<g id="highways-primary" fill="none" stroke="{road_primary_color}" stroke-width="{road_primary_sw}" stroke-linecap="round" opacity="{op}">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Secondary roads
    if show_highways_secondary and "highways_secondary" in layers:
        ways = extract_ways(layers["highways_secondary"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance)
                if d:
                    paths.append(d)
        if paths:
            op = opts.get("roads_secondary_opacity", 0.4)
            lines.append(f'<g id="highways-secondary" fill="none" stroke="{road_secondary_color}" stroke-width="{road_secondary_sw}" stroke-linecap="round" opacity="{op}">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Secondary rivers (all waterway=river)
    if show_rivers_secondary and "rivers_secondary" in layers:
        ways = extract_ways(layers["rivers_secondary"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance)
                if d:
                    paths.append(d)
        if paths:
            lines.append(f'<g id="rivers-secondary" fill="none" stroke="{river_secondary_color}" stroke-width="{river_secondary_sw}" stroke-linecap="round" stroke-linejoin="round" opacity="0.4">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Water areas (lakes, lagoons)
    if show_water and "water_areas" in layers:
        ways = extract_ways(layers["water_areas"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance)
                if d:
                    paths.append(d)
        if paths:
            lines.append(f'<g id="water-areas" fill="none" stroke="{water_color}" stroke-width="{sw * 0.5}">')
            for d in paths:
                lines.append(f'  <path d="{d}Z"/>')
            lines.append("</g>")

    # Railways
    if show_railways and "railways" in layers:
        ways = extract_ways(layers["railways"])
        paths = []
        for way in ways:
            if in_bbox(way["coords"], bbox):
                d = coords_to_path(way["coords"], proj, tolerance)
                if d:
                    paths.append(d)
        if paths:
            lines.append(f'<g id="railways" fill="none" stroke="{railway_color}" stroke-width="{railway_sw}" stroke-dasharray="3 2" stroke-linecap="round" opacity="0.5">')
            for d in paths:
                lines.append(f'  <path d="{d}"/>')
            lines.append("</g>")

    # Capitals
    if show_capitals:
        capitals_label = opts.get("capitals_label", False)
        label_size = opts.get("capitals_label_size", 14)
        cap_lines = []
        for name, lat, lon, ctype in CAPITALS:
            s, w_, n, e = bbox
            if s <= lat <= n and w_ <= lon <= e:
                cx, cy = proj(lat, lon)
                if capitals_label:
                    weight = 700 if ctype == "state" else 600
                    size = label_size if ctype == "state" else label_size - 2
                    cap_lines.append(
                        f'  <text x="{cx}" y="{cy}" font-size="{size}" '
                        f'font-weight="{weight}" fill="{capital_color}" '
                        f'text-anchor="middle" dominant-baseline="middle">{name}</text>'
                    )
                else:
                    r = 5 if ctype == "state" else 6
                    cap_lines.append(f'  <circle cx="{cx}" cy="{cy}" r="{r}" fill="{capital_color}"/>')
        if cap_lines:
            lines.append('<g id="capitals" font-family="Inter, Arial, sans-serif">')
            lines.extend(cap_lines)
            lines.append("</g>")

    # Cities (ponto only, sem label)
    if show_cities:
        city_lines = []
        for name, lat, lon in CITIES:
            s, w_, n, e = bbox
            if s <= lat <= n and w_ <= lon <= e:
                cx, cy = proj(lat, lon)
                city_lines.append(f'  <circle cx="{cx}" cy="{cy}" r="2.5" fill="{city_color}"/>')
        if city_lines:
            lines.append('<g id="cities" font-family="Inter, Arial, sans-serif">')
            lines.extend(city_lines)
            lines.append("</g>")

    lines.append("</g>")
    lines.append("</svg>")
    return "\n".join(lines)


# ─── Variations ──────────────────────────────────────────────
def get_variations():
    ALL = {"states": True, "countries": True, "coast": True,
           "rivers_major": True, "rivers_secondary": True,
           "highways_major": True, "highways_primary": True,
           "highways_secondary": True, "railways": True,
           "water_areas": True, "capitals": True}

    return [
        # FULL (10)
        {"file": "01-full-all", "title": "Completo — todas as camadas",
         "show": {**ALL, "cities": True}},
        {"file": "02-full-borders", "title": "Apenas fronteiras + costa",
         "show": {"states": True, "countries": True, "coast": True}},
        {"file": "03-full-rivers", "title": "Apenas rios",
         "show": {"rivers_major": True}, "river_color": "#1a6faa", "stroke_width": 1.5},
        {"file": "04-full-roads", "title": "Apenas rodovias",
         "show": {"highways_major": True, "highways_primary": True},
         "road_major_color": "#444", "stroke_width": 1.5},
        {"file": "05-full-borders-rivers", "title": "Fronteiras + rios",
         "show": {"states": True, "countries": True, "coast": True, "rivers_major": True}},
        {"file": "06-full-borders-roads", "title": "Fronteiras + rodovias",
         "show": {"states": True, "countries": True, "coast": True,
                  "highways_major": True, "highways_primary": True}},
        {"file": "07-full-rivers-roads", "title": "Rios + rodovias",
         "show": {"rivers_major": True, "highways_major": True, "highways_primary": True}},
        {"file": "08-full-capitals", "title": "Capitais + fronteiras + cidades",
         "show": {"states": True, "countries": True, "coast": True,
                  "capitals": True, "cities": True}},
        {"file": "09-full-minimal", "title": "Minimalista — linhas finas",
         "show": {"states": True, "coast": True},
         "stroke_width": 0.4, "state_color": "#ccc", "coast_color": "#aaa"},
        {"file": "10-full-dark", "title": "Dark mode",
         "show": {**ALL}, "bg": "#0a1628",
         "state_color": "#1e3a5f", "country_color": "#1e3a5f",
         "river_color": "#2a5a8a", "road_major_color": "#1a3050",
         "road_primary_color": "#152540", "coast_color": "#2a5a8a",
         "capital_color": "#5a9fd4"},

        # SC (5)
        {"file": "11-sc-all", "title": "SC — completo", "bbox": "sc",
         "height": 1000, "show": {**ALL, "cities": True}},
        {"file": "12-sc-rivers", "title": "SC — rios", "bbox": "sc",
         "height": 1000, "show": {"rivers_major": True, "coast": True},
         "river_color": "#0066aa", "stroke_width": 1.5},
        {"file": "13-sc-roads-cities", "title": "SC — rodovias + cidades", "bbox": "sc",
         "height": 1000, "show": {"highways_major": True, "highways_primary": True,
                                   "capitals": True, "cities": True},
         "stroke_width": 1.5},
        {"file": "14-sc-outline-brand", "title": "SC — contorno brand", "bbox": "sc",
         "height": 1000, "show": {"states": True, "coast": True},
         "state_color": "#0138AD", "coast_color": "#0138AD", "stroke_width": 1.5},
        {"file": "15-sc-all-brand", "title": "SC — completo em azul", "bbox": "sc",
         "height": 1000, "show": {**ALL, "cities": True},
         "state_color": "#0138AD", "coast_color": "#0138AD",
         "river_color": "#3366cc", "road_major_color": "#6699dd",
         "road_primary_color": "#88aadd", "capital_color": "#0138AD",
         "city_color": "#0138AD", "opacity": 0.5},

        # RS (4)
        {"file": "16-rs-all", "title": "RS — completo", "bbox": "rs",
         "show": {**ALL, "cities": True}},
        {"file": "17-rs-rivers", "title": "RS — rios", "bbox": "rs",
         "show": {"rivers_major": True, "coast": True},
         "river_color": "#0055aa", "stroke_width": 1.5},
        {"file": "18-rs-dark", "title": "RS — dark mode", "bbox": "rs",
         "show": {**ALL}, "bg": "#0a0e1a",
         "state_color": "#2a4a7a", "country_color": "#1e3050",
         "river_color": "#2a5a8a", "coast_color": "#2a5a8a",
         "road_major_color": "#1a3050", "road_primary_color": "#152030",
         "capital_color": "#5a9fd4"},
        {"file": "19-rs-brand-red", "title": "RS — brand vermelho", "bbox": "rs",
         "show": {"states": True, "coast": True, "rivers_major": True, "capitals": True},
         "state_color": "#9D0013", "coast_color": "#9D0013",
         "river_color": "#cc3344", "capital_color": "#9D0013", "opacity": 0.35},

        # PR (3)
        {"file": "20-pr-all", "title": "PR — completo", "bbox": "pr",
         "show": {**ALL, "cities": True}},
        {"file": "21-pr-rivers", "title": "PR — rios", "bbox": "pr",
         "show": {"rivers_major": True, "coast": True},
         "river_color": "#0055aa", "stroke_width": 1.5},
        {"file": "22-pr-roads-cities", "title": "PR — rodovias + cidades", "bbox": "pr",
         "show": {"highways_major": True, "highways_primary": True,
                  "capitals": True, "cities": True},
         "stroke_width": 1.5},

        # Regional (4)
        {"file": "23-sc-pr", "title": "SC + PR", "bbox": "sc_pr",
         "height": 1200, "show": {**ALL, "cities": True}},
        {"file": "24-rs-sc", "title": "RS + SC", "bbox": "rs_sc",
         "show": {**ALL}},
        {"file": "25-coast", "title": "Litoral", "bbox": "coast",
         "width": 600, "height": 1400,
         "show": {"coast": True, "highways_major": True, "highways_primary": True,
                  "capitals": True, "cities": True},
         "road_major_color": "#cc3333", "stroke_width": 1.5},
        {"file": "26-foz", "title": "Tríplice fronteira", "bbox": "foz",
         "width": 1000, "height": 900,
         "show": {"states": True, "countries": True, "rivers_major": True,
                  "highways_major": True, "cities": True, "capitals": True},
         "stroke_width": 1.5},

        # Style (4)
        {"file": "27-brand-blue", "title": "Monocromático azul #0138AD",
         "show": {**ALL}, "state_color": "#0138AD", "country_color": "#0138AD",
         "river_color": "#3366cc", "road_major_color": "#6699dd",
         "road_primary_color": "#88aadd", "coast_color": "#0138AD",
         "capital_color": "#0138AD", "opacity": 0.35},
        {"file": "28-brand-red", "title": "Monocromático vermelho #9D0013",
         "show": {"states": True, "countries": True, "coast": True,
                  "rivers_major": True, "capitals": True},
         "state_color": "#9D0013", "country_color": "#9D0013",
         "river_color": "#cc3344", "coast_color": "#9D0013",
         "capital_color": "#9D0013", "opacity": 0.3},
        {"file": "29-white-on-dark", "title": "Branco sobre escuro",
         "show": {**ALL}, "bg": "#0f1523", "state_color": "#ffffff",
         "country_color": "#ffffff", "river_color": "#ffffff",
         "road_major_color": "#ffffff", "road_primary_color": "#ffffff",
         "coast_color": "#ffffff", "capital_color": "#ffffff", "opacity": 0.15},
        {"file": "30-gold-luxury", "title": "Dourado luxury",
         "show": {**ALL}, "bg": "#1a1520", "state_color": "#c9a84c",
         "country_color": "#c9a84c", "river_color": "#c9a84c",
         "road_major_color": "#c9a84c", "road_primary_color": "#c9a84c",
         "coast_color": "#c9a84c", "capital_color": "#c9a84c", "opacity": 0.4},
    ]


# ─── Main ────────────────────────────────────────────────────
def main():
    do_all = "--all" in sys.argv
    refresh = "--refresh" in sys.argv

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=== OSM → SVG Generator ===\n")
    print("Buscando dados do OpenStreetMap...")
    layers = fetch_all("full", refresh=refresh)

    ALL = {
        "states": True, "countries": True, "coast": True,
        "rivers_major": True, "rivers_secondary": True,
        "highways_major": True, "highways_primary": True,
        "highways_secondary": True, "railways": True,
        "water_areas": True, "capitals": True, "cities": False,
    }

    def mono(color, **extra):
        """Helper: all colors set to one value."""
        base = {
            "state_color": color, "country_color": color,
            "coast_color": color, "river_color": color,
            "river_secondary_color": color, "road_major_color": color,
            "road_primary_color": color, "road_secondary_color": color,
            "railway_color": color, "water_color": color,
            "capital_color": color,
        }
        base.update(extra)
        return base

    variations = [
        # 01 — Preto completo (todas as camadas)
        {"file": "01-preto-completo", "title": "Preto — todas camadas",
         "bg": "none", "show": ALL, "stroke_width": 1.0, **mono("#000000")},

        # 02 — Preto minimal (só bordas + rios + capitais)
        {"file": "02-preto-minimal", "title": "Preto — minimal",
         "bg": "none", "stroke_width": 1.2,
         "show": {"states": True, "countries": True, "coast": True,
                  "rivers_major": True, "capitals": True},
         **mono("#000000")},

        # 03 — Preto rios (bordas + todos rios + costa)
        {"file": "03-preto-rios", "title": "Preto — foco nos rios",
         "bg": "none", "stroke_width": 1.0,
         "show": {"states": True, "countries": True, "coast": True,
                  "rivers_major": True, "rivers_secondary": True,
                  "water_areas": True, "capitals": True},
         **mono("#000000")},

        # 04 — Preto estradas (bordas + highways + capitais)
        {"file": "04-preto-estradas", "title": "Preto — foco nas estradas",
         "bg": "none", "stroke_width": 1.0,
         "show": {"states": True, "countries": True, "coast": True,
                  "highways_major": True, "highways_primary": True,
                  "highways_secondary": True, "capitals": True},
         **mono("#000000")},

        # 05 — Preto leve (opacity 0.3)
        {"file": "05-preto-leve", "title": "Preto — opacidade 30%",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "opacity": 0.3, **mono("#000000")},

        # 06 — Preto fino (stroke fino, detalhado)
        {"file": "06-preto-fino", "title": "Preto — traço fino",
         "bg": "none", "show": ALL, "stroke_width": 0.5, **mono("#000000")},

        # 07 — Preto grosso (destaque forte)
        {"file": "07-preto-grosso", "title": "Preto — traço grosso",
         "bg": "none", "stroke_width": 1.8,
         "show": {"states": True, "countries": True, "coast": True,
                  "rivers_major": True, "highways_major": True, "capitals": True},
         **mono("#000000")},

        # 08 — Azul marca (#0138AD)
        {"file": "08-azul-marca", "title": "Azul R. Amaral",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         **mono("#0138AD")},

        # 09 — Vermelho accent (#9D0013)
        {"file": "09-vermelho-accent", "title": "Vermelho accent",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         **mono("#9D0013")},

        # 10 — Azul escuro (#143E58)
        {"file": "10-azul-escuro", "title": "Azul escuro",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         **mono("#143E58")},

        # 11 — Cinza médio sutil
        {"file": "11-cinza-sutil", "title": "Cinza sutil",
         "bg": "none", "show": ALL, "stroke_width": 0.8,
         "opacity": 0.4, **mono("#666666")},

        # 12 — Branco (pra fundo escuro)
        {"file": "12-branco-fundo-escuro", "title": "Branco sobre escuro",
         "bg": "#0f1523", "show": ALL, "stroke_width": 1.0,
         "opacity": 0.2, **mono("#ffffff")},

        # 13 — Dourado luxury
        {"file": "13-dourado", "title": "Dourado luxury",
         "bg": "#1a1520", "show": ALL, "stroke_width": 1.0,
         "opacity": 0.4, **mono("#c9a84c")},

        # 14 — Preto sem capitais (100% pattern)
        {"file": "14-preto-sem-capitais", "title": "Preto — sem capitais",
         "bg": "none", "show": {**ALL, "capitals": False},
         "stroke_width": 1.0, **mono("#000000")},

        # 15 — Preto só bordas e costa
        {"file": "15-preto-so-bordas", "title": "Preto — só bordas",
         "bg": "none", "stroke_width": 1.5,
         "show": {"states": True, "countries": True, "coast": True, "capitals": True},
         **mono("#000000")},

        # ── COLORIDOS ────────────────────────────────────────

        # 16 — Cada estado uma cor (cores da marca)
        {"file": "16-estados-marca", "title": "Estados — cores da marca",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "state_color": "#333333", "country_color": "#333333",
         "coast_color": "#333333", "capital_color": "#000000",
         "river_color": "#333333", "road_major_color": "#333333",
         "road_primary_color": "#333333", "road_secondary_color": "#333333",
         "railway_color": "#333333", "water_color": "#333333",
         "state_fills": {
             "Santa Catarina": "#0138AD",
             "Paraná": "#9D0013",
             "Rio Grande do Sul": "#143E58",
         },
         "country_fills": {
             "Argentina": "#DCF0F7",
             "Paraguay": "#DCF0F7",
             "Uruguay": "#DCF0F7",
             "Brazil": "#F5F5F5",
         },
         "fill_opacity": 0.3},

        # 17 — Pastel suave
        {"file": "17-pastel", "title": "Pastel suave",
         "bg": "none", "show": ALL, "stroke_width": 0.8,
         "state_color": "#888888", "country_color": "#888888",
         "coast_color": "#888888", "capital_color": "#333333",
         "river_color": "#7eafd4", "road_major_color": "#aaaaaa",
         "road_primary_color": "#bbbbbb", "road_secondary_color": "#cccccc",
         "railway_color": "#aaaaaa", "water_color": "#7eafd4",
         "state_fills": {
             "Santa Catarina": "#a8d8ea",
             "Paraná": "#f8c8a8",
             "Rio Grande do Sul": "#c8e6c9",
         },
         "country_fills": {
             "Argentina": "#fff3e0",
             "Paraguay": "#e8f5e9",
             "Uruguay": "#fce4ec",
             "Brazil": "#f5f5f5",
         },
         "fill_opacity": 0.5},

        # 18 — Terroso / Earth tones
        {"file": "18-terroso", "title": "Earth tones",
         "bg": "#faf5ef", "show": ALL, "stroke_width": 1.0,
         "state_color": "#5d4037", "country_color": "#5d4037",
         "coast_color": "#5d4037", "capital_color": "#3e2723",
         "river_color": "#4a90d9", "road_major_color": "#8d6e63",
         "road_primary_color": "#a1887f", "road_secondary_color": "#bcaaa4",
         "railway_color": "#8d6e63", "water_color": "#4a90d9",
         "state_fills": {
             "Santa Catarina": "#c8b896",
             "Paraná": "#a0926b",
             "Rio Grande do Sul": "#d4c5a0",
         },
         "country_fills": {
             "Argentina": "#e8dcc8",
             "Paraguay": "#ddd0b4",
             "Uruguay": "#e0d5c0",
             "Brazil": "#f0e8d8",
         },
         "fill_opacity": 0.6},

        # 19 — Azul oceânico (estados em tons de azul)
        {"file": "19-oceanico", "title": "Azul oceânico",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "state_color": "#1a3a5c", "country_color": "#1a3a5c",
         "coast_color": "#1a3a5c", "capital_color": "#0d2137",
         "river_color": "#2980b9", "road_major_color": "#34495e",
         "road_primary_color": "#4a6b8a", "road_secondary_color": "#6a8da8",
         "railway_color": "#34495e", "water_color": "#2980b9",
         "state_fills": {
             "Santa Catarina": "#1565c0",
             "Paraná": "#0d47a1",
             "Rio Grande do Sul": "#1976d2",
         },
         "country_fills": {
             "Argentina": "#bbdefb",
             "Paraguay": "#c8e6f8",
             "Uruguay": "#b3d4f0",
             "Brazil": "#e3f2fd",
         },
         "fill_opacity": 0.35},

        # 20 — Verde natureza
        {"file": "20-verde-natureza", "title": "Verde natureza",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "state_color": "#2e7d32", "country_color": "#2e7d32",
         "coast_color": "#2e7d32", "capital_color": "#1b5e20",
         "river_color": "#1976d2", "road_major_color": "#5d4037",
         "road_primary_color": "#795548", "road_secondary_color": "#8d6e63",
         "railway_color": "#5d4037", "water_color": "#1976d2",
         "state_fills": {
             "Santa Catarina": "#43a047",
             "Paraná": "#2e7d32",
             "Rio Grande do Sul": "#66bb6a",
         },
         "country_fills": {
             "Argentina": "#e8f5e9",
             "Paraguay": "#c8e6c9",
             "Uruguay": "#dcedc8",
             "Brazil": "#f1f8e9",
         },
         "fill_opacity": 0.35},

        # 21 — Bandeira do Brasil (verde/amarelo/azul)
        {"file": "21-bandeira-brasil", "title": "Cores da bandeira",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "state_color": "#1b5e20", "country_color": "#666666",
         "coast_color": "#1b5e20", "capital_color": "#0d47a1",
         "river_color": "#1565c0", "road_major_color": "#666666",
         "road_primary_color": "#888888", "road_secondary_color": "#aaaaaa",
         "railway_color": "#666666", "water_color": "#1565c0",
         "state_fills": {
             "Santa Catarina": "#009c3b",
             "Paraná": "#ffdf00",
             "Rio Grande do Sul": "#002776",
         },
         "country_fills": {
             "Argentina": "#f5f5f5",
             "Paraguay": "#f5f5f5",
             "Uruguay": "#f5f5f5",
             "Brazil": "#f5f5f5",
         },
         "fill_opacity": 0.4},

        # 22 — Quente / warm sunset
        {"file": "22-sunset", "title": "Sunset quente",
         "bg": "none", "show": ALL, "stroke_width": 1.0,
         "state_color": "#b71c1c", "country_color": "#4e342e",
         "coast_color": "#b71c1c", "capital_color": "#880e0e",
         "river_color": "#e65100", "road_major_color": "#6d4c41",
         "road_primary_color": "#8d6e63", "road_secondary_color": "#a1887f",
         "railway_color": "#6d4c41", "water_color": "#e65100",
         "state_fills": {
             "Santa Catarina": "#ff7043",
             "Paraná": "#ef5350",
             "Rio Grande do Sul": "#ffab40",
         },
         "country_fills": {
             "Argentina": "#fff8e1",
             "Paraguay": "#fff3e0",
             "Uruguay": "#fbe9e7",
             "Brazil": "#fafafa",
         },
         "fill_opacity": 0.35},

        # 23 — Roxo elegante
        {"file": "23-roxo-elegante", "title": "Roxo elegante",
         "bg": "#1a1025", "show": ALL, "stroke_width": 1.0,
         "state_color": "#ce93d8", "country_color": "#7e57c2",
         "coast_color": "#ce93d8", "capital_color": "#e1bee7",
         "river_color": "#7c4dff", "road_major_color": "#9575cd",
         "road_primary_color": "#7e57c2", "road_secondary_color": "#673ab7",
         "railway_color": "#7e57c2", "water_color": "#7c4dff",
         "state_fills": {
             "Santa Catarina": "#7b1fa2",
             "Paraná": "#6a1b9a",
             "Rio Grande do Sul": "#9c27b0",
         },
         "country_fills": {
             "Argentina": "#2a1535",
             "Paraguay": "#251030",
             "Uruguay": "#2d1838",
             "Brazil": "#1f0d28",
         },
         "fill_opacity": 0.4},

        # 24 — Alto contraste (fundo escuro, estados vivos)
        {"file": "24-alto-contraste", "title": "Alto contraste",
         "bg": "#111111", "show": ALL, "stroke_width": 1.2,
         "state_color": "#ffffff", "country_color": "#555555",
         "coast_color": "#ffffff", "capital_color": "#ff5252",
         "river_color": "#448aff", "road_major_color": "#666666",
         "road_primary_color": "#555555", "road_secondary_color": "#444444",
         "railway_color": "#555555", "water_color": "#448aff",
         "state_fills": {
             "Santa Catarina": "#00e676",
             "Paraná": "#ffea00",
             "Rio Grande do Sul": "#00b0ff",
         },
         "country_fills": {
             "Argentina": "#1a1a1a",
             "Paraguay": "#1e1e1e",
             "Uruguay": "#1c1c1c",
             "Brazil": "#161616",
         },
         "fill_opacity": 0.3},

        # 25 — Só preenchimento (sem linhas internas, clean)
        {"file": "25-clean-fill", "title": "Clean fill — sem detalhes",
         "bg": "none", "stroke_width": 1.5,
         "show": {"states": True, "countries": True, "coast": True, "capitals": True},
         "state_color": "#333333", "country_color": "#333333",
         "coast_color": "#333333", "capital_color": "#000000",
         "river_color": "#333333", "road_major_color": "#333333",
         "road_primary_color": "#333333", "road_secondary_color": "#333333",
         "railway_color": "#333333", "water_color": "#333333",
         "state_fills": {
             "Santa Catarina": "#0138AD",
             "Paraná": "#9D0013",
             "Rio Grande do Sul": "#143E58",
         },
         "country_fills": {
             "Argentina": "#E8E8E8",
             "Paraguay": "#D8D8D8",
             "Uruguay": "#E0E0E0",
             "Brazil": "#F0F0F0",
         },
         "fill_opacity": 0.5},

        # 26 — Preto bordas grossas (só contornos, traço pesado, paths simplificados)
        {"file": "26-preto-bordas-grossas", "title": "Preto — bordas grossas sem detalhes",
         "bg": "none", "stroke_width": 3.0, "tolerance": 3.0,
         "show": {"states": True, "countries": True, "coast": True},
         **mono("#000000")},

        # 27 — Preto clean (menos detalhes, traço médio, estados + costa)
        {"file": "27-preto-clean", "title": "Preto — clean, traço médio",
         "bg": "none", "stroke_width": 2.0, "tolerance": 5.0,
         "show": {"states": True, "coast": True},
         **mono("#000000")},

        # 28 — Preto bordas + capitais como label (sem ponto)
        {"file": "28-preto-capitais-label", "title": "Preto — bordas + capitais sem ponto",
         "bg": "none", "stroke_width": 2.5, "tolerance": 3.5,
         "show": {"states": True, "countries": True, "coast": True, "capitals": True},
         "capitals_label": True, "capitals_label_size": 18,
         **mono("#000000")},

        # 29 — Preto hairline (traço fino, bastante simplificado, capitais label)
        {"file": "29-preto-hairline-capitais", "title": "Preto — hairline + capitais label",
         "bg": "none", "stroke_width": 1.2, "tolerance": 4.0,
         "show": {"states": True, "countries": True, "coast": True, "capitals": True},
         "capitals_label": True, "capitals_label_size": 14,
         **mono("#000000")},

        # 30 — Preto só estados (ultra clean, traço grosso, máximo simplificado)
        {"file": "30-preto-so-estados", "title": "Preto — só estados, ultra clean",
         "bg": "none", "stroke_width": 3.5, "tolerance": 7.0,
         "show": {"states": True},
         **mono("#000000")},

        # 31 — Preto capitais label (só silhueta sulina + capitais)
        {"file": "31-preto-silhueta-capitais", "title": "Preto — silhueta + capitais",
         "bg": "none", "stroke_width": 2.2, "tolerance": 5.5,
         "show": {"states": True, "coast": True, "capitals": True},
         "capitals_label": True, "capitals_label_size": 16,
         **mono("#000000")},

        # 32 — Preto estados grossos + rios/estradas no meio-termo (sem capitais)
        {"file": "32-preto-estados-detalhes-finos", "title": "Preto — estados grossos + detalhes meio-termo",
         "bg": "none", "stroke_width": 3.5, "tolerance": 7.0,
         "show": {"states": True, "rivers_major": True,
                  "highways_major": True, "highways_primary": True,
                  "capitals": False},
         # Detalhes visíveis mas discretos
         "river_sw": 0.7, "rivers_opacity": 0.55,
         "road_major_sw": 0.75, "roads_major_opacity": 0.5,
         "road_primary_sw": 0.5, "roads_primary_opacity": 0.4,
         **mono("#000000")},

        # 33 — Variante de 32 com rios só (sem rodovias)
        {"file": "33-preto-estados-rios-finos", "title": "Preto — estados grossos + rios meio-termo",
         "bg": "none", "stroke_width": 3.5, "tolerance": 7.0,
         "show": {"states": True, "rivers_major": True, "capitals": False},
         "river_sw": 0.75, "rivers_opacity": 0.55,
         **mono("#000000")},
    ]

    # --only=27,28 filtra por prefixo numérico ou substring do file
    only = None
    for arg in sys.argv[1:]:
        if arg.startswith("--only="):
            only = [x.strip() for x in arg.split("=", 1)[1].split(",") if x.strip()]
    if only:
        variations = [v for v in variations
                      if any(tok in v["file"] or v["file"].startswith(tok + "-") for tok in only)]

    print(f"\nGerando {len(variations)} variações...")
    for v in variations:
        svg = generate_svg(v, layers)
        out = OUT_DIR / f"{v['file']}.svg"
        out.write_text(svg)
        size = len(svg) / 1024
        print(f"  ✓ {out.name} ({size:.0f} KB)")

    print(f"\nSalvos em: {OUT_DIR}")


if __name__ == "__main__":
    main()
