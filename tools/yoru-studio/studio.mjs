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

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { generate, ROUTE } from './lib/codex.mjs';
import { keyMask, keyResidue, matteKey, parseHex } from './lib/matte.mjs';
import { crop, placeFrames, solidBounds, splitFrames } from './lib/register.mjs';
import { clipDurations, clipLayout, clipPrompt, identityLock, KEY, loadFamily, makeGuide, paths, PROP_KEY, saveFamily, STANDING_HEIGHT } from './lib/spec.mjs';
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
  const attachments = [
    { path: join(P.reference, 'canonical-base.png'), role: 'Canonical identity reference: this is exactly what Yoru looks like.' },
    // The canonical base fixes who he is; the style anchor fixes how he is drawn now. Without it roughly a third of
    // generations drifted to a more ornate, pink-eared cat.
    ...(existsSync(join(P.reference, 'style-standing.png'))
      ? [{ path: join(P.reference, 'style-standing.png'), role: 'Style reference: Yoru as he is drawn now. Match this exact rendering style, line work, proportions, ear shape, colours and level of detail in every frame.' }]
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
  const propKey = clip.prop ? parseHex(family.propKey ?? PROP_KEY) : null;
  const propMask = propKey ? keyMask(data, width, height, propKey) : null;
  const matte = matteKey(data, width, height, propKey ? [key, propKey] : key);
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
    const bottoms = frames.map((f) => f.bounds.top + f.bounds.height);
    const floor = ground === 'first' ? bottoms[0] : ground === 'last' ? bottoms.at(-1) : Math.max(...bottoms);
    placed.forEach((p, i) => { p.top -= Math.round((floor - (frames[i].bounds.top + frames[i].bounds.height)) * scaleAt(i)); });
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
  const drift = signatureDistance(colourSignature(rgba, width * height), colourSignature(ref.rgba, ref.width * ref.height));
  if (drift > DRIFT_LIMIT) warnings.push(`colours drift from the canonical Yoru (${drift.toFixed(2)})`);
  const props = propMask ? frames.map((f, i) => propPlacement(propMask, width, layout, f, i, placed[i], scaleAt(i), offsets[i])) : undefined;
  await writeContact(dir, family.cell, family.pivot, await standingCell(), props);
  if (props?.some((p) => !p)) warnings.push(`prop missing in frame(s) ${props.flatMap((p, i) => (p ? [] : [i + 1])).join(', ')}`);
  return writeReport(dir, { scale, endScale, heights, offsets, props, drift, warnings, edgePixels: matte.edgePixels, residue, placed });
}

/**
 * Where the prop was painted in one frame, in that frame's cell coordinates: its bounds and centre. Prop pixels belong
 * to the frame whose slot (column, and grid row band) they fall in.
 */
function propPlacement(mask, width, layout, f, i, p, scale, dx) {
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
  if (n < 50) return null;
  const toX = (x) => Math.round(p.left + (x - f.bounds.left) * scale + dx);
  const toY = (y) => Math.round(p.top + (y - f.bounds.top) * scale);
  return { left: toX(minX), top: toY(minY), right: toX(maxX + 1), bottom: toY(maxY + 1), cx: toX(sx / n), cy: toY(sy / n) };
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
      ...(clip.from && { from: clip.from }), ...(clip.to && { to: clip.to }),
      ...(reg.props && { prop: clip.prop.name, props: reg.props }),
    };
  });
  mkdirSync(P.sheets, { recursive: true });
  await sharp({ create: { width: cols * cw, height: clips.length * ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).webp({ lossless: true, effort: 6 }).toFile(join(P.sheets, `${familyId}.webp`));
  writeFileSync(join(P.sheets, `${familyId}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`packed ${clips.length} clips → design/yoru/sheets/${familyId}.webp`);
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
 * Serves the studio on http://localhost:4390: the candidate page at /preview/ (rewritten on every load, so new runs
 * appear on refresh), the packed sheets at /sheets/, and the resident rehearsal at /rehearsal/, whose script is the
 * real engine in src/features/yoru bundled on each request. None of this is part of the site build.
 */
async function cmdServe() {
  const { createServer } = await import('node:http');
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
  const port = Number(flags.port ?? 4390);
  const rehearsal = join(root, 'tools', 'yoru-studio', 'rehearsal');
  const send = (res, file) => {
    // Read first: a sheet being repacked can fail mid-request, and that must become a 500, not a half-sent response.
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': types[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  };
  createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path === '/') { res.writeHead(302, { location: '/preview/' }).end(); return; }
      if (path === '/preview/') await writePreview(P, await standingCell());
      if (path === '/rehearsal/') return send(res, join(rehearsal, 'index.html'));
      if (path === '/sheets/') {
        const packed = existsSync(P.sheets) ? readdirSync(P.sheets).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)) : [];
        res.writeHead(200, { 'content-type': types['.json'], 'cache-control': 'no-store' }).end(JSON.stringify(packed));
        return;
      }
      if (path === '/rehearsal/main.js') {
        const { build } = await import('esbuild');
        const result = await build({ entryPoints: [join(rehearsal, 'main.ts')], bundle: true, format: 'esm', write: false, sourcemap: 'inline', target: 'es2022' });
        res.writeHead(200, { 'content-type': types['.js'], 'cache-control': 'no-store' });
        res.end(result.outputFiles[0].text);
        return;
      }
      const [base, rest] = path.startsWith('/sheets/') ? [P.sheets, path.slice('/sheets/'.length)] : [P.work, path === '/preview/' ? 'preview/index.html' : `.${path}`];
      const file = resolve(base, rest);
      if (!file.startsWith(base) || !existsSync(file)) { res.writeHead(404).end(); return; }
      send(res, file);
    } catch (error) {
      if (res.headersSent) res.destroy();
      else res.writeHead(500, { 'content-type': 'text/plain' }).end(String(error?.stack ?? error));
    }
  }).listen(port, () => console.log(`Yoru studio on http://localhost:${port}/ · rehearsal at /rehearsal/`));
}

function findClip(family, clipId) {
  const clip = family.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error(`${family.family} has no clip "${clipId}" (has ${family.clips.map((c) => c.id).join(', ')})`);
  return clip;
}

// ---------- dispatch, last so every binding above is initialised ----------

const commands = { generate: cmdGenerate, import: cmdImport, process: cmdProcess, select: cmdSelect, pack: cmdPack, preview: cmdPreview, serve: cmdServe, montage: cmdMontage };
if (!commands[command]) {
  console.error(`usage: studio.mjs <${Object.keys(commands).join('|')}> ...`);
  process.exit(2);
}
await commands[command](...args);
