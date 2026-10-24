import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { serveStudio } from '../../tools/yoru-studio/lib/server.mjs';
import { paths } from '../../tools/yoru-studio/lib/spec.mjs';
import { keyResidue, matteKey, unmix } from '../../tools/yoru-studio/lib/matte.mjs';
import { findCuts, placeFrames, splitFrames } from '../../tools/yoru-studio/lib/register.mjs';
import { clipDurations, frameCount, frameScript } from '../../tools/yoru-studio/lib/spec.mjs';

const KEY = [255, 0, 255];

describe('the local studio server', () => {
  let root, p, server, port;
  const family = () => JSON.parse(readFileSync(join(p.families, 'presence.json'), 'utf8'));
  const edit = { family: 'presence', clip: 'run-left', tempo: 1.2, stride: 144 };
  const send = (path, body, headers = {}, chunked = false) => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method: body === undefined ? 'GET' : 'POST',
      headers: { 'content-type': 'application/json', ...headers } }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { text += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, text }));
    });
    req.on('error', reject);
    if (chunked) req.write(body);
    req.end(chunked ? undefined : body);
  });

  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), 'yoru-server-'));
    p = paths(root);
    for (const dir of [p.families, p.sheets, p.work, `${p.work}-sibling`, `${p.sheets}-sibling`, join(root, 'design/the-walk/assets'), join(root, 'design/the-walk/assets-sibling')]) mkdirSync(dir, { recursive: true });
    writeFileSync(join(p.families, 'presence.json'), JSON.stringify({ family: 'presence', clips: [{ id: 'run-left', frames: 2 }] }));
    writeFileSync(join(p.sheets, 'sheet.json'), '{}');
    writeFileSync(join(`${p.sheets}-sibling`, 'private.json'), 'sibling');
    writeFileSync(join(`${p.work}-sibling`, 'private.json'), 'sibling');
    writeFileSync(join(root, 'design/the-walk/assets-sibling/private.json'), 'sibling');
    server = await serveStudio({ root, paths: p, port: 0, preview: async () => { throw new Error(`private stack ${root}`); }, tempoBoard: () => [] });
    port = server.address().port;
  });
  afterAll(async () => {
    if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    if (root) rmSync(root, { recursive: true, force: true });
  });

  it('binds only IPv4 loopback and permits a same-origin JSON edit to the selected source', async () => {
    expect(server.address().address).toBe('127.0.0.1');
    const response = await send('/tempo/save', JSON.stringify(edit), { origin: `http://127.0.0.1:${port}` });
    expect(response.status).toBe(204);
    expect(family().clips[0]).toMatchObject({ tempo: 1.2, stride: 144 });
    expect((await send('/sheets/sheet.json')).status).toBe(200);
  });

  it('rejects Host, foreign or null Origin, simple content types and oversized fixed/chunked bodies without writing', async () => {
    const before = family();
    for (const [headers, status] of [
      [{ host: 'evil.example' }, 403], [{ origin: 'https://evil.example' }, 403], [{ origin: 'null' }, 403],
      [{ 'content-type': 'text/plain' }, 415], [{ 'content-type': 'application/x-www-form-urlencoded' }, 415],
    ]) expect((await send('/tempo/save', JSON.stringify(edit), headers)).status).toBe(status);
    const large = ' '.repeat(4097);
    expect((await send('/tempo/save', large, { 'content-length': large.length })).status).toBe(413);
    expect((await send('/tempo/save', large, {}, true)).status).toBe(413);
    expect(family()).toEqual(before);
  });

  it('rejects malformed or out-of-range edits in full, including non-numeric and non-finite JSON values', async () => {
    const before = family();
    for (const invalid of [
      { tempo: '1' }, { tempo: -1 }, { tempo: 0.24 }, { tempo: 3.01 }, { tempo: null },
      { stride: -2 }, { stride: 0 }, { stride: 241 }, { stride: '144' }, { stride: null },
      { family: '../presence' }, { clip: 'missing' },
    ]) expect((await send('/tempo/save', JSON.stringify({ ...edit, ...invalid }))).status).toBe(400);
    for (const raw of ['{', 'null', JSON.stringify(edit).replace('1.2', '1e999')]) expect((await send('/tempo/save', raw)).status).toBe(400);
    expect(family()).toEqual(before);
    expect((await send('/tempo/save', JSON.stringify({ ...edit, tempo: 0.25, stride: 20 }))).status).toBe(204);
    expect((await send('/tempo/save', JSON.stringify({ ...edit, tempo: 3, stride: 240 }))).status).toBe(204);
  });

  it('contains decoded static paths at directory segments and hides internal errors', async () => {
    for (const path of ['/sheets/%2e%2e%2fsheets-sibling/private.json', '/walk-assets/%2e%2e%2fassets-sibling/private.json', '/%2e%2e%2fyoru-studio-sibling/private.json']) {
      expect((await send(path)).status).toBe(404);
    }
    const error = await send('/preview/');
    expect(error).toEqual({ status: 500, text: 'Studio request failed.' });
    expect((await send('/%ZZ')).status).toBe(400);
  });
});

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

  it('runs a whole clip faster or slower by its tempo, keeping the rhythm between beats', () => {
    expect(clipDurations({ ...clip, tempo: 0.5 })).toEqual([300, 300, 200, 200, 800]);
  });
});
