#!/usr/bin/env node
// Yoru's sprite studio. See design/yoru/README.md for the authoring guide.
//
//   node tools/yoru-studio/studio.mjs generate <family> <clip> [--count N]   draw candidates with Codex
//   node tools/yoru-studio/studio.mjs process  <family> [clip]               matte, cut and register every run
//   node tools/yoru-studio/studio.mjs select   <family> <clip> <run>         choose the run that becomes the clip
//   node tools/yoru-studio/studio.mjs pack     <family>                      write design/yoru/sheets/<family>.*
//   node tools/yoru-studio/studio.mjs import   <family> <clip> <png> [run]   bring an existing strip in as a run
//   node tools/yoru-studio/studio.mjs preview                                write the studio page
//   node tools/yoru-studio/studio.mjs serve [--port=4390]                    serve it, fresh on every load

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { generate, ROUTE } from './lib/codex.mjs';
import { keyResidue, matteKey, parseHex } from './lib/matte.mjs';
import { crop, placeFrames, solidBounds, splitFrames } from './lib/register.mjs';
import { clipDurations, clipLayout, clipPrompt, identityLock, KEY, loadFamily, makeGuide, paths, saveFamily, STANDING_HEIGHT } from './lib/spec.mjs';
import { writeContact, writePreview } from './lib/preview.mjs';

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
  const matte = matteKey(data, width, height, key);
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

  const scale = resolveScale(family, clip, frames, warnings);
  // A second anchor at the clip's end corrects a generator that drew Yoru slowly growing or shrinking across the
  // sheet: the scale moves evenly from the first anchor's value to the one that makes the last frame its known height.
  const endScale = clip.scale?.endHeight ? (STANDING_HEIGHT * clip.scale.endHeight) / frames.at(-1).bounds.height : scale;
  const scaleAt = (i) => scale + ((endScale - scale) * i) / Math.max(1, frames.length - 1);
  const placed = frames.map((f, i) => placeFrames([{ bounds: f.bounds, slotCenterX: f.slotCenterX }], {
    scale: scaleAt(i), cell: family.cell, pivot: family.pivot, ground: 'frame', anchor: clip.anchor ?? 'slot',
  })[0]);
  if ((clip.ground ?? 'frame') === 'clip') {
    // Airborne poses keep their height above the clip's lowest foot instead of each landing on the floor.
    const floor = Math.max(...frames.map((f) => f.bounds.top + f.bounds.height));
    placed.forEach((p, i) => { p.top -= Math.round((floor - (frames[i].bounds.top + frames[i].bounds.height)) * scaleAt(i)); });
    placed.forEach((p) => { p.clipped = p.left < 0 || p.top < 0 || p.left + p.width > family.cell.width || p.top + p.height > family.cell.height; });
  }

  const out = join(dir, 'frames');
  mkdirSync(out, { recursive: true });
  const heights = [];
  for (const [i, f] of frames.entries()) {
    const p = placed[i];
    if (p.clipped) warnings.push(`frame ${i + 1} leaves the ${family.cell.width}×${family.cell.height} cell`);
    const sprite = await sharp(Buffer.from(crop(f.pixels, f.region.width, f.local)), {
      raw: { width: f.local.width, height: f.local.height, channels: 4 },
    }).resize(p.width, p.height, { kernel: 'lanczos3' }).png().toBuffer();
    const cellImage = await sharp({ create: { width: family.cell.width, height: family.cell.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: await clampToCell(sprite, p, family.cell), left: Math.max(0, p.left), top: Math.max(0, p.top) }])
      .png().toBuffer();
    writeFileSync(join(out, `${String(i).padStart(2, '0')}.png`), cellImage);
    heights.push(p.height);
  }
  const residue = keyResidue(rgba, width, height, key);
  if (residue > 50) warnings.push(`${residue} edge pixels still lean magenta`);
  await writeContact(dir, family.cell, family.pivot, await standingCell());
  return writeReport(dir, { scale, endScale, heights, warnings, edgePixels: matte.edgePixels, residue, placed });
}

/** Standing Yoru from the v1 master's first idle cell, the scale reference. */
let standing;
async function standingCell() {
  standing ??= await sharp(join(root, 'design', 'the-walk', 'assets', 'yoru-spritesheet.webp'))
    .extract({ left: 0, top: 0, width: 192, height: 208 }).png().toBuffer();
  return standing;
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
 * One scale for the clip: a frame of known height (a fraction of standing Yoru), or the registered height of a frame
 * in another clip that shows the same pose.
 */
function resolveScale(family, clip, frames, warnings) {
  const s = clip.scale ?? { frame: 0, height: 1 };
  const at = (n) => frames.at(n).bounds.height;
  if (s.match) {
    const m = /^(?:([\w-]+)\/)?([\w-]+)#(-?\d+)$/.exec(s.match);
    const reg = m && selectedRegistration(m[1] ?? family.family, m[2]);
    if (reg) return reg.heights.at(Number(m[3])) / at(s.frame ?? 0);
    warnings.push(`scale match ${s.match} not available yet; used height ${s.height ?? 1}`);
  }
  return (STANDING_HEIGHT * (s.height ?? 1)) / at(s.frame ?? 0);
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
    manifest.clips[clip.id] = { row, frames: clip.frames, durations, loop: clip.loop ?? false, ...(clip.from && { from: clip.from }), ...(clip.to && { to: clip.to }) };
  });
  mkdirSync(P.sheets, { recursive: true });
  await sharp({ create: { width: cols * cw, height: clips.length * ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(composites).webp({ lossless: true, effort: 6 }).toFile(join(P.sheets, `${familyId}.webp`));
  writeFileSync(join(P.sheets, `${familyId}.json`), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`packed ${clips.length} clips → design/yoru/sheets/${familyId}.webp`);
}

// ---------- preview ----------

async function cmdPreview() {
  const file = await writePreview(P, root);
  console.log(file);
}

/** Serves the studio page (rewritten on every load, so new runs appear on refresh) on http://localhost:4390. */
async function cmdServe() {
  const { createServer } = await import('node:http');
  const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };
  const port = Number(flags.port ?? 4390);
  createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path === '/') { res.writeHead(302, { location: '/preview/' }).end(); return; }
    if (path === '/preview/') await writePreview(P, root);
    const file = resolve(P.work, path === '/preview/' ? 'preview/index.html' : `.${path}`);
    if (!file.startsWith(P.work) || !existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': types[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(file));
  }).listen(port, () => console.log(`Yoru studio on http://localhost:${port}/`));
}

function findClip(family, clipId) {
  const clip = family.clips.find((c) => c.id === clipId);
  if (!clip) throw new Error(`${family.family} has no clip "${clipId}" (has ${family.clips.map((c) => c.id).join(', ')})`);
  return clip;
}

// ---------- dispatch, last so every binding above is initialised ----------

const commands = { generate: cmdGenerate, import: cmdImport, process: cmdProcess, select: cmdSelect, pack: cmdPack, preview: cmdPreview, serve: cmdServe };
if (!commands[command]) {
  console.error(`usage: studio.mjs <${Object.keys(commands).join('|')}> ...`);
  process.exit(2);
}
await commands[command](...args);
