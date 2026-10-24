// Cutting a matted strip into frames and registering them on one shared scale.
//
// The May pipeline scaled every frame to fill its cell, so sitting Yoru was as tall as standing Yoru and the whole
// row jumped in size between states. Here a clip has one scale for all its frames, derived from a frame whose real
// height is known (standing Yoru, or the matching frame of a neighbouring clip), and each frame keeps its feet on the
// cell's floor line and its body on the cell's pivot.

/** Opaque enough to count as part of the sprite. */
const SOLID = 16;

/**
 * Finds the cut positions between `count` items along one axis, preferring empty or nearly empty columns (or rows)
 * close to the equal-slot positions the generator was asked to use.
 *
 * @param {Float64Array} profile  opacity sum per column (or row)
 * @param {number} count
 * @returns {number[]}  count + 1 boundaries, starting at 0 and ending at profile.length
 */
export function findCuts(profile, count) {
  const length = profile.length;
  const slot = length / count;
  const cuts = [0];
  for (let i = 1; i < count; i++) {
    const ideal = Math.round(i * slot);
    const reach = Math.round(slot * 0.3);
    let best = ideal;
    let bestScore = Infinity;
    for (let x = Math.max(cuts[i - 1] + 1, ideal - reach); x <= Math.min(length - 1, ideal + reach); x++) {
      // Emptiness dominates; distance from the ideal only breaks ties between similarly empty lines.
      const score = profile[x] + Math.abs(x - ideal) * 0.5;
      if (score < bestScore) { bestScore = score; best = x; }
    }
    cuts.push(best);
  }
  cuts.push(length);
  return cuts;
}

/** Opacity profile of an RGBA region along x (`axis` 'x') or y. */
export function opacityProfile(rgba, width, height, axis) {
  const profile = new Float64Array(axis === 'x' ? width : height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = rgba[(y * width + x) * 4 + 3];
      if (a > SOLID) profile[axis === 'x' ? x : y] += a / 255;
    }
  }
  return profile;
}

/** Bounding box of solid pixels, or null when the region is empty. */
export function solidBounds(rgba, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rgba[(y * width + x) * 4 + 3] <= SOLID) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Splits a strip laid out as `rows` × `cols` into frames, reading left to right, top to bottom.
 *
 * Grid rows are separated by their emptiest lines. Within a row, frames are assembled from connected pieces rather than
 * cut with straight lines: a running pose's tail can reach past the next frame's nose in x without touching it, and a
 * straight cut would slice one of them. Each piece belongs to the slot its centre falls in. A slot left without pieces
 * falls back to a straight cut so the frame count holds and QA reports the problem.
 *
 * @returns {Array<{ pixels: Uint8Array, region: {left:number,top:number,width:number,height:number},
 *                   slotCenterX: number, specks: number }>}  pixels cover `region`, in strip coordinates
 */
export function splitFrames(rgba, width, height, { cols, rows = 1 }) {
  const rowCuts = rows === 1 ? [0, height] : findCuts(opacityProfile(rgba, width, height, 'y'), rows);
  const slotWidth = width / cols;
  const frames = [];
  for (let r = 0; r < rows; r++) {
    const top = rowCuts[r];
    const bandHeight = rowCuts[r + 1] - top;
    const band = crop(rgba, width, { left: 0, top, width, height: bandHeight });
    const { label, pieces } = components(band, width, bandHeight);
    const largest = Math.max(0, ...pieces.map((p) => p.size));
    const owner = pieces.map((p) => (p.size < largest * 0.004 ? -1 : Math.min(cols - 1, Math.floor(p.cx / slotWidth))));
    const colCuts = findCuts(opacityProfile(band, width, bandHeight, 'x'), cols);
    for (let c = 0; c < cols; c++) {
      const mine = new Set(owner.flatMap((o, id) => (o === c ? [id] : [])));
      const specks = pieces.reduce((n, p, id) => n + (owner[id] === -1 && Math.floor(p.cx / slotWidth) === c ? p.size : 0), 0);
      let region;
      let pixels;
      if (mine.size) {
        const bounds = unionBounds([...mine].map((id) => pieces[id]));
        region = { left: bounds.left, top, width: bounds.width, height: bandHeight };
        pixels = new Uint8Array(region.width * region.height * 4);
        for (let y = 0; y < bandHeight; y++) {
          for (let x = region.left; x < region.left + region.width; x++) {
            const i = y * width + x;
            if (!mine.has(label[i]) && !(label[i] === -1 && nearOwned(label, mine, width, bandHeight, x, y))) continue;
            pixels.set(band.subarray(i * 4, i * 4 + 4), (y * region.width + (x - region.left)) * 4);
          }
        }
      } else {
        region = { left: colCuts[c], top, width: colCuts[c + 1] - colCuts[c], height: bandHeight };
        pixels = crop(band, width, { ...region, top: 0 });
      }
      frames.push({ pixels, region, slotCenterX: (c + 0.5) * slotWidth, specks });
    }
  }
  return frames;
}

/** Faint (unlabelled) edge pixels go with the piece they border. */
function nearOwned(label, mine, width, height, x, y) {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
      if (mine.has(label[yy * width + xx])) return true;
    }
  }
  return false;
}

/** 4-connected solid pieces with size, centre and bounds. Unlabelled pixels are -1. */
function components(rgba, width, height) {
  const label = new Int32Array(width * height).fill(-1);
  const pieces = [];
  const stack = [];
  for (let start = 0; start < width * height; start++) {
    if (label[start] !== -1 || rgba[start * 4 + 3] <= SOLID) continue;
    const id = pieces.length;
    let size = 0, sx = 0, minX = width, maxX = -1, minY = height, maxY = -1;
    label[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop();
      const x = i % width, y = (i - x) / width;
      size++; sx += x;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (const n of [i + 1, i - 1, i + width, i - width]) {
        if (n < 0 || n >= width * height) continue;
        if ((n === i + 1 && x === width - 1) || (n === i - 1 && x === 0)) continue;
        if (label[n] !== -1 || rgba[n * 4 + 3] <= SOLID) continue;
        label[n] = id;
        stack.push(n);
      }
    }
    pieces.push({ size, cx: sx / size, left: minX, right: maxX, top: minY, bottom: maxY });
  }
  return { label, pieces };
}

function unionBounds(pieces) {
  const left = Math.min(...pieces.map((p) => p.left));
  const right = Math.max(...pieces.map((p) => p.right));
  return { left, width: right - left + 1 };
}

/** Copies a rectangle out of an RGBA buffer. */
export function crop(rgba, width, { left, top, width: w, height: h }) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const from = ((top + y) * width + left) * 4;
    out.set(rgba.subarray(from, from + w * 4), y * w * 4);
  }
  return out;
}

/**
 * Computes where each frame lands in its cell.
 *
 * @param {Array<{ bounds: {left:number,top:number,width:number,height:number}, slotCenterX: number }>} frames
 *   bounds and slot centre in strip coordinates, after cutting
 * @param {{ scale: number, cell: {width:number,height:number}, pivot: {x:number,y:number},
 *           ground: 'frame' | 'clip', anchor: 'slot' | 'bounds' }} placement
 * @returns {Array<{ left: number, top: number, scale: number, clipped: boolean }>}
 *   top-left of the scaled frame bounds in cell coordinates
 */
export function placeFrames(frames, { scale, cell, pivot, ground, anchor }) {
  const clipFloor = Math.max(...frames.map((f) => f.bounds.top + f.bounds.height));
  return frames.map((f) => {
    const centreX = anchor === 'bounds' ? f.bounds.left + f.bounds.width / 2 : f.slotCenterX;
    const floor = ground === 'clip' ? clipFloor : f.bounds.top + f.bounds.height;
    const left = Math.round(pivot.x + (f.bounds.left - centreX) * scale);
    const top = Math.round(pivot.y - (floor - f.bounds.top) * scale);
    const w = Math.round(f.bounds.width * scale);
    const h = Math.round(f.bounds.height * scale);
    const clipped = left < 0 || top < 0 || left + w > cell.width || top + h > cell.height;
    return { left, top, width: w, height: h, clipped };
  });
}
