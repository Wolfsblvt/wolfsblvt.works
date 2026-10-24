// Scale and alignment by silhouette rather than by bounding box.
//
// A bounding box is decided by the outermost pixel: an ear tip, the tail tuft, a flared capelet. Two drawings of the
// same standing Yoru with slightly longer ears get different box heights, and a scale set from them makes him visibly
// shrink or grow between clips. Matching the whole silhouette against the canonical base, and aligning frames by how
// much of their silhouettes overlap, follows the body instead of its extremities.

/** Alpha channel of an RGBA buffer as 0..1 values. */
export function alphaMask(rgba, width, height) {
  const mask = new Float32Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = rgba[i * 4 + 3] / 255;
  return mask;
}

/** Area-averaged resample of a mask to a new size. */
export function resample(mask, width, height, toWidth, toHeight) {
  const out = new Float32Array(toWidth * toHeight);
  const sx = width / toWidth, sy = height / toHeight;
  for (let y = 0; y < toHeight; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < toWidth; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let sum = 0, n = 0;
      for (let yy = y0; yy < Math.min(y1, height); yy++) {
        for (let xx = x0; xx < Math.min(x1, width); xx++) { sum += mask[yy * width + xx]; n++; }
      }
      out[y * toWidth + x] = n ? sum / n : 0;
    }
  }
  return out;
}

/**
 * Overlap of two masks of equal height, the second shifted by `dx`, both standing on their bottom edge:
 * intersection over union, 0..1.
 */
function overlapAt(a, aw, b, bw, height, dx) {
  let inter = 0, union = 0;
  const left = Math.min(0, dx), right = Math.max(aw, bw + dx);
  for (let y = 0; y < height; y++) {
    for (let x = left; x < right; x++) {
      const va = x >= 0 && x < aw ? a[y * aw + x] : 0;
      const bx = x - dx;
      const vb = bx >= 0 && bx < bw ? b[y * bw + bx] : 0;
      inter += Math.min(va, vb);
      union += Math.max(va, vb);
    }
  }
  return union ? inter / union : 0;
}

/**
 * The scale at which a frame best matches the reference silhouette.
 *
 * @param {{ mask: Float32Array, width: number, height: number }} frame  the frame's solid bounds, cropped
 * @param {{ mask: Float32Array, width: number, height: number }} ref    the reference, cropped, at master scale
 * @param {number} guess  starting scale (from bounding-box heights)
 * @returns {{ scale: number, score: number }}
 */
export function matchScale(frame, ref, guess, { work = 96, spread = 0.18, steps = 37 } = {}) {
  // Compare at a small working size: the reference is `work` px tall, everything else follows its proportion.
  const k = work / ref.height;
  const refW = Math.max(1, Math.round(ref.width * k));
  const refSmall = resample(ref.mask, ref.width, ref.height, refW, work);
  let best = { scale: guess, score: -1 };
  for (let i = 0; i < steps; i++) {
    const scale = guess * (1 - spread + (2 * spread * i) / (steps - 1));
    const h = Math.max(1, Math.round(frame.height * scale * k));
    const w = Math.max(1, Math.round(frame.width * scale * k));
    const small = resample(frame.mask, frame.width, frame.height, w, h);
    // stand both on the same bottom line inside a common height
    const H = Math.max(h, work);
    const a = padTop(refSmall, refW, work, H);
    const b = padTop(small, w, h, H);
    for (let dx = -Math.round(work * 0.3); dx <= Math.round(work * 0.3); dx++) {
      const score = overlapAt(a, refW, b, w, H, dx + Math.round((refW - w) / 2));
      if (score > best.score) best = { scale, score };
    }
  }
  return best;
}

function padTop(mask, width, height, toHeight) {
  if (height === toHeight) return mask;
  const out = new Float32Array(width * toHeight);
  out.set(mask, (toHeight - height) * width);
  return out;
}

/**
 * Horizontal offsets that keep a sequence of registered cells steady: each frame is shifted to overlap its reference
 * (the previous frame, or the first one for a loop) as much as possible. Returns one dx per frame, in cell pixels.
 *
 * @param {Float32Array[]} masks  alpha masks of the cells, all `width` × `height`
 * @param {'chain' | 'first' | 'none'} mode
 */
export function stabilize(masks, width, height, mode, { reach = 40, factor = 2 } = {}) {
  const offsets = masks.map(() => 0);
  if (mode === 'none' || masks.length < 2) return offsets;
  const w = Math.round(width / factor), h = Math.round(height / factor);
  const small = masks.map((m) => resample(m, width, height, w, h));
  const r = Math.round(reach / factor);
  for (let i = 1; i < small.length; i++) {
    const refIndex = mode === 'first' ? 0 : i - 1;
    // The reference has already moved by its own offset; this frame's offset d overlaps it at relative shift d - that.
    const refShift = Math.round(offsets[refIndex] / factor);
    let best = refShift, bestScore = -1;
    for (let d = refShift - r; d <= refShift + r; d++) {
      // a small preference for the generator's own placement breaks near-ties
      const score = overlapAt(small[refIndex], w, small[i], w, h, d - refShift) - Math.abs(d) * 0.0005;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    offsets[i] = best * factor;
  }
  // A chained transition must still start and end where its neighbours expect it: remove the accumulated drift
  // evenly, keeping only the frame-to-frame steadiness.
  if (mode === 'chain') {
    const drift = offsets.at(-1);
    for (let i = 0; i < offsets.length; i++) offsets[i] = Math.round(offsets[i] - (drift * i) / (offsets.length - 1));
  }
  return offsets;
}

/**
 * A coarse colour signature of the opaque pixels: a normalised histogram over hue, saturation and value. Yoru's
 * identity is mostly palette (charcoal fur, plum capelet, copper and blue hair); a generation that drifts to brown
 * fur or pink ears changes this signature before anything else.
 */
export function colourSignature(rgba, count) {
  const H = 12, S = 4, V = 4;
  const bins = new Float64Array(H * S * V);
  let total = 0;
  for (let i = 0; i < count; i++) {
    const a = rgba[i * 4 + 3];
    if (a < 200) continue;
    const r = rgba[i * 4] / 255, g = rgba[i * 4 + 1] / 255, b = rgba[i * 4 + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d > 0) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    const s = max ? d / max : 0;
    const bin = Math.min(H - 1, Math.floor((h / 6) * H)) * S * V + Math.min(S - 1, Math.floor(s * S)) * V + Math.min(V - 1, Math.floor(max * V));
    bins[bin]++; total++;
  }
  if (total) for (let i = 0; i < bins.length; i++) bins[i] /= total;
  return bins;
}

/** Hellinger distance between two signatures: 0 identical, 1 nothing in common. */
export function signatureDistance(a, b) {
  let bc = 0;
  for (let i = 0; i < a.length; i++) bc += Math.sqrt(a[i] * b[i]);
  return Math.sqrt(Math.max(0, 1 - bc));
}

/** Shifts an RGBA cell horizontally by dx pixels, filling with transparency. */
export function shiftCell(rgba, width, height, dx) {
  if (!dx) return rgba;
  const out = new Uint8Array(rgba.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = x - dx;
      if (sx < 0 || sx >= width) continue;
      out.set(rgba.subarray((y * width + sx) * 4, (y * width + sx) * 4 + 4), (y * width + x) * 4);
    }
  }
  return out;
}
