#!/usr/bin/env node
// Yoru's sprite studio. See design/yoru/README.md for the authoring guide.
//
//   node tools/yoru-studio/studio.mjs generate <family> <clip> [--count=N] [--retry=N]   draw candidates with Codex
//   node tools/yoru-studio/studio.mjs process  <family> [clip]               matte, cut and register every run
//   node tools/yoru-studio/studio.mjs select   <family> <clip> <run>         choose the run that becomes the clip
//   node tools/yoru-studio/studio.mjs pack     <family>                      write design/yoru/sheets/<family>.*
//   node tools/yoru-studio/studio.mjs import   <family> <clip> <png> [run]   bring an existing strip in as a run
//   node tools/yoru-studio/studio.mjs preview                                write the studio page
//   node tools/yoru-studio/studio.mjs serve [--port=4390]                    serve it, fresh on every load
//   node tools/yoru-studio/studio.mjs montage  <family> [clip] [--strips]    one still of every run, for review
//   node tools/yoru-studio/studio.mjs export-codex [--install]               the Codex desktop pet from the selected clips

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { serveStudio, TEMPO_FAMILIES } from './lib/server.mjs';
import { generate, ROUTE } from './lib/codex.mjs';
import { keyMask, keyResidue, matteKey, parseHex } from './lib/matte.mjs';
import { crop, opacityProfile, placeFrames, solidBounds, splitFrames } from './lib/register.mjs';
import { authoredDurations, clipDurations, clipLayout, clipPrompt, identityLock, KEY, loadFamily, makeGuide, paths, PROP_KEY, saveFamily, SCENERY_KEY, STANDING_HEIGHT } from './lib/spec.mjs';
import { writeContact, writePreview } from './lib/preview.mjs';
import { alphaMask, colourSignature, matchScale, shiftCell, signatureDistance, stabilize } from './lib/align.mjs';

/** Colour distance from the canonical base above which a run is flagged as possibly off-model; see processRun. */
const DRIFT_LIMIT = 0.55;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const P = paths(root);

const [command, ...rest] = process.argv.slice(2);
const flags = Object.fromEntries(rest.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const args = rest.filter((a) => !a.startsWith('--'));


// ---------- generate ----------

async function cmdGenerate(familyId, clipId) {
  const family = loadFamily(P, familyId);
  const clip = findClip(family, clipId);
  const count = Number(flags.count ?? 1);
  const lock = identityLock(P.character);
  mkdirSync(P.guides, { recursive: true });
  const guide = await makeGuide(clip, family.cell, join(P.guides, `${familyId}-${clipId}.png`));
  const isProp = family.subject === 'prop';
  const style = join(P.reference, 'style-standing.png');
  const attachments = [
    // The canonical base fixes who he is; the style anchor fixes how he is drawn now. Without it roughly a third of
    // generations drifted to a more ornate, pink-eared cat. A prop gets only the style: it belongs in his world.
    ...(isProp ? [] : [{ path: join(P.reference, 'canonical-base.png'), role: 'Canonical identity reference: this is exactly what Yoru looks like.' }]),
    ...(existsSync(style)
      ? [{ path: style, role: isProp
        ? 'Rendering style reference only: the painterly style, line work and palette of the world this prop belongs to. Do not draw this character.'
        : 'Style reference: Yoru as he is drawn now. Match this exact rendering style, line work, proportions, ear shape, colours and level of detail in every frame.' }]
      : []),
    { path: guide, role: 'Layout guide, for slot count, spacing and the shared floor line only. Do not draw any of its lines, boxes or colours.' },
    ...(await Promise.all((clip.references ?? []).map(resolveReference))),
  ];
  const prompt = clipPrompt({ lock, family, clip, attachments });
  // Two generations at a time at most; each is an independent Codex run.
  const jobs = Array.from({ length: count }, () => () => runOne(familyId, clip, prompt, attachments));
  const results = [];
  for (let i = 0; i < jobs.length; i += 2) results.push(...(await Promise.allSettled(jobs.slice(i, i + 2).map((j) => j()))));
  for (const r of results) {
    if (r.status === 'fulfilled') console.log(`run ${r.value} (${familyId}/${clipId})`);
    else console.error(`failed: ${r.reason.message}`);
  }
  // --retry=N: if every candidate drifted off-model, draw more, up to N extra, until one is clean.
  const clean = (run) => !JSON.parse(readFileSync(join(P.runs, familyId, clipId, run, 'registration.json'), 'utf8')).warnings.some((w) => w.startsWith('colours drift'));
  let retries = Number(flags.retry ?? 0);
  let ok = results.some((r) => r.status === 'fulfilled' && clean(r.value));
  while (!ok && retries-- > 0) {
    try {
      const run = await runOne(familyId, clip, prompt, attachments);
      ok = clean(run);
      console.log(`run ${run} (${familyId}/${clipId}) retry${ok ? '' : ', drifted'}`);
    } catch (error) {
      console.error(`failed: ${error.message}`);
    }
  }
}

async function runOne(familyId, clip, prompt, attachments) {
  const { threadId, outputs, seconds } = await generate({
    prompt,
    images: attachments.map((a) => a.path),
    cwd: P.work,
  });
  const runId = `${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}-${threadId.slice(-8)}`;
  const dir = join(P.runs, familyId, clip.id, runId);
  mkdirSync(dir, { recursive: true });
  copyFileSync(outputs[0], join(dir, 'strip.png'));
  writeFileSync(join(dir, 'prompt.md'), prompt);
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify({
    family: familyId, clip: clip.id, route: ROUTE, threadId, source: outputs[0], extraOutputs: outputs.slice(1),
    seconds, attachments: attachments.map((a) => ({ path: relative(root, a.path).replaceAll('\\', '/'), role: a.role })),
    createdAt: new Date().toISOString(),
  }, null, 2)}\n`);
  await processRun(loadFamily(P, familyId), clip, dir);
  return runId;
}

/** A clip reference is either an image under design/yoru or a registered frame of another clip ("family/clip#n"). */
async function resolveReference(ref) {
  if (ref.image) return { path: join(P.design, ref.image), role: ref.role };
  const m = /^([\w-]+)\/([\w-]+)#(-?\d+)$/.exec(ref.frame ?? '');
  if (!m) throw new Error(`Reference needs "image" or "frame": ${JSON.stringify(ref)}`);
  const frame = selectedFrame(m[1], m[2], Number(m[3]));
  // Shown on the key colour, the way the generator draws, rather than on transparency it might copy as a checkerboard.
  mkdirSync(join(P.work, 'refs'), { recursive: true });
  const out = join(P.work, 'refs', `${m[1]}-${m[2]}-${m[3]}.png`);
  await sharp(frame).flatten({ background: KEY }).png().toFile(out);
  return { path: out, role: ref.role };
}

// ---------- process ----------

async function cmdProcess(familyId, clipId) {
  const family = loadFamily(P, familyId);
  for (const clip of orderByScale(family.clips)) {
    if (clipId && clip.id !== clipId) continue;
    const dir = join(P.runs, familyId, clip.id);
    if (!existsSync(dir)) continue;
    for (const run of readdirSync(dir)) {
      const report = await processRun(family, clip, join(dir, run));
      console.log(`${familyId}/${clip.id} ${run}: scale ${report.scale.toFixed(3)}${report.warnings.length ? ` · ${report.warnings.join(' · ')}` : ''}`);
    }
  }
}

/** Clips whose scale matches another clip of the same family come after that clip. */
function orderByScale(clips) {
  const dependsOn = (c) => {
    const m = /^([\w-]+)#/.exec(c.scale?.match ?? '');
    return m && clips.some((o) => o.id === m[1]) ? m[1] : null;
  };
  const sorted = [];
  const pending = [...clips];
  while (pending.length) {
    const ready = pending.findIndex((c) => !dependsOn(c) || sorted.some((s) => s.id === dependsOn(c)));
    sorted.push(...pending.splice(Math.max(0, ready), 1));
  }
  return sorted;
}

/** Brings an existing strip (an older generation, a hand edit) in as a run, then processes it like any other. */
async function cmdImport(familyId, clipId, png, runId = `import-${basename(png, '.png').slice(-12)}`) {
  const family = loadFamily(P, familyId);
  const clip = findClip(family, clipId);
  const dir = join(P.runs, familyId, clipId, runId);
  mkdirSync(dir, { recursive: true });
  copyFileSync(png, join(dir, 'strip.png'));
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify({ family: familyId, clip: clipId, source: png, importedAt: new Date().toISOString() }, null, 2)}\n`);
  const report = await processRun(family, clip, dir);
  console.log(`run ${runId} (${familyId}/${clipId}): scale ${report.scale.toFixed(3)}${report.warnings.length ? ` · ${report.warnings.join(' · ')}` : ''}`);
}

/**
 * Mattes, cuts and registers one run into `<run>/frames/NN.png`, and writes `<run>/registration.json`.
 */
async function processRun(family, clip, dir) {
  const { data, info } = await sharp(join(dir, 'strip.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const key = parseHex(family.key ?? KEY);
  // A clip with a prop has it painted in the prop key colour: removed like the background, its place remembered.
  // Scenery the action needs (the ledge he climbs down from) is painted in its own key colour the same way: removed,
  // and its top edge can serve as the clip's floor.
  const propKey = clip.prop ? parseHex(family.propKey ?? PROP_KEY) : null;
  const sceneryKey = clip.scenery ? parseHex(SCENERY_KEY) : null;
  const propMask = propKey ? keyMask(data, width, height, propKey) : null;
  const sceneryMask = sceneryKey ? keyMask(data, width, height, sceneryKey) : null;
  const matte = matteKey(data, width, height, [key, propKey, sceneryKey].filter(Boolean));
  const rgba = matte.data;
  const layout = clipLayout(clip);
  const warnings = [];

  const frames = splitFrames(rgba, width, height, layout).map(({ pixels, region, slotCenterX, specks }, i) => {
    const local = solidBounds(pixels, region.width, region.height);
    if (!local) { warnings.push(`frame ${i + 1} empty`); return null; }
    if (specks > 400) warnings.push(`frame ${i + 1} dropped ${specks} px of detached pieces`);
    const cutOff = local.top === 0 || local.top + local.height === region.height || region.left === 0 || region.left + region.width === width;
    if (cutOff) warnings.push(`frame ${i + 1} reaches the edge of the image or its grid row`);
    return {
      pixels, region, local,
      // Vertical position within the frame's own grid row: each row has its own floor line.
      bounds: { left: region.left + local.left, top: local.top, width: local.width, height: local.height },
      slotCenterX,
    };
  });
  if (frames.some((f) => !f)) return writeReport(dir, { scale: 0, warnings, frames: [] });

  const scale = await resolveScale(family, clip, frames, warnings);
  // A second anchor at the clip's end corrects a generator that drew Yoru slowly growing or shrinking across the
  // sheet: the scale moves evenly from the first anchor's value to the one that makes the last frame its known height.
  const endScale = clip.scale?.endHeight ? (STANDING_HEIGHT * clip.scale.endHeight) / frames.at(-1).bounds.height : scale;
  const scaleAt = (i) => scale + ((endScale - scale) * i) / Math.max(1, frames.length - 1);
  const placed = frames.map((f, i) => placeFrames([{ bounds: f.bounds, slotCenterX: f.slotCenterX }], {
    scale: scaleAt(i), cell: family.cell, pivot: family.pivot, ground: 'frame', anchor: clip.anchor ?? 'slot',
  })[0]);
  const ground = clip.ground ?? 'frame';
  if (ground !== 'frame') {
    // Poses that leave the floor keep their height relative to one floor instead of each landing on it: the clip's
    // lowest foot ('clip', for hops), the first frame's feet ('first', stepping down off a ledge) or the last's ('last').
    // ...or the top of the scenery painted in each frame ('scenery': the ledge stays put while he steps off it).
    const bottoms = frames.map((f) => f.bounds.top + f.bounds.height);
    const floors = ground === 'scenery' && sceneryMask
      ? frames.map((f, i) => channelBounds(sceneryMask, width, layout, f, i)?.top ?? bottoms[i])
      : frames.map(() => (ground === 'first' ? bottoms[0] : ground === 'last' ? bottoms.at(-1) : Math.max(...bottoms)));
    placed.forEach((p, i) => { p.top -= Math.round((floors[i] - bottoms[i]) * scaleAt(i)); });
    placed.forEach((p) => { p.clipped = p.left < 0 || p.top < 0 || p.left + p.width > family.cell.width || p.top + p.height > family.cell.height; });
  }

  const { width: cw, height: ch } = family.cell;
  const cells = [];
  const heights = [];
  for (const [i, f] of frames.entries()) {
    const p = placed[i];
    if (p.clipped) warnings.push(`frame ${i + 1} leaves the ${cw}×${ch} cell`);
    const sprite = await sharp(Buffer.from(crop(f.pixels, f.region.width, f.local)), {
      raw: { width: f.local.width, height: f.local.height, channels: 4 },
    }).resize(p.width, p.height, { kernel: 'lanczos3' }).png().toBuffer();
    cells.push(await sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await clampToCell(sprite, p, family.cell), left: Math.max(0, p.left), top: Math.max(0, p.top) }])
      .raw().toBuffer());
    heights.push(p.height);
  }

  // The generator never centres a pose in its slot exactly; keep the body steady by silhouette overlap.
  const mode = clip.stabilize ?? (clip.loop ? 'first' : 'chain');
  const offsets = stabilize(cells.map((c) => alphaMask(c, cw, ch)), cw, ch, mode);
  const moved = Math.max(...offsets.map(Math.abs));
  if (moved > 32) warnings.push(`stabilising moved a frame ${moved} px`);
  const out = join(dir, 'frames');
  mkdirSync(out, { recursive: true });
  for (const [i, cell] of cells.entries()) {
    await sharp(Buffer.from(shiftCell(cell, cw, ch, offsets[i])), { raw: { width: cw, height: ch, channels: 4 } })
      .png().toFile(join(out, `${String(i).padStart(2, '0')}.png`));
  }
  const residue = keyResidue(rgba, width, height, key);
  if (residue > 50) warnings.push(`${residue} edge pixels still lean magenta`);
  const ref = await canonicalRef();
  // Drift is measured against Yoru's colours; a prop has its own.
  const drift = family.subject === 'prop' ? 0 : signatureDistance(colourSignature(rgba, width * height), colourSignature(ref.rgba, ref.width * ref.height));
  if (drift > DRIFT_LIMIT) warnings.push(`colours drift from the canonical Yoru (${drift.toFixed(2)})`);
  else if (drift > DRIFT_LIMIT - 0.07) warnings.push(`check the colours: close to drifting (${drift.toFixed(2)})`);
  const props = propMask ? frames.map((f, i) => propPlacement(propMask, width, layout, f, i, placed[i], scaleAt(i), offsets[i])) : undefined;
  const scenery = sceneryMask ? frames.map((f, i) => propPlacement(sceneryMask, width, layout, f, i, placed[i], scaleAt(i), offsets[i])) : undefined;
  await writeContact(dir, family.cell, family.pivot, await standingCell(), props);
  if (props?.some((p) => !p)) warnings.push(`prop missing in frame(s) ${props.flatMap((p, i) => (p ? [] : [i + 1])).join(', ')}`);
  return writeReport(dir, { scale, endScale, heights, offsets, props, scenery, drift, warnings, edgePixels: matte.edgePixels, residue, placed });
}

/**
 * Where the prop was painted in one frame, in that frame's cell coordinates: its bounds and centre. Prop pixels belong
 * to the frame whose slot (column, and grid row band) they fall in.
 */
function propPlacement(mask, width, layout, f, i, p, scale, dx) {
  const b = channelBounds(mask, width, layout, f, i);
  if (!b) return null;
  const toX = (x) => Math.round(p.left + (x - f.bounds.left) * scale + dx);
  const toY = (y) => Math.round(p.top + (y - f.bounds.top) * scale);
  return { left: toX(b.left), top: toY(b.top), right: toX(b.right), bottom: toY(b.bottom), cx: toX(b.cx), cy: toY(b.cy) };
}

/** Bounds and centre of a key channel within one frame's slot and grid row, in strip x and row-local y. */
function channelBounds(mask, width, layout, f, i) {
  const slotWidth = width / layout.cols;
  const col = i % layout.cols;
  const x0 = Math.floor(col * slotWidth), x1 = Math.floor((col + 1) * slotWidth);
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, sx = 0, sy = 0, n = 0;
  for (let y = f.region.top; y < f.region.top + f.region.height; y++) {
    for (let x = x0; x < x1; x++) {
      if (!mask[y * width + x]) continue;
      const ly = y - f.region.top;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (ly < minY) minY = ly; if (ly > maxY) maxY = ly;
      sx += x; sy += ly; n++;
    }
  }
  return n < 50 ? null : { left: minX, top: minY, right: maxX + 1, bottom: maxY + 1, cx: sx / n, cy: sy / n };
}

/**
 * The canonical base, matted and cropped to its silhouette, at standing height in master pixels: the reference every
 * standing anchor is matched against.
 */
let canonical;
async function canonicalRef() {
  if (canonical) return canonical;
  const { data, info } = await sharp(join(P.reference, 'canonical-base.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const matted = matteKey(data, info.width, info.height, parseHex(KEY)).data;
  const b = solidBounds(matted, info.width, info.height);
  const width = Math.round((b.width * STANDING_HEIGHT) / b.height);
  const rgba = await sharp(Buffer.from(crop(matted, info.width, b)), { raw: { width: b.width, height: b.height, channels: 4 } })
    .resize(width, STANDING_HEIGHT, { kernel: 'lanczos3' }).raw().toBuffer();
  canonical = { rgba, mask: alphaMask(rgba, width, STANDING_HEIGHT), width, height: STANDING_HEIGHT };
  return canonical;
}

/** Standing Yoru for the studio's scale ghost: the canonical base on a 192 × 208 cell, feet at 203. */
let standing;
async function standingCell() {
  if (standing) return standing;
  const c = await canonicalRef();
  standing = await sharp({ create: { width: 192, height: 208, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(Buffer.from(c.rgba), { raw: { width: c.width, height: c.height, channels: 4 } }).png().toBuffer(), left: Math.round(96 - c.width / 2), top: 203 - c.height }])
    .png().toBuffer();
  return standing;
}

/** A frame's silhouette, cropped to its solid bounds. */
function frameSilhouette(f) {
  const pixels = crop(f.pixels, f.region.width, f.local);
  return { mask: alphaMask(pixels, f.local.width, f.local.height), width: f.local.width, height: f.local.height };
}

/** A registered frame of a selected clip, as a silhouette at master scale. */
async function registeredSilhouette(familyId, clipId, n) {
  const { data, info } = await sharp(selectedFrame(familyId, clipId, n)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = solidBounds(data, info.width, info.height);
  return { mask: alphaMask(crop(data, info.width, b), b.width, b.height), width: b.width, height: b.height };
}

/** Crops a scaled sprite to the part that fits the cell, so a clipped frame still composites (and is reported). */
async function clampToCell(sprite, p, cell) {
  if (!p.clipped) return sprite;
  const left = Math.max(0, -p.left), top = Math.max(0, -p.top);
  const width = Math.min(p.width - left, cell.width - Math.max(0, p.left));
  const height = Math.min(p.height - top, cell.height - Math.max(0, p.top));
  return sharp(sprite).extract({ left, top, width, height }).png().toBuffer();
}

/**
 * One scale for the clip, from one anchor frame whose size is known:
 * - `match: "clip#n"`: it shows the same pose as a registered frame of another clip; their silhouettes are matched.
 * - `height: 1` (the default): it is standing Yoru; its silhouette is matched against the canonical base.
 * - any other `height`: its bounding box is that fraction of standing height. A fallback for poses with nothing to
 *   match yet, and the guess the silhouette search starts from.
 */
async function resolveScale(family, clip, frames, warnings) {
  const s = clip.scale ?? { frame: 0, height: 1 };
  const anchor = frames.at(s.frame ?? 0);
  // A prop has a size of its own, in master pixels, along its width or height.
  if (s.pixels) return s.pixels / (s.dimension === 'width' ? anchor.bounds.width : anchor.bounds.height);
  const byHeight = (STANDING_HEIGHT * (s.height ?? 1)) / anchor.bounds.height;
  if (s.match) {
    const m = /^(?:([\w-]+)\/)?([\w-]+)#(-?\d+)$/.exec(s.match);
    const familyId = m?.[1] ?? family.family;
    if (m && selectedRegistration(familyId, m[2])) {
      const ref = await registeredSilhouette(familyId, m[2], Number(m[3]));
      return matchScale(frameSilhouette(anchor), ref, ref.height / anchor.bounds.height).scale;
    }
    warnings.push(`scale match ${s.match} not available yet; used height ${s.height ?? 1}`);
    return byHeight;
  }
  if ((s.height ?? 1) === 1 && !s.byHeight) {
    const { scale, score } = matchScale(frameSilhouette(anchor), await canonicalRef(), byHeight);
    if (score < 0.6) warnings.push(`anchor frame matches standing Yoru poorly (${score.toFixed(2)})`);
    return scale;
  }
  return byHeight;
}

function writeReport(dir, report) {
  writeFileSync(join(dir, 'registration.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

// ---------- select and pack ----------

function cmdSelect(familyId, clipId, runId) {
  const family = loadFamily(P, familyId);
  const clip = findClip(family, clipId);
  if (!existsSync(join(P.runs, familyId, clipId, runId, 'frames'))) throw new Error(`No processed run ${runId}`);
  clip.selected = runId;
  saveFamily(family);
  console.log(`${familyId}/${clipId} → ${runId}`);
}

function selectedRunDir(familyId, clipId) {
  const clip = findClip(loadFamily(P, familyId), clipId);
  return clip.selected ? join(P.runs, familyId, clipId, clip.selected) : null;
}

function selectedRegistration(familyId, clipId) {
  const dir = selectedRunDir(familyId, clipId);
  const file = dir && join(dir, 'registration.json');
  return file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
}

function selectedFrame(familyId, clipId, n) {
  const dir = selectedRunDir(familyId, clipId);
  if (!dir) throw new Error(`${familyId}/${clipId} has no selected run yet`);
  const files = readdirSync(join(dir, 'frames')).filter((f) => f.endsWith('.png')).sort();
  return join(dir, 'frames', files.at(n));
}

/** Packs the selected runs into the family's master sheet (lossless, twice display size) and its manifest. */
async function cmdPack(familyId) {
  const family = loadFamily(P, familyId);
  const clips = family.clips.filter((c) => c.selected);
  const cols = Math.max(...clips.map((c) => c.frames));
  const { width: cw, height: ch } = family.cell;
  const composites = [];
  const manifest = {
    family: familyId,
    title: family.title,
    sheet: `${familyId}.webp`,
    cell: family.cell,
    pivot: family.pivot,
    displayScale: 0.5,
    clips: {},
  };
  clips.forEach((clip, row) => {
    const dir = join(P.runs, familyId, clip.id, clip.selected, 'frames');
    readdirSync(dir).filter((f) => f.endsWith('.png')).sort()
      .forEach((f, col) => composites.push({ input: join(dir, f), left: col * cw, top: row * ch }));
    const durations = clipDurations(clip);
    const reg = JSON.parse(readFileSync(join(P.runs, familyId, clip.id, clip.selected, 'registration.json'), 'utf8'));
    manifest.clips[clip.id] = {
      row, frames: clip.frames, durations, loop: clip.loop ?? false,
      ...(clip.stride && { stride: clip.stride }),
      ...(clip.from && { from: clip.from }), ...(clip.to && { to: clip.to }),
      // Where his feet are in each frame, relative to the pivot: what joins one clip's last pose to the next one's first.
      feet: reg.placed.map((p) => p.top + p.height - family.pivot.y),
      ...(reg.props && { prop: clip.prop.name, props: reg.props }),
      ...(reg.scenery && { scenery: reg.scenery }),
    };
  });
  mkdirSync(P.sheets, { recursive: true });
  await sharp({ create: { width: cols * cw, height: clips.length * ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).webp({ lossless: true, effort: 6 }).toFile(join(P.sheets, `${familyId}.webp`));
  writeFileSync(join(P.sheets, `${familyId}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`packed ${clips.length} clips → design/yoru/sheets/${familyId}.webp`);
}

// ---------- Codex desktop pet ----------

/**
 * The Codex app's pet contract (hatch-pet references/animation-rows.md): one 1536 × 1872 atlas, 8 × 9 cells of
 * 192 × 208, rows in this order with these frame counts, unused cells transparent.
 */
const CODEX_ROWS = [
  { state: 'idle', frames: 6, from: 'presence/idle' },
  { state: 'running-right', frames: 8, from: 'presence/run-right' },
  { state: 'running-left', frames: 8, from: 'presence/run-left' },
  { state: 'waving', frames: 4, from: 'presence/wave' },
  { state: 'jumping', frames: 5, from: 'codex/jumping' },
  { state: 'failed', frames: 8, from: 'codex/failed' },
  { state: 'waiting', frames: 6, from: 'codex/waiting' },
  { state: 'running', frames: 6, from: 'codex/working' },
  { state: 'review', frames: 6, from: 'presence/think' },
];

/**
 * Assembles Yoru's Codex desktop pet from the selected clips: evenly spaced frames to fit each state's count, one
 * scale per row (never per frame, which made the May pet pop in size), feet on a shared floor. Writes
 * artifacts/yoru-studio/codex-pet/; with --install, also replaces ~/.codex/pets/yoru after keeping the old pet in
 * ~/.codex/pets-backup/.
 */
async function cmdExportCodex() {
  const CW = 192, CH = 208;
  const out = join(P.work, 'codex-pet');
  mkdirSync(out, { recursive: true });
  const layers = [];
  for (const [row, spec] of CODEX_ROWS.entries()) {
    const [familyId, clipId] = spec.from.split('/');
    const family = loadFamily(P, familyId);
    const clip = findClip(family, clipId);
    if (!clip.selected) throw new Error(`${spec.from} has no selected run for Codex row ${spec.state}`);
    const n = clip.frames;
    const picks = Array.from({ length: spec.frames }, (_, i) => (clip.loop ? Math.floor((i * n) / spec.frames) : Math.round((i * (n - 1)) / Math.max(1, spec.frames - 1))));
    const cells = await Promise.all(picks.map(async (k) => {
      const { data, info } = await sharp(selectedFrame(familyId, clipId, k)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      return { data, info, bounds: solidBounds(data, info.width, info.height) };
    }));
    // One scale and offset for the whole row, from the union of its frames around the clip's pivot.
    const union = cells.reduce((u, c) => ({
      left: Math.min(u.left, c.bounds.left), top: Math.min(u.top, c.bounds.top),
      right: Math.max(u.right, c.bounds.left + c.bounds.width), bottom: Math.max(u.bottom, c.bounds.top + c.bounds.height),
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const scale = Math.min(1, (CW - 6) / (union.right - union.left), (CH - 6) / (union.bottom - union.top));
    const offsetX = Math.round(CW / 2 - ((union.left + union.right) / 2) * scale);
    const offsetY = Math.round(CH - 3 - union.bottom * scale);
    for (const [col, c] of cells.entries()) {
      const resized = await sharp(Buffer.from(c.data), { raw: { width: c.info.width, height: c.info.height, channels: 4 } })
        .resize(Math.round(c.info.width * scale), Math.round(c.info.height * scale), { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
      // place the scaled cell so its content lands in the target cell, then crop to the cell
      const placed = await sharp({ create: { width: CW, height: CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: await cropInto(resized, offsetX, offsetY, CW, CH), left: 0, top: 0 }]).png().toBuffer();
      layers.push({ input: placed, left: col * CW, top: row * CH });
    }
    console.log(`${spec.state.padEnd(14)} ← ${spec.from} frames ${picks.join(',')} at ${scale.toFixed(2)}`);
  }
  const sheet = join(out, 'spritesheet.webp');
  await sharp({ create: { width: 8 * CW, height: 9 * CH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers).webp({ lossless: true, effort: 6 }).toFile(sheet);
  const meta = await sharp(sheet).metadata();
  if (meta.width !== 1536 || meta.height !== 1872) throw new Error(`Codex atlas is ${meta.width}×${meta.height}, not 1536×1872`);
  const pet = {
    id: 'yoru',
    displayName: 'Yoru',
    description: 'A sharp-eyed nocturnal familiar for Wolf: cozy, stylish, clever, a little sarcastic, and quietly loyal during late-night coding.',
    spritesheetPath: 'spritesheet.webp',
  };
  writeFileSync(join(out, 'pet.json'), `${JSON.stringify(pet, null, 2)}\n`);
  await sharp(sheet).flatten({ background: '#100b11' }).png().toFile(join(out, 'contact.png'));
  console.log(`Codex pet → ${out}`);

  if ('install' in flags) {
    const codexHome = process.env.CODEX_HOME || join(process.env.USERPROFILE ?? process.env.HOME, '.codex');
    const target = join(codexHome, 'pets', 'yoru');
    const backup = join(codexHome, 'pets-backup', 'yoru-2026-05-29');
    if (existsSync(target) && !existsSync(backup)) {
      mkdirSync(backup, { recursive: true });
      for (const f of readdirSync(target)) copyFileSync(join(target, f), join(backup, f));
      console.log(`kept the May pet in ${backup}`);
    }
    mkdirSync(target, { recursive: true });
    copyFileSync(sheet, join(target, 'spritesheet.webp'));
    copyFileSync(join(out, 'pet.json'), join(target, 'pet.json'));
    console.log(`installed → ${target}`);
  }
}

/** The part of a raw image that falls inside a width × height window placed at (x, y), as PNG. */
async function cropInto({ data, info }, x, y, width, height) {
  const left = Math.max(0, -x), top = Math.max(0, -y);
  const w = Math.min(info.width - left, width - Math.max(0, x)), h = Math.min(info.height - top, height - Math.max(0, y));
  const piece = await sharp(Buffer.from(data), { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left, top, width: w, height: h }).png().toBuffer();
  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: piece, left: Math.max(0, x), top: Math.max(0, y) }]).png().toBuffer();
}

// ---------- preview ----------

async function cmdPreview() {
  const file = await writePreview(P, await standingCell());
  console.log(file);
}

/**
 * One still of a family's runs stacked top to bottom (newest first per clip): registered contact sheets, or the raw
 * generated sheets with --strips. Written to artifacts/yoru-studio/montage.png, for reviewing a batch at a glance.
 */
/**
 * A still of Yoru for static artwork (the home page's social card): mattes a drawing on flat magenta the way frames
 * are matted, keeps the figure (the longest unbroken run of rows, so a neighbouring frame's stray foot is dropped)
 * and crops to him. `cutout <source.png> <out.png>`
 */
async function cmdCutout(source, out) {
  if (!source || !out) throw new Error('usage: cutout <source.png> <out.png>');
  const { data, info } = await sharp(resolve(root, source)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const matted = matteKey(data, info.width, info.height, parseHex(KEY)).data;
  const rows = opacityProfile(matted, info.width, info.height, 'y');
  let best = { top: 0, height: 0 };
  for (let y = 0, start = -1; y <= info.height; y++) {
    if (y < info.height && rows[y] > 0) { if (start < 0) start = y; continue; }
    if (start >= 0 && y - start > best.height) best = { top: start, height: y - start };
    start = -1;
  }
  const band = crop(matted, info.width, { left: 0, top: best.top, width: info.width, height: best.height });
  const b = solidBounds(band, info.width, best.height);
  const figure = crop(band, info.width, { ...b, top: b.top });
  await sharp(Buffer.from(figure), { raw: { width: b.width, height: b.height, channels: 4 } }).png().toFile(resolve(root, out));
  console.log(`${out}: ${b.width}×${b.height}`);
}

async function cmdMontage(familyId, clipId) {
  const family = loadFamily(P, familyId);
  const files = [];
  for (const clip of family.clips) {
    if (clipId && clip.id !== clipId) continue;
    const dir = join(P.runs, familyId, clip.id);
    if (!existsSync(dir)) continue;
    for (const run of readdirSync(dir).sort().reverse()) {
      const file = join(dir, run, 'strips' in flags ? 'strip.png' : 'contact.png');
      if (existsSync(file)) files.push(file);
    }
  }
  const width = 2000;
  const images = await Promise.all(files.map((f) => sharp(f).resize({ width, withoutEnlargement: true }).png().toBuffer({ resolveWithObject: true })));
  let top = 0;
  const layers = images.map(({ data, info }) => { const l = { input: data, left: 0, top }; top += info.height + 6; return l; });
  const out = join(P.work, 'montage.png');
  await sharp({ create: { width, height: Math.max(1, top), channels: 4, background: '#3a3a3a' } }).composite(layers).png().toFile(out);
  console.log(`${out} (${files.length} runs)`);
}

/**
 * Serves the studio on http://127.0.0.1:4390: the candidate page at /preview/ (rewritten on every load, so new runs
 * appear on refresh), the packed sheets at /sheets/, and the resident rehearsal at /rehearsal/, whose script is the
 * real engine in src/features/yoru bundled on each request. None of this is part of the site build.
 */
async function cmdServe() {
  const server = await serveStudio({ root, paths: P, port: Number(flags.port ?? 4390),
    preview: async () => writePreview(P, await standingCell()), tempoBoard });
  console.log('Yoru studio on http://127.0.0.1:' + server.address().port + '/ · rehearsal at /rehearsal/');
}

// ---------- tempo board ----------

/** Every animated, packed clip with its authored timing and current tempo, for the board at /tempo/. */
function tempoBoard() {
  return TEMPO_FAMILIES.filter((id) => existsSync(join(P.sheets, `${id}.json`))).map((id) => {
    const family = loadFamily(P, id);
    const manifest = JSON.parse(readFileSync(join(P.sheets, `${id}.json`), 'utf8'));
    return {
      family: id, title: family.title, sheet: `/sheets/${id}.webp`,
      cell: manifest.cell, pivot: manifest.pivot, displayScale: manifest.displayScale,
      clips: family.clips.filter((clip) => clip.frames > 1 && manifest.clips[clip.id]).map((clip) => ({
        id: clip.id, row: manifest.clips[clip.id].row, frames: clip.frames, loop: clip.loop ?? false,
        durations: authoredDurations(clip), tempo: clip.tempo ?? 1,
        ...(/^(walk|run)-/.test(clip.id) && { stride: clip.stride ?? (clip.id.startsWith('run') ? 144 : 60) }),
      })),
    };
  });
}

function findClip(family, clipId) {
  const clip = family.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error(`${family.family} has no clip "${clipId}" (has ${family.clips.map((c) => c.id).join(', ')})`);
  return clip;
}

// ---------- dispatch, last so every binding above is initialised ----------

const commands = { generate: cmdGenerate, import: cmdImport, process: cmdProcess, select: cmdSelect, pack: cmdPack, preview: cmdPreview, serve: cmdServe, montage: cmdMontage, cutout: cmdCutout, 'export-codex': cmdExportCodex };
if (!commands[command]) {
  console.error(`usage: studio.mjs <${Object.keys(commands).join('|')}> ...`);
  process.exit(2);
}
await commands[command](...args);
