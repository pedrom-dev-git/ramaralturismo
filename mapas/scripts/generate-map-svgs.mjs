#!/usr/bin/env node
/**
 * Gera 30 variações de SVG estilo FINGERPRINT / topográfico
 * do Sul do Brasil + países vizinhos.
 * Linhas densas, orgânicas, efeito impressão digital.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'images', 'map-patterns');

// ─── Simplex-like noise ──────────────────────────────────────
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function createNoise(seed = 42) {
  const rng = seededRandom(seed);
  const perm = Array.from({ length: 512 }, () => Math.floor(rng() * 256));
  const grad = Array.from({ length: 256 }, () => {
    const a = rng() * Math.PI * 2;
    return [Math.cos(a), Math.sin(a)];
  });

  return function noise2D(x, y) {
    const xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);

    const aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];

    const dot = (g, dx, dy) => (grad[g & 255][0] * dx + grad[g & 255][1] * dy);

    const x1 = dot(aa, xf, yf) * (1 - u) + dot(ba, xf - 1, yf) * u;
    const x2 = dot(ab, xf, yf - 1) * (1 - u) + dot(bb, xf - 1, yf - 1) * u;
    return x1 * (1 - v) + x2 * v;
  };
}

const noise = createNoise(42);
function fbm(x, y, octaves = 4, lacunarity = 2, gain = 0.5) {
  let val = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += noise(x * freq, y * freq) * amp;
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return val / max;
}

// ─── Geographic data ─────────────────────────────────────────
const GEO = {
  sc: [
    [-29.35,-49.72],[-29.15,-49.60],[-28.95,-49.38],[-28.72,-49.10],[-28.50,-48.81],
    [-28.30,-48.68],[-28.00,-48.60],[-27.60,-48.55],[-27.38,-48.42],[-27.10,-48.48],
    [-26.80,-48.55],[-26.50,-48.65],[-26.30,-48.73],[-26.00,-48.78],[-25.95,-48.92],
    [-26.00,-49.35],[-26.05,-49.80],[-26.15,-50.20],[-26.25,-50.60],[-26.30,-51.00],
    [-26.35,-51.40],[-26.40,-51.80],[-26.50,-52.20],[-26.60,-52.60],[-26.70,-53.00],
    [-26.80,-53.30],[-27.10,-53.50],[-27.30,-53.60],[-27.60,-53.50],[-27.90,-53.40],
    [-28.20,-53.30],[-28.50,-53.20],[-28.70,-53.10],[-28.95,-53.00],[-29.10,-52.80],
    [-29.20,-52.50],[-29.30,-52.10],[-29.35,-51.70],[-29.38,-51.30],[-29.40,-50.90],
    [-29.38,-50.50],[-29.37,-50.10],[-29.35,-49.72]
  ],
  pr: [
    [-25.95,-48.92],[-25.80,-48.80],[-25.50,-48.50],[-25.30,-48.35],[-25.10,-48.30],
    [-24.90,-48.28],[-24.70,-48.30],[-24.50,-48.35],[-24.30,-48.40],[-24.10,-48.50],
    [-23.90,-48.60],[-23.70,-48.80],[-23.50,-49.10],[-23.35,-49.50],[-23.20,-49.90],
    [-23.10,-50.30],[-23.00,-50.70],[-22.90,-51.10],[-22.85,-51.50],[-22.80,-51.90],
    [-22.85,-52.30],[-22.95,-52.60],[-23.10,-52.90],[-23.30,-53.20],[-23.50,-53.50],
    [-23.70,-53.80],[-24.00,-54.10],[-24.30,-54.30],[-24.60,-54.50],[-24.90,-54.60],
    [-25.20,-54.58],[-25.50,-54.55],[-25.30,-54.20],[-25.40,-53.90],[-25.55,-53.60],
    [-25.80,-53.40],[-26.00,-53.30],[-26.20,-53.10],[-26.40,-52.80],[-26.50,-52.40],
    [-26.40,-52.00],[-26.30,-51.60],[-26.20,-51.20],[-26.10,-50.80],[-26.05,-50.40],
    [-26.00,-50.00],[-25.98,-49.60],[-25.95,-49.20],[-25.95,-48.92]
  ],
  rs: [
    [-29.35,-49.72],[-29.38,-50.10],[-29.40,-50.50],[-29.40,-50.90],[-29.38,-51.30],
    [-29.35,-51.70],[-29.30,-52.10],[-29.20,-52.50],[-29.10,-52.80],[-28.95,-53.00],
    [-28.90,-53.20],[-28.80,-53.50],[-28.70,-53.80],[-28.60,-54.10],[-28.50,-54.40],
    [-28.40,-54.70],[-28.30,-55.00],[-28.20,-55.30],[-28.10,-55.60],[-28.00,-55.80],
    [-28.10,-56.00],[-28.30,-56.20],[-28.60,-56.40],[-29.00,-56.60],[-29.40,-56.80],
    [-29.80,-57.00],[-30.20,-57.10],[-30.60,-57.20],[-31.00,-57.30],[-31.40,-57.40],
    [-31.80,-57.50],[-32.10,-57.40],[-32.30,-57.20],[-32.50,-56.90],[-32.70,-56.50],
    [-32.90,-56.10],[-33.10,-55.60],[-33.30,-55.10],[-33.50,-54.50],[-33.60,-53.90],
    [-33.70,-53.30],[-33.68,-52.70],[-33.60,-52.10],[-33.50,-51.50],[-33.30,-51.00],
    [-33.10,-50.60],[-32.90,-50.30],[-32.60,-50.10],[-32.30,-49.98],[-32.00,-50.10],
    [-31.70,-50.30],[-31.40,-50.50],[-31.10,-50.50],[-30.80,-50.40],[-30.50,-50.20],
    [-30.20,-50.10],[-29.90,-50.00],[-29.60,-49.90],[-29.35,-49.72]
  ],
  coastSouth: [
    [-22.90,-43.17],[-23.00,-43.50],[-23.20,-44.00],[-23.50,-44.50],[-23.80,-45.00],
    [-24.00,-45.50],[-24.30,-46.00],[-24.50,-46.50],[-24.80,-47.00],[-25.00,-47.50],
    [-25.20,-47.90],[-25.30,-48.15],[-25.50,-48.40],[-25.70,-48.55],[-25.90,-48.70],
    [-26.10,-48.65],[-26.30,-48.70],[-26.50,-48.63],[-26.70,-48.53],[-26.90,-48.50],
    [-27.10,-48.48],[-27.30,-48.40],[-27.50,-48.47],[-27.60,-48.53],[-27.80,-48.58],
    [-28.00,-48.62],[-28.30,-48.72],[-28.50,-48.85],[-28.70,-49.15],[-28.90,-49.38],
    [-29.10,-49.55],[-29.35,-49.72],[-29.60,-49.90],[-29.90,-50.00],[-30.05,-50.10],
    [-30.20,-50.13],[-30.40,-50.20],[-30.60,-50.25],[-30.80,-50.40],[-31.00,-50.48],
    [-31.30,-50.55],[-31.50,-50.60],[-31.80,-50.80],[-32.00,-51.00],[-32.10,-51.20],
    [-32.30,-51.50],[-32.50,-51.80],[-32.70,-52.00],[-32.90,-52.20],[-33.10,-52.50],
    [-33.30,-52.80],[-33.50,-53.10],[-33.70,-53.37]
  ],
  argentinaEast: [
    [-22.00,-58.00],[-22.50,-57.80],[-23.00,-57.60],[-23.50,-57.40],
    [-24.00,-57.20],[-24.50,-57.00],[-25.00,-57.10],[-25.26,-57.58],
    [-25.50,-57.80],[-26.00,-58.10],[-26.50,-58.30],[-27.00,-58.50],
    [-27.30,-58.40],[-27.50,-58.30],[-27.60,-57.80],[-27.80,-57.50],
    [-28.00,-57.20],[-28.20,-56.80],[-28.50,-56.50],[-28.80,-56.20],
    [-29.20,-56.00],[-29.50,-55.80],[-29.80,-55.60],[-30.10,-55.40],
    [-30.30,-55.20],[-30.50,-55.00],[-30.80,-54.80],[-31.00,-54.60],
    [-31.30,-54.40],[-31.60,-54.20],[-31.90,-54.00],[-32.20,-53.80],
    [-32.50,-53.60],[-32.80,-53.40],[-33.10,-53.20],[-33.40,-53.00],
    [-33.70,-53.37]
  ],
  paraguayBorder: [
    [-22.00,-58.00],[-22.30,-57.50],[-22.50,-57.20],[-22.80,-57.00],
    [-23.20,-56.80],[-23.50,-56.50],[-23.80,-56.20],[-24.00,-55.90],
    [-24.20,-55.60],[-24.50,-55.30],[-24.80,-55.00],[-25.00,-54.80],
    [-25.20,-54.60],[-25.26,-57.58]
  ],
  uruguayBorder: [
    [-33.70,-53.37],[-33.50,-53.60],[-33.30,-53.90],[-33.10,-54.20],
    [-32.90,-54.50],[-32.70,-54.80],[-32.50,-55.10],[-32.30,-55.40],
    [-32.10,-55.70],[-31.90,-56.00],[-31.60,-56.30],[-31.30,-56.60],
    [-31.00,-56.90],[-30.80,-57.10],[-30.50,-57.20],[-30.20,-57.10],
    [-29.80,-57.00],[-29.40,-56.80],[-29.00,-56.60],[-28.60,-56.40],
    [-28.30,-56.20],[-28.10,-56.00],[-28.00,-55.80]
  ],
  rioParana: [
    [-22.80,-53.20],[-23.00,-53.40],[-23.30,-53.60],[-23.60,-53.80],
    [-24.00,-54.10],[-24.30,-54.30],[-24.60,-54.50],[-24.90,-54.60],
    [-25.20,-54.58],[-25.50,-54.55],[-25.80,-54.50],[-26.10,-54.40],
    [-26.50,-54.30],[-26.80,-54.20],[-27.10,-54.10],[-27.40,-54.00],
    [-27.60,-53.90],[-27.80,-53.80]
  ],
  rioUruguai: [
    [-27.80,-53.80],[-28.00,-53.60],[-28.20,-53.40],[-28.50,-53.20],
    [-28.70,-53.10],[-28.90,-53.00],[-28.80,-53.50],[-28.70,-53.80],
    [-28.60,-54.10],[-28.50,-54.40],[-28.40,-54.70],[-28.30,-55.00],
    [-28.20,-55.30],[-28.10,-55.60],[-28.00,-55.80],[-28.10,-56.00],
    [-28.30,-56.20],[-28.60,-56.40],[-29.00,-56.60],[-29.40,-56.80],
    [-29.80,-57.00],[-30.20,-57.10]
  ],
  rioIguacu: [
    [-25.50,-49.20],[-25.60,-49.60],[-25.70,-50.00],[-25.80,-50.40],
    [-25.85,-50.80],[-25.90,-51.20],[-25.80,-51.60],[-25.70,-52.00],
    [-25.60,-52.40],[-25.55,-52.80],[-25.50,-53.20],[-25.45,-53.60],
    [-25.50,-54.00],[-25.50,-54.40],[-25.50,-54.58]
  ],
  rioItajai: [
    [-26.90,-48.65],[-27.00,-49.00],[-27.05,-49.30],[-27.10,-49.60],
    [-27.05,-49.90],[-27.00,-50.20],[-26.95,-50.50],[-26.90,-50.80]
  ],
  rioJacui: [
    [-30.03,-51.22],[-30.00,-51.50],[-29.90,-51.80],[-29.80,-52.10],
    [-29.70,-52.40],[-29.60,-52.70],[-29.50,-53.00],[-29.40,-53.30],
    [-29.30,-53.60]
  ],
  rioTibagi: [
    [-24.30,-50.40],[-24.00,-50.30],[-23.70,-50.20],[-23.40,-50.10],
    [-23.20,-50.00],[-23.00,-49.90],[-22.80,-49.80]
  ],
  br116: [
    [-25.43,-49.27],[-25.60,-49.40],[-25.80,-49.55],[-26.00,-49.60],
    [-26.30,-49.70],[-26.50,-49.80],[-26.80,-49.90],[-27.10,-50.00],
    [-27.40,-50.10],[-27.70,-50.20],[-28.00,-50.35],[-28.30,-50.50],
    [-28.60,-50.70],[-28.90,-50.90],[-29.20,-51.10],[-29.50,-51.20],
    [-29.80,-51.15],[-30.03,-51.17],[-30.30,-51.10],[-30.60,-51.00],
    [-30.90,-51.10],[-31.20,-51.20],[-31.50,-51.40],[-31.80,-51.80],
    [-32.00,-52.10],[-32.30,-52.40],[-32.60,-52.70],[-32.90,-53.00],
    [-33.20,-53.30],[-33.50,-53.50]
  ],
  br101: [
    [-25.30,-48.35],[-25.50,-48.50],[-25.70,-48.60],[-25.90,-48.70],
    [-26.10,-48.65],[-26.30,-48.68],[-26.50,-48.63],[-26.70,-48.55],
    [-26.90,-48.52],[-27.10,-48.50],[-27.30,-48.45],[-27.50,-48.50],
    [-27.70,-48.58],[-27.90,-48.60],[-28.10,-48.65],[-28.30,-48.70],
    [-28.50,-48.85],[-28.70,-49.10],[-28.90,-49.35],[-29.10,-49.55],
    [-29.35,-49.72],[-29.60,-49.90],[-29.80,-50.00],[-30.00,-50.08],
    [-30.30,-50.15],[-30.60,-50.25],[-30.80,-50.35],[-31.00,-50.45],
    [-31.30,-50.55],[-31.60,-50.70],[-31.90,-51.00],[-32.10,-51.20],
    [-32.30,-51.50],[-32.50,-51.80],[-32.80,-52.10],[-33.00,-52.30]
  ],
  br376: [
    [-25.43,-49.27],[-25.40,-49.60],[-25.35,-50.00],[-25.30,-50.40],
    [-25.25,-50.80],[-25.20,-51.20],[-25.15,-51.60],[-25.10,-52.00],
    [-25.10,-52.40],[-25.10,-52.80],[-25.15,-53.20],[-25.20,-53.60],
    [-25.30,-54.00],[-25.40,-54.30],[-25.50,-54.58]
  ],
};

const CAPITALS = [
  { name: 'Florianópolis', lat: -27.5954, lon: -48.5480, type: 'state' },
  { name: 'Porto Alegre',  lat: -30.0346, lon: -51.2177, type: 'state' },
  { name: 'Curitiba',      lat: -25.4284, lon: -49.2733, type: 'state' },
  { name: 'Buenos Aires',  lat: -34.6037, lon: -58.3816, type: 'country' },
  { name: 'Assunção',      lat: -25.2637, lon: -57.5759, type: 'country' },
  { name: 'Montevidéu',    lat: -34.9011, lon: -56.1645, type: 'country' },
];

// ─── Projection ──────────────────────────────────────────────
function latToMercY(lat) {
  const rad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + rad / 2));
}

function makeProjector(bbox, width, height, padding = 30) {
  const lonMin = bbox.minLon * Math.PI / 180;
  const lonMax = bbox.maxLon * Math.PI / 180;
  const lonRange = lonMax - lonMin;
  const mercTop = latToMercY(bbox.maxLat);
  const mercBot = latToMercY(bbox.minLat);
  const mercRange = mercTop - mercBot;

  const scaleX = (width - 2 * padding) / lonRange;
  const scaleY = (height - 2 * padding) / mercRange;
  const scale = Math.min(scaleX, scaleY);

  const mapW = lonRange * scale;
  const mapH = mercRange * scale;
  const offX = padding + ((width - 2 * padding) - mapW) / 2;
  const offY = padding + ((height - 2 * padding) - mapH) / 2;

  return (lat, lon) => {
    const lonRad = lon * Math.PI / 180;
    const px = offX + (lonRad - lonMin) * scale;
    const py = offY + (mercTop - latToMercY(lat)) * scale;
    return [+(px.toFixed(1)), +(py.toFixed(1))];
  };
}

// ─── Path utilities ──────────────────────────────────────────
function projectCoords(coords, proj) {
  return coords.map(([lat, lon]) => proj(lat, lon));
}

function ptsToD(pts, close = false) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` ${pts[i][0]},${pts[i][1]}`;
  if (close) d += 'Z';
  return d;
}

// Smooth path with Catmull-Rom → cubic bezier
function smoothPath(pts, tension = 0.3) {
  if (pts.length < 3) return ptsToD(pts);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[Math.min(i + 1, pts.length - 1)];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
    d += ` C${r(cp1x)},${r(cp1y)} ${r(cp2x)},${r(cp2y)} ${r(p2[0])},${r(p2[1])}`;
  }
  return d;
}

function r(v) { return +(v.toFixed(1)); }

// ─── FINGERPRINT effects ─────────────────────────────────────

// Compute normals for each point in a polyline
function computeNormals(pts) {
  const normals = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(i - 1, 0)];
    const next = pts[Math.min(i + 1, pts.length - 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    normals.push([-dy / len, dx / len]); // perpendicular
  }
  return normals;
}

// Offset a polyline by distance d along normals, with noise perturbation
function offsetPath(pts, dist, noiseScale = 0.02, noiseAmp = 0, seed = 0) {
  const normals = computeNormals(pts);
  return pts.map((p, i) => {
    const n = noiseAmp > 0 ? fbm(p[0] * noiseScale + seed, p[1] * noiseScale + seed, 3) * noiseAmp : 0;
    return [
      r(p[0] + normals[i][0] * (dist + n)),
      r(p[1] + normals[i][1] * (dist + n))
    ];
  });
}

// Generate concentric offset rings from a path
function concentricLines(pts, count, spacing, noiseScale = 0.008, noiseAmp = 0, startDist = 0, bothSides = true) {
  const lines = [];
  for (let i = 1; i <= count; i++) {
    const d = startDist + i * spacing;
    const nAmp = noiseAmp * (1 + i * 0.15);
    lines.push(offsetPath(pts, d, noiseScale, nAmp, i * 7.3));
    if (bothSides) {
      lines.push(offsetPath(pts, -d, noiseScale, nAmp, i * 13.7));
    }
  }
  return lines;
}

// Generate flowing parallel lines filling a bounding area
function flowLines(bbox, proj, count, angle, noiseScale = 0.003, noiseAmp = 30, width, height) {
  const lines = [];
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const diag = Math.sqrt(width * width + height * height);
  const spacing = diag / count;

  for (let i = -count; i <= count; i++) {
    const offset = i * spacing;
    const pts = [];
    const steps = 80;
    for (let t = 0; t <= steps; t++) {
      const frac = t / steps;
      const baseX = -diag / 2 + frac * diag;
      const baseY = offset;
      // Rotate
      const rx = width / 2 + baseX * cos - baseY * sin;
      const ry = height / 2 + baseX * sin + baseY * cos;
      // Add noise
      const nx = fbm(rx * noiseScale, ry * noiseScale, 4) * noiseAmp;
      const ny = fbm(rx * noiseScale + 100, ry * noiseScale + 100, 4) * noiseAmp;
      pts.push([r(rx + nx), r(ry + ny)]);
    }
    lines.push(pts);
  }
  return lines;
}

// Interpolate between two polylines (for contour fill between borders)
function interpolateLines(line1, line2, count) {
  const lines = [];
  const len = Math.min(line1.length, line2.length);
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const pts = [];
    for (let j = 0; j < len; j++) {
      pts.push([
        r(line1[j][0] * (1 - t) + line2[j][0] * t),
        r(line1[j][1] * (1 - t) + line2[j][1] * t)
      ]);
    }
    lines.push(pts);
  }
  return lines;
}

// Resample a polyline to N points
function resample(pts, n) {
  if (pts.length < 2) return pts;
  // Calculate total length
  let totalLen = 0;
  const segLens = [];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i-1][0], dy = pts[i][1] - pts[i-1][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLens.push(len);
    totalLen += len;
  }

  const step = totalLen / (n - 1);
  const result = [pts[0]];
  let segIdx = 0, segProgress = 0;

  for (let i = 1; i < n - 1; i++) {
    let remaining = step;
    while (segIdx < segLens.length && remaining > 0) {
      const available = segLens[segIdx] - segProgress;
      if (remaining <= available) {
        segProgress += remaining;
        const t = segProgress / segLens[segIdx];
        result.push([
          r(pts[segIdx][0] * (1 - t) + pts[segIdx + 1][0] * t),
          r(pts[segIdx][1] * (1 - t) + pts[segIdx + 1][1] * t)
        ]);
        remaining = 0;
      } else {
        remaining -= available;
        segIdx++;
        segProgress = 0;
      }
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

// ─── Bounding boxes ─────────────────────────────────────────
const BBOX_FULL   = { minLat: -34.5, maxLat: -22.0, minLon: -59.0, maxLon: -47.0 };
const BBOX_SC     = { minLat: -29.8, maxLat: -25.8, minLon: -54.2, maxLon: -48.0 };
const BBOX_RS     = { minLat: -34.0, maxLat: -27.0, minLon: -58.5, maxLon: -49.0 };
const BBOX_PR     = { minLat: -27.0, maxLat: -22.3, minLon: -55.5, maxLon: -47.8 };
const BBOX_SC_PR  = { minLat: -29.8, maxLat: -22.3, minLon: -55.5, maxLon: -47.8 };
const BBOX_RS_SC  = { minLat: -34.0, maxLat: -25.8, minLon: -58.5, maxLon: -48.0 };
const BBOX_COAST  = { minLat: -29.8, maxLat: -25.0, minLon: -50.5, maxLon: -47.8 };
const BBOX_FOZ    = { minLat: -26.2, maxLat: -24.3, minLon: -56.0, maxLon: -53.0 };
const BBOX_3STATES = { minLat: -34.0, maxLat: -22.3, minLon: -58.0, maxLon: -47.8 };

// ─── SVG Builder ────────────────────────────────────────────
function buildFingerprint(opts) {
  const {
    bbox, width = 1200, height = 1400, title = '',
    bg = 'none', color = '#1a1a2e', opacity = 1,
    strokeWidth = 0.4,
    // Which features to draw with fingerprint effect
    states = [],         // e.g. ['sc','pr','rs']
    borders = [],        // e.g. ['argentinaEast','uruguayBorder']
    rivers = [],         // e.g. ['rioParana','rioIguacu']
    roads = [],          // e.g. ['br101','br116']
    coast = false,
    showCapitals = false,
    // Fingerprint params
    concentricCount = 25,    // number of concentric offset lines per feature
    concentricSpacing = 5,   // px between concentric lines
    noiseAmp = 8,            // amplitude of noise perturbation
    noiseScale = 0.008,      // frequency of noise
    flowEnabled = false,     // add background flow lines
    flowAngle = 15,          // angle of flow lines
    flowCount = 60,          // number of flow lines
    flowNoise = 25,          // noise amplitude for flow
    flowColor,               // optional separate flow color
    riverConcentrics = 15,   // concentric lines for rivers
    riverSpacing = 4,
    roadConcentrics = 8,
    roadSpacing = 3,
    coastConcentrics = 30,
    coastSpacing = 6,
    borderConcentrics = 15,
    borderSpacing = 5,
    // Extras
    capitalColor = '#e63946',
    capitalSize = 5,
    labelSize = 11,
    secondaryColor,          // optional second color for rivers
    smooth = true,           // use smooth curves
  } = opts;

  const proj = makeProjector(bbox, width, height);
  const w = width, h = height;
  const fc = flowColor || color;
  const rc = secondaryColor || color;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`;
  if (title) svg += `<!-- ${title} -->\n`;
  svg += `<defs><clipPath id="clip"><rect width="${w}" height="${h}"/></clipPath></defs>\n`;
  if (bg !== 'none') svg += `<rect width="${w}" height="${h}" fill="${bg}"/>\n`;
  svg += `<g opacity="${opacity}" clip-path="url(#clip)">\n`;

  const pathFn = smooth ? smoothPath : ptsToD;

  // Background flow lines
  if (flowEnabled) {
    const flines = flowLines(bbox, proj, flowCount, flowAngle, 0.003, flowNoise, w, h);
    svg += `<g id="flow" fill="none" stroke="${fc}" stroke-width="${strokeWidth * 0.6}" opacity="0.3">\n`;
    for (const line of flines) {
      svg += `  <path d="${pathFn(line)}"/>\n`;
    }
    svg += `</g>\n`;
  }

  // Coast fingerprint
  if (coast) {
    const coastPts = projectCoords(GEO.coastSouth, proj);
    const clines = concentricLines(coastPts, coastConcentrics, coastSpacing, noiseScale, noiseAmp, 0, false);
    // Only outward (ocean side)
    svg += `<g id="coast-fingerprint" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="0.7">\n`;
    svg += `  <path d="${pathFn(coastPts)}"/>\n`;
    for (const line of clines) {
      svg += `  <path d="${pathFn(line)}"/>\n`;
    }
    svg += `</g>\n`;
  }

  // Country borders fingerprint
  if (borders.length) {
    svg += `<g id="border-fingerprint" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="0.5">\n`;
    for (const key of borders) {
      if (!GEO[key]) continue;
      const pts = projectCoords(GEO[key], proj);
      svg += `  <path d="${pathFn(pts)}"/>\n`;
      const blines = concentricLines(pts, borderConcentrics, borderSpacing, noiseScale, noiseAmp * 0.7, 0, true);
      for (const line of blines) {
        svg += `  <path d="${pathFn(line)}"/>\n`;
      }
    }
    svg += `</g>\n`;
  }

  // State fingerprints
  if (states.length) {
    svg += `<g id="state-fingerprint" fill="none" stroke="${color}" stroke-width="${strokeWidth}">\n`;
    for (const key of states) {
      if (!GEO[key]) continue;
      const pts = projectCoords(GEO[key], proj);
      // Main border — slightly thicker
      svg += `  <path d="${pathFn(pts, true)}" stroke-width="${strokeWidth * 2}"/>\n`;
      // Concentric inward/outward lines
      const slines = concentricLines(pts, concentricCount, concentricSpacing, noiseScale, noiseAmp, 0, true);
      for (const line of slines) {
        svg += `  <path d="${pathFn(line)}"/>\n`;
      }
    }
    svg += `</g>\n`;
  }

  // Rivers fingerprint
  if (rivers.length) {
    svg += `<g id="river-fingerprint" fill="none" stroke="${rc}" stroke-width="${strokeWidth}">\n`;
    for (const key of rivers) {
      if (!GEO[key]) continue;
      const pts = projectCoords(GEO[key], proj);
      svg += `  <path d="${pathFn(pts)}" stroke-width="${strokeWidth * 1.5}"/>\n`;
      const rlines = concentricLines(pts, riverConcentrics, riverSpacing, noiseScale * 1.5, noiseAmp * 1.2, 0, true);
      for (const line of rlines) {
        svg += `  <path d="${pathFn(line)}"/>\n`;
      }
    }
    svg += `</g>\n`;
  }

  // Roads fingerprint
  if (roads.length) {
    svg += `<g id="road-fingerprint" fill="none" stroke="${color}" stroke-width="${strokeWidth * 0.8}" opacity="0.6">\n`;
    for (const key of roads) {
      if (!GEO[key]) continue;
      const pts = projectCoords(GEO[key], proj);
      svg += `  <path d="${pathFn(pts)}" stroke-width="${strokeWidth * 1.2}"/>\n`;
      const rdlines = concentricLines(pts, roadConcentrics, roadSpacing, noiseScale * 2, noiseAmp * 0.6, 0, true);
      for (const line of rdlines) {
        svg += `  <path d="${pathFn(line)}"/>\n`;
      }
    }
    svg += `</g>\n`;
  }

  // Capitals
  if (showCapitals) {
    svg += `<g id="capitals" font-family="Inter, Arial, sans-serif">\n`;
    for (const cap of CAPITALS) {
      if (cap.lat < bbox.minLat || cap.lat > bbox.maxLat || cap.lon < bbox.minLon || cap.lon > bbox.maxLon) continue;
      const [cx, cy] = proj(cap.lat, cap.lon);
      const cr = cap.type === 'country' ? capitalSize * 1.3 : capitalSize;
      // Concentric circles (fingerprint style)
      for (let ri = 0; ri < 4; ri++) {
        const radius = cr + ri * 3;
        svg += `  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${capitalColor}" stroke-width="${strokeWidth}" opacity="${1 - ri * 0.2}"/>\n`;
      }
      svg += `  <circle cx="${cx}" cy="${cy}" r="${cr}" fill="${capitalColor}"/>\n`;
      svg += `  <text x="${cx + cr + 8}" y="${+(cy + 4).toFixed(1)}" font-size="${labelSize}" fill="${capitalColor}" font-weight="600">${cap.name}</text>\n`;
    }
    svg += `</g>\n`;
  }

  svg += `</g>\n</svg>`;
  return svg;
}

// ─── 30 Variations ──────────────────────────────────────────
const ALL_STATES = ['sc', 'pr', 'rs'];
const ALL_BORDERS = ['argentinaEast', 'paraguayBorder', 'uruguayBorder'];
const ALL_RIVERS = ['rioParana', 'rioUruguai', 'rioIguacu', 'rioItajai', 'rioJacui', 'rioTibagi'];
const ALL_ROADS = ['br116', 'br101', 'br376'];

const variations = [
  // ── FULL FINGERPRINT (10) ──
  {
    file: '01-full-fingerprint', title: 'Fingerprint completo — todas camadas',
    bbox: BBOX_FULL, states: ALL_STATES, borders: ALL_BORDERS,
    rivers: ALL_RIVERS, roads: ALL_ROADS, coast: true, showCapitals: true,
    concentricCount: 20, concentricSpacing: 6, noiseAmp: 10,
    flowEnabled: true, flowCount: 50, flowAngle: 20, flowNoise: 30,
  },
  {
    file: '02-full-states-only', title: 'Fingerprint — só contornos estaduais',
    bbox: BBOX_FULL, states: ALL_STATES,
    concentricCount: 35, concentricSpacing: 5, noiseAmp: 12,
  },
  {
    file: '03-full-rivers-flow', title: 'Rios com flow lines',
    bbox: BBOX_FULL, rivers: ALL_RIVERS, coast: true,
    riverConcentrics: 25, riverSpacing: 5, noiseAmp: 15,
    flowEnabled: true, flowCount: 40, flowAngle: -10, flowNoise: 20,
    secondaryColor: '#1a5f8a',
  },
  {
    file: '04-full-roads-dense', title: 'Rodovias — pattern denso',
    bbox: BBOX_FULL, roads: ALL_ROADS, states: ALL_STATES,
    roadConcentrics: 20, roadSpacing: 4, noiseAmp: 6,
    concentricCount: 10, concentricSpacing: 8,
  },
  {
    file: '05-full-coast-ripple', title: 'Costa — ripple oceânico',
    bbox: BBOX_FULL, coast: true, states: ALL_STATES,
    coastConcentrics: 50, coastSpacing: 5, noiseAmp: 12,
    concentricCount: 8, concentricSpacing: 10,
  },
  {
    file: '06-full-dark-fingerprint', title: 'Fingerprint dark mode',
    bbox: BBOX_FULL, states: ALL_STATES, borders: ALL_BORDERS,
    rivers: ALL_RIVERS, coast: true, showCapitals: true,
    bg: '#0a0e1a', color: '#2a4a7a', capitalColor: '#5a9fd4',
    concentricCount: 25, concentricSpacing: 5, noiseAmp: 10,
    flowEnabled: true, flowCount: 60, flowAngle: 30, flowNoise: 25,
    flowColor: '#151e35',
  },
  {
    file: '07-full-minimal-topo', title: 'Topográfico minimalista',
    bbox: BBOX_FULL, states: ALL_STATES, coast: true,
    concentricCount: 15, concentricSpacing: 8, noiseAmp: 5,
    strokeWidth: 0.3, color: '#aab4c2',
  },
  {
    file: '08-full-dense-noise', title: 'Ultra-denso com muito noise',
    bbox: BBOX_FULL, states: ALL_STATES, rivers: ALL_RIVERS, coast: true,
    concentricCount: 40, concentricSpacing: 3, noiseAmp: 20, noiseScale: 0.012,
    coastConcentrics: 40, coastSpacing: 3,
  },
  {
    file: '09-full-flow-only', title: 'Apenas flow lines — pattern abstrato',
    bbox: BBOX_FULL,
    flowEnabled: true, flowCount: 100, flowAngle: 25, flowNoise: 40,
    noiseScale: 0.005, strokeWidth: 0.3,
  },
  {
    file: '10-full-brand-blue', title: 'Brand azul #0138AD fingerprint',
    bbox: BBOX_FULL, states: ALL_STATES, rivers: ALL_RIVERS, coast: true,
    showCapitals: true,
    color: '#0138AD', capitalColor: '#0138AD',
    concentricCount: 20, concentricSpacing: 5, noiseAmp: 8,
    opacity: 0.4,
  },

  // ── SC ZOOM (5) ──
  {
    file: '11-sc-fingerprint', title: 'SC — fingerprint completo',
    bbox: BBOX_SC, states: ['sc'], coast: true,
    rivers: ['rioItajai', 'rioIguacu'], roads: ['br101', 'br116'],
    showCapitals: true, height: 1000,
    concentricCount: 30, concentricSpacing: 5, noiseAmp: 10,
    coastConcentrics: 25, coastSpacing: 5,
  },
  {
    file: '12-sc-dense', title: 'SC — ultra denso',
    bbox: BBOX_SC, states: ['sc'], coast: true, height: 1000,
    concentricCount: 50, concentricSpacing: 3, noiseAmp: 15,
    coastConcentrics: 40, coastSpacing: 3,
  },
  {
    file: '13-sc-flow-overlay', title: 'SC — flow lines + contorno',
    bbox: BBOX_SC, states: ['sc'], coast: true, height: 1000,
    concentricCount: 15, concentricSpacing: 6,
    flowEnabled: true, flowCount: 80, flowAngle: 45, flowNoise: 20,
  },
  {
    file: '14-sc-brand-blue', title: 'SC — brand azul',
    bbox: BBOX_SC, states: ['sc'], coast: true, height: 1000,
    color: '#0138AD', concentricCount: 25, concentricSpacing: 5, noiseAmp: 8,
    opacity: 0.5,
  },
  {
    file: '15-sc-rivers-detail', title: 'SC — rios em detalhe',
    bbox: BBOX_SC, rivers: ['rioItajai', 'rioIguacu'], coast: true, height: 1000,
    riverConcentrics: 35, riverSpacing: 4, noiseAmp: 12,
    coastConcentrics: 20, coastSpacing: 5, secondaryColor: '#1a5f8a',
  },

  // ── RS ZOOM (4) ──
  {
    file: '16-rs-fingerprint', title: 'RS — fingerprint completo',
    bbox: BBOX_RS, states: ['rs'], coast: true,
    borders: ['argentinaEast', 'uruguayBorder'],
    rivers: ['rioUruguai', 'rioJacui'], showCapitals: true,
    concentricCount: 25, concentricSpacing: 5, noiseAmp: 10,
  },
  {
    file: '17-rs-topo', title: 'RS — topográfico',
    bbox: BBOX_RS, states: ['rs'], coast: true,
    borders: ['argentinaEast', 'uruguayBorder'], rivers: ['rioUruguai', 'rioJacui'],
    concentricCount: 35, concentricSpacing: 4, noiseAmp: 6, strokeWidth: 0.3,
    color: '#556677',
  },
  {
    file: '18-rs-dark', title: 'RS — dark mode',
    bbox: BBOX_RS, states: ['rs'], coast: true, rivers: ['rioUruguai', 'rioJacui'],
    bg: '#0a0e1a', color: '#2a4a7a',
    concentricCount: 30, concentricSpacing: 5, noiseAmp: 10,
    flowEnabled: true, flowCount: 50, flowAngle: -15, flowNoise: 20,
    flowColor: '#141c30',
  },
  {
    file: '19-rs-brand-red', title: 'RS — brand vermelho',
    bbox: BBOX_RS, states: ['rs'], coast: true,
    color: '#9D0013', concentricCount: 20, concentricSpacing: 6, noiseAmp: 8,
    opacity: 0.35,
  },

  // ── PR ZOOM (3) ──
  {
    file: '20-pr-fingerprint', title: 'PR — fingerprint completo',
    bbox: BBOX_PR, states: ['pr'], coast: true,
    rivers: ['rioParana', 'rioIguacu', 'rioTibagi'],
    roads: ['br376'], showCapitals: true,
    concentricCount: 25, concentricSpacing: 5, noiseAmp: 10,
  },
  {
    file: '21-pr-rivers-dense', title: 'PR — rios denso',
    bbox: BBOX_PR, rivers: ['rioParana', 'rioIguacu', 'rioTibagi'],
    riverConcentrics: 30, riverSpacing: 4, noiseAmp: 12,
    secondaryColor: '#1a5f8a',
  },
  {
    file: '22-pr-topo-light', title: 'PR — topográfico claro',
    bbox: BBOX_PR, states: ['pr'], coast: true, rivers: ['rioParana', 'rioIguacu'],
    concentricCount: 20, concentricSpacing: 6, noiseAmp: 5,
    strokeWidth: 0.25, color: '#99aabb',
  },

  // ── REGIONAL ZOOMS (4) ──
  {
    file: '23-3states-fingerprint', title: '3 estados — fingerprint',
    bbox: BBOX_3STATES, states: ALL_STATES, coast: true,
    rivers: ALL_RIVERS, showCapitals: true,
    concentricCount: 18, concentricSpacing: 6, noiseAmp: 10,
  },
  {
    file: '24-coast-ripple-detail', title: 'Litoral — ripple detail',
    bbox: BBOX_COAST, coast: true, roads: ['br101'],
    showCapitals: true, width: 800, height: 1400,
    coastConcentrics: 50, coastSpacing: 4, noiseAmp: 8,
    roadConcentrics: 15, roadSpacing: 3,
  },
  {
    file: '25-foz-fingerprint', title: 'Tríplice fronteira — fingerprint',
    bbox: BBOX_FOZ, states: ['pr'],
    borders: ['argentinaEast', 'paraguayBorder'],
    rivers: ['rioParana', 'rioIguacu'],
    width: 1000, height: 900,
    concentricCount: 30, concentricSpacing: 5, noiseAmp: 12,
    riverConcentrics: 25, riverSpacing: 4,
  },
  {
    file: '26-rs-sc-combined', title: 'RS + SC — flow + contornos',
    bbox: BBOX_RS_SC, states: ['rs', 'sc'], coast: true,
    rivers: ['rioUruguai', 'rioJacui', 'rioItajai'],
    concentricCount: 20, concentricSpacing: 5, noiseAmp: 10,
    flowEnabled: true, flowCount: 60, flowAngle: 0, flowNoise: 30,
  },

  // ── STYLE VARIATIONS (4) ──
  {
    file: '27-full-brand-blue-dense', title: 'Brand azul denso — pattern tile',
    bbox: BBOX_FULL, states: ALL_STATES, rivers: ALL_RIVERS, coast: true,
    color: '#0138AD', concentricCount: 30, concentricSpacing: 4, noiseAmp: 12,
    flowEnabled: true, flowCount: 50, flowAngle: 35, flowNoise: 20,
    flowColor: '#0138AD', opacity: 0.25, strokeWidth: 0.35,
  },
  {
    file: '28-full-brand-red-dense', title: 'Brand vermelho denso — pattern tile',
    bbox: BBOX_FULL, states: ALL_STATES, coast: true,
    color: '#9D0013', concentricCount: 30, concentricSpacing: 4, noiseAmp: 12,
    flowEnabled: true, flowCount: 50, flowAngle: -20, flowNoise: 20,
    flowColor: '#9D0013', opacity: 0.2, strokeWidth: 0.35,
  },
  {
    file: '29-full-white-on-dark', title: 'Branco sobre escuro — premium',
    bbox: BBOX_FULL, states: ALL_STATES, borders: ALL_BORDERS,
    rivers: ALL_RIVERS, coast: true, showCapitals: true,
    bg: '#0f1523', color: '#ffffff', capitalColor: '#ffffff',
    concentricCount: 20, concentricSpacing: 6, noiseAmp: 10,
    flowEnabled: true, flowCount: 40, flowAngle: 10, flowNoise: 25,
    flowColor: '#ffffff', opacity: 0.15, strokeWidth: 0.4,
  },
  {
    file: '30-full-gold-luxury', title: 'Dourado luxury — fingerprint',
    bbox: BBOX_FULL, states: ALL_STATES, coast: true, rivers: ALL_RIVERS,
    bg: '#1a1520', color: '#c9a84c', capitalColor: '#c9a84c',
    showCapitals: true,
    concentricCount: 25, concentricSpacing: 5, noiseAmp: 8,
    flowEnabled: true, flowCount: 30, flowAngle: 15, flowNoise: 15,
    flowColor: '#c9a84c', opacity: 0.4, strokeWidth: 0.35,
  },
];

// ─── Main ───────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true });
console.log(`=== Gerando ${variations.length} SVGs FINGERPRINT ===\n`);

let totalSize = 0;
for (const v of variations) {
  const svg = buildFingerprint(v);
  const filePath = join(OUT_DIR, `${v.file}.svg`);
  writeFileSync(filePath, svg, 'utf-8');
  const sizeKB = Buffer.byteLength(svg, 'utf-8') / 1024;
  totalSize += sizeKB;
  console.log(`  ✓ ${v.file}.svg  (${sizeKB.toFixed(0)} KB)  — ${v.title}`);
}

console.log(`\n✅ ${variations.length} SVGs gerados em assets/images/map-patterns/`);
console.log(`   Tamanho total: ${(totalSize / 1024).toFixed(1)} MB`);
