import { describe, expect, it } from 'vitest';
import { keyResidue, matteKey, unmix } from '../../tools/yoru-studio/lib/matte.mjs';
import { findCuts, placeFrames, splitFrames } from '../../tools/yoru-studio/lib/register.mjs';
import { clipDurations, frameCount, frameScript } from '../../tools/yoru-studio/lib/spec.mjs';

const KEY = [255, 0, 255];

/** An image filled with the key colour, with rectangles painted on it. */
function canvas(width, height, rects) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([...KEY, 255], i * 4);
  for (const [x0, y0, w, h, colour] of rects) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) data.set([...colour, 255], (y * width + x) * 4);
  }
  return data;
}

describe('chroma matte', () => {
  it('un-mixes an edge pixel into partial alpha and its foreground colour', () => {
    const fg = [20, 20, 24];
    const half = fg.map((v, c) => (v + KEY[c]) / 2);
    const [alpha, colour] = unmix(half, fg, KEY);
    expect(alpha).toBeCloseTo(0.5, 2);
    colour.forEach((v, c) => expect(Math.abs(v - fg[c])).toBeLessThanOrEqual(1));
  });

  it('clears the background, keeps the body opaque and leaves no magenta fringe', () => {
    const width = 40, height = 20;
    const data = canvas(width, height, [[10, 5, 20, 10, [20, 20, 24]]]);
    // a column of half-mixed pixels along the left edge, the fringe a hard threshold leaves behind
    for (let y = 5; y < 15; y++) data.set([137, 10, 140, 255], (y * width + 9) * 4);
    const { data: out } = matteKey(data, width, height, KEY);
    expect(out[(0 * width + 0) * 4 + 3]).toBe(0);
    expect(out[(10 * width + 20) * 4 + 3]).toBe(255);
    const edgeAlpha = out[(10 * width + 9) * 4 + 3];
    expect(edgeAlpha).toBeGreaterThan(80);
    expect(edgeAlpha).toBeLessThan(180);
    expect(keyResidue(out, width, height, KEY)).toBe(0);
  });

  it('keeps plum interior colours that sit closer to the key than black does', () => {
    const plum = [92, 44, 110];
    const data = canvas(30, 30, [[5, 5, 20, 20, plum]]);
    const { data: out } = matteKey(data, 30, 30, KEY);
    expect([...out.subarray((15 * 30 + 15) * 4, (15 * 30 + 15) * 4 + 4)]).toEqual([...plum, 255]);
  });
});

describe('frame cutting', () => {
  it('prefers the emptiest column near each equal-slot position', () => {
    const profile = new Float64Array(100).fill(5);
    profile[47] = 0;
    expect(findCuts(profile, 2)).toEqual([0, 47, 100]);
  });

  it('keeps pieces whole when neighbouring frames overlap in columns', () => {
    // frame 1 reaches past the slot boundary at x=50 on top; frame 2 starts at x=45 lower down, without touching
    const width = 100, height = 40;
    const solid = canvas(width, height, [[5, 5, 55, 8, [20, 20, 20]], [45, 25, 50, 10, [30, 30, 30]]]);
    const { data } = matteKey(solid, width, height, KEY);
    const frames = splitFrames(data, width, height, { cols: 2 });
    expect(frames).toHaveLength(2);
    expect(frames[0].region.left).toBeLessThanOrEqual(5);
    expect(frames[0].region.left + frames[0].region.width).toBeGreaterThanOrEqual(60);
    expect(frames[1].region.left).toBeLessThanOrEqual(45);
  });
});

describe('registration', () => {
  it('puts every frame on the floor line and the slot centre on the pivot at one shared scale', () => {
    const placed = placeFrames(
      [
        { bounds: { left: 40, top: 10, width: 20, height: 90 }, slotCenterX: 50 },
        { bounds: { left: 140, top: 50, width: 30, height: 50 }, slotCenterX: 150 },
      ],
      { scale: 2, cell: { width: 320, height: 208 }, pivot: { x: 160, y: 203 }, ground: 'frame', anchor: 'slot' },
    );
    expect(placed.map((p) => p.top + p.height)).toEqual([203, 203]);
    expect(placed[0]).toMatchObject({ left: 140, height: 180, clipped: false });
    expect(placed[1]).toMatchObject({ left: 140, height: 100 });
  });
});

describe('key poses and in-betweens', () => {
  const clip = { id: 'c', beats: ['a', 'b', 'c'], inbetweens: 1, frames: 5, durations: [300, 200, 400] };

  it('expands key poses with in-betweens between them', () => {
    expect(frameCount(clip)).toBe(5);
    expect(frameScript(clip).map((f) => f.key ?? '·')).toEqual([0, '·', 1, '·', 2]);
    expect(frameCount({ ...clip, loop: true, frames: 6 })).toBe(6);
  });

  it('shares each key pose’s time with its in-betweens, so smoothness does not change tempo', () => {
    expect(clipDurations(clip)).toEqual([150, 150, 100, 100, 400]);
  });
});
