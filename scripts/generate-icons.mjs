/**
 * Oraculum — PWA icon generator (dependency-free, pure Node).
 *
 * Renders the app icon (slate gradient + white d20 decagon ring + amber "20")
 * into real PNGs using only `node:zlib`. Run:  bun scripts/generate-icons.mjs
 *
 * Outputs (into public/):
 *   icons/icon-192.png          — Android/Chrome install icon
 *   icons/icon-512.png          — high-res install icon
 *   icons/icon-512-maskable.png — full-bleed icon for adaptive maskables
 *   apple-touch-icon.png        — 180px full-bleed icon for iOS home screen
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const AMBER = [251, 191, 36, 255]; // #fbbf24
const WHITE = [255, 255, 255, 255];
const TOP = [15, 23, 42, 255]; // #0f172a slate-900
const BOTTOM = [30, 41, 59, 255]; // #1e293b slate-800

// 5x7 blocky digits — matches the Freebuff "20" logo motif
const DIGITS = {
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------------------------------------------------------------------------
// Minimal PNG encoder (8-bit RGBA)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

// Bilinear downscale (512 -> smaller sizes)
function downscale(src, srcSize, dstSize) {
  const out = new Uint8Array(dstSize * dstSize * 4);
  const step = srcSize / dstSize;
  for (let y = 0; y < dstSize; y++) {
    const sy = y * step;
    const y0 = Math.floor(sy);
    const fy = sy - y0;
    const y1 = Math.min(srcSize - 1, y0 + 1);
    for (let x = 0; x < dstSize; x++) {
      const sx = x * step;
      const x0 = Math.floor(sx);
      const fx = sx - x0;
      const x1 = Math.min(srcSize - 1, x0 + 1);
      const i00 = (y0 * srcSize + x0) * 4;
      const i10 = (y0 * srcSize + x1) * 4;
      const i01 = (y1 * srcSize + x0) * 4;
      const i11 = (y1 * srcSize + x1) * 4;
      const o = (y * dstSize + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = lerp(src[i00 + c], src[i10 + c], fx);
        const bot = lerp(src[i01 + c], src[i11 + c], fx);
        out[o + c] = Math.round(lerp(top, bot, fy));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// SDF helpers
// ---------------------------------------------------------------------------
// Anti-aliased coverage of a rounded-rect (0..1)
function rrCoverage(x, y, w, h, r) {
  const cx = Math.abs(x - w / 2) - (w / 2 - r);
  const cy = Math.abs(y - h / 2) - (h / 2 - r);
  const ax = Math.max(cx, 0);
  const ay = Math.max(cy, 0);
  const d = Math.hypot(ax, ay) + Math.min(Math.max(cx, cy), 0) - r;
  return clamp(0.5 - d, 0, 1);
}

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - x1) * dx + (py - y1) * dy) / len2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(x1 + t * dx - px, y1 + t * dy - py);
}

// Distance to the outline ring of a decagon (d20 silhouette)
function decagonRingDist(x, y, cx, cy, radius, stroke) {
  const n = 10;
  let best = Infinity;
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + Math.cos(a1) * radius;
    const y1 = cy + Math.sin(a1) * radius;
    const x2 = cx + Math.cos(a2) * radius;
    const y2 = cy + Math.sin(a2) * radius;
    best = Math.min(best, segDist(x, y, x1, y1, x2, y2));
  }
  return best - stroke / 2;
}

// Coverage for a solid pixel-cell rectangle (digit block)
function cellCoverage(x, y, cell, px0, py0) {
  const dx = Math.max(px0 - x, x - (px0 + cell), 0);
  const dy = Math.max(py0 - y, y - (py0 + cell), 0);
  return clamp(0.5 - Math.hypot(dx, dy), 0, 1);
}

// ---------------------------------------------------------------------------
// Icon renderer
// ---------------------------------------------------------------------------
function renderIcon(size, { rounded = true, designScale = 0.86 } = {}) {
  const px = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const bgRadius = rounded ? size * 0.2 : 0;

  // Content geometry (scaled for maskable safe-zone via designScale)
  const ringR = size * 0.3 * designScale;
  const ringW = size * 0.016 * designScale;
  const cell = (size * 0.038) * designScale; // digit cell size
  const digitW = 5 * cell;
  const digitH = 7 * cell;
  const textX = cx - digitW - cell * 0.35;
  const textY = cy - digitH / 2;

  for (let y = 0; y < size; y++) {
    const t = y / (size - 1);
    const bgR = lerp(TOP[0], BOTTOM[0], t);
    const bgG = lerp(TOP[1], BOTTOM[1], t);
    const bgB = lerp(TOP[2], BOTTOM[2], t);
    for (let x = 0; x < size; x++) {
      const cov = rounded ? rrCoverage(x + 0.5, y + 0.5, size, size, bgRadius) : 1;
      if (cov <= 0) continue;

      let r = bgR;
      let g = bgG;
      let b = bgB;
      let alpha = cov;

      // Decagon interior tint (subtle, gives the die body presence)
      const inDist = Math.hypot(x - cx, y - cy) - ringR * 0.92;
      if (inDist < 0) {
        const tint = clamp(-inDist / (ringR * 0.92), 0, 1) * 0.05;
        r = lerp(r, WHITE[0], tint);
        g = lerp(g, WHITE[1], tint);
        b = lerp(b, WHITE[2], tint);
      }

      // Decagon ring (white)
      const ringCov = clamp(0.5 - decagonRingDist(x + 0.5, y + 0.5, cx, cy, ringR, ringW), 0, 1);
      if (ringCov > 0) {
        r = lerp(r, WHITE[0], ringCov);
        g = lerp(g, WHITE[1], ringCov);
        b = lerp(b, WHITE[2], ringCov);
      }

      // "20" glyphs (amber)
      let glyphCov = 0;
      const cols = ["2", "0"];
      for (let d = 0; d < 2; d++) {
        const gx = textX + d * (digitW + cell * 0.7);
        const grid = DIGITS[cols[d]];
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[0].length; col++) {
            if (grid[row][col] !== "1") continue;
            const cov2 = cellCoverage(x + 0.5, y + 0.5, cell, gx + col * cell, textY + row * cell);
            glyphCov = Math.max(glyphCov, cov2);
          }
        }
      }
      if (glyphCov > 0) {
        r = lerp(r, AMBER[0], glyphCov);
        g = lerp(g, AMBER[1], glyphCov);
        b = lerp(b, AMBER[2], glyphCov);
      }

      const idx = (y * size + x) * 4;
      px[idx] = Math.round(r);
      px[idx + 1] = Math.round(g);
      px[idx + 2] = Math.round(b);
      px[idx + 3] = Math.round(255 * alpha);
    }
  }
  return px;
}

// ---------------------------------------------------------------------------
// Write outputs
// ---------------------------------------------------------------------------
const outDir = join(ROOT, "public", "icons");
mkdirSync(outDir, { recursive: true });

const S = 512;
const base = renderIcon(S); // rounded, design at 86%
writeFileSync(join(outDir, "icon-512.png"), encodePNG(S, S, base));
writeFileSync(join(outDir, "icon-192.png"), encodePNG(192, 192, downscale(base, S, 192)));

// Maskable — full bleed, design inside the 80% safe circle
const maskable = renderIcon(S, { rounded: false, designScale: 0.62 });
writeFileSync(join(outDir, "icon-512-maskable.png"), encodePNG(S, S, maskable));

// iOS apple-touch-icon — full bleed, no rounding (iOS masks it), 180px
const apple = renderIcon(S, { rounded: false, designScale: 0.8 });
writeFileSync(join(ROOT, "public", "apple-touch-icon.png"), encodePNG(180, 180, downscale(apple, S, 180)));

console.log("Icons written to public/icons/ and public/apple-touch-icon.png");
