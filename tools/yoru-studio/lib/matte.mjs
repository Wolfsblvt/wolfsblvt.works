// Chroma-key matting for generated strips.
//
// The generator paints Yoru on a flat key colour. A hard threshold (what the May pipeline used) leaves every edge pixel
// that mixed fur with the key as an opaque purple fringe, which is the outline visible around the v1 sprites. Here each
// edge pixel is un-mixed instead: its alpha is how far it sits from the local background towards the local foreground
// colour, and its colour is what remains once that share of background is removed.

const DEFAULTS = {
  /** Distance to the key below which a pixel is background. */
  background: 70,
  /** Distance to the key above which a pixel is foreground, unless it touches background. */
  foreground: 170,
  /** How far from background an uncertain pixel may sit and still be treated as an edge. */
  edgeRadius: 3,
  /** Neighbourhood used to estimate the local foreground and background colours. */
  sampleRadius: 4,
  /** Alpha below this is dropped entirely. */
  minAlpha: 0.08,
};

/** Pixel classes: 0 background, 1 uncertain, 2 foreground on the edge, 3 interior foreground. */
const INTERIOR = 3;

/** Euclidean RGB distance. */
const distance = (r, g, b, k) => Math.hypot(r - k[0], g - k[1], b - k[2]);

/**
 * Turns an RGBA buffer painted on a flat key colour into a straight-alpha RGBA buffer. The input is not modified.
 * Fully transparent output pixels carry no colour, so nothing leaks back when the image is resized or composited.
 *
 * @param {Uint8Array | Buffer} rgba  width × height × 4 bytes
 * @param {number} width
 * @param {number} height
 * @param {[number, number, number]} key
 * @param {Partial<typeof DEFAULTS>} [options]
 * @returns {{ data: Uint8Array, edgePixels: number, keyedPixels: number }}
 */
export function matteKey(rgba, width, height, key, options = {}) {
  const o = { ...DEFAULTS, ...options };
  const count = width * height;
  const cls = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const d = distance(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], key);
    cls[i] = d < o.background ? 0 : d > o.foreground ? 2 : 1;
  }

  // Distance (in pixels, chessboard) to the nearest background pixel, capped: only pixels close to background are edges.
  const near = nearBackground(cls, width, height, o.edgeRadius);
  // Foreground colour is estimated from the interior only: pixels on the edge are the mixed ones being solved for.
  for (let i = 0; i < count; i++) if (cls[i] === 2 && !near[i]) cls[i] = INTERIOR;

  const out = new Uint8Array(count * 4);
  let edgePixels = 0;
  let keyedPixels = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const p = i * 4;
      if (cls[i] === 0) { keyedPixels++; continue; }
      if (!near[i]) {
        out[p] = rgba[p]; out[p + 1] = rgba[p + 1]; out[p + 2] = rgba[p + 2]; out[p + 3] = 255;
        continue;
      }
      edgePixels++;
      const fg = meanOf(rgba, cls, width, height, x, y, o.sampleRadius, INTERIOR)
        ?? meanOf(rgba, cls, width, height, x, y, o.sampleRadius * 2, INTERIOR);
      const bg = meanOf(rgba, cls, width, height, x, y, o.sampleRadius, 0) ?? key;
      if (!fg) continue; // an isolated speck of near-key colour with no body nearby
      const [a, colour] = unmix([rgba[p], rgba[p + 1], rgba[p + 2]], fg, bg);
      if (a < o.minAlpha) continue;
      out[p] = colour[0]; out[p + 1] = colour[1]; out[p + 2] = colour[2]; out[p + 3] = Math.round(a * 255);
    }
  }
  return { data: out, edgePixels, keyedPixels };
}

/**
 * Splits an observed colour into alpha and foreground colour, given estimates of the foreground and background colours
 * either side of the edge: alpha is the projection of (observed − bg) onto (fg − bg).
 */
export function unmix(observed, fg, bg) {
  const span = [fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]];
  const lengthSq = span[0] ** 2 + span[1] ** 2 + span[2] ** 2;
  if (lengthSq < 1) return [1, observed];
  const rel = [observed[0] - bg[0], observed[1] - bg[1], observed[2] - bg[2]];
  const a = Math.min(1, Math.max(0, (rel[0] * span[0] + rel[1] * span[1] + rel[2] * span[2]) / lengthSq));
  if (a <= 0) return [0, fg];
  // Remove the background's share; clamp to the plausible range between the estimate and the observation.
  const colour = observed.map((v, c) => clampByte((v - (1 - a) * bg[c]) / a));
  return [a, colour];
}

function nearBackground(cls, width, height, radius) {
  const near = new Uint8Array(cls.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (cls[i] === 0) continue;
      search: for (let dy = -radius; dy <= radius; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= height) continue;
        for (let dx = -radius; dx <= radius; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= width) continue;
          if (cls[yy * width + xx] === 0) { near[i] = 1; break search; }
        }
      }
    }
  }
  return near;
}

function meanOf(rgba, cls, width, height, x, y, radius, want) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let dy = -radius; dy <= radius; dy++) {
    const yy = y + dy;
    if (yy < 0 || yy >= height) continue;
    for (let dx = -radius; dx <= radius; dx++) {
      const xx = x + dx;
      if (xx < 0 || xx >= width) continue;
      const i = yy * width + xx;
      if (cls[i] !== want) continue;
      r += rgba[i * 4]; g += rgba[i * 4 + 1]; b += rgba[i * 4 + 2]; n++;
    }
  }
  return n ? [r / n, g / n, b / n] : null;
}

const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Parses `#RRGGBB`. */
export function parseHex(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`Not a #RRGGBB colour: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/**
 * Counts visible pixels that still lean towards the key's hue: the residue a viewer sees as a purple outline. Used by
 * the QA report, not by the matte itself.
 */
export function keyResidue(rgba, width, height, key, { minAlpha = 24, tolerance = 110 } = {}) {
  let residue = 0;
  for (let i = 0; i < width * height; i++) {
    const a = rgba[i * 4 + 3];
    if (a < minAlpha || a === 255) continue; // only semi-transparent edge pixels show a fringe
    if (distance(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], key) < tolerance) residue++;
  }
  return residue;
}
