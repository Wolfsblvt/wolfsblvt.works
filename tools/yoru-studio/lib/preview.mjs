// The studio page: every processed run, played at the size the site shows Yoru, on the site's dark canvas and on the
// light smolpng window, next to standing Yoru for scale. Family sequences play clips back to back to judge the joins.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';
import { clipDurations, loadFamily } from './spec.mjs';

/**
 * A still of one registered run: every frame in a row on the site's dark canvas, standing Yoru faintly behind each,
 * and the floor line. Written next to the frames as `contact.png`.
 */
export async function writeContact(runDir, cell, pivot, standingPng) {
  const frames = readdirSync(join(runDir, 'frames')).filter((f) => f.endsWith('.png')).sort();
  const ghost = await sharp(standingPng).composite([{
    input: Buffer.from([255, 255, 255, 72]), raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in',
  }]).png().toBuffer();
  const gap = 8;
  const width = frames.length * (cell.width + gap) + gap;
  const height = cell.height + gap * 2;
  const layers = [];
  frames.forEach((f, i) => {
    const left = gap + i * (cell.width + gap);
    layers.push({ input: ghost, left: left + pivot.x - 96, top: gap + pivot.y - 203 });
    layers.push({ input: { create: { width: cell.width, height: 1, channels: 4, background: '#73cae388' } }, left, top: gap + pivot.y });
    layers.push({ input: join(runDir, 'frames', f), left, top: gap });
  });
  await sharp({ create: { width, height, channels: 4, background: '#100b11' } })
    .composite(layers.filter((l) => l.left >= 0 && l.top >= 0)).png().toFile(join(runDir, 'contact.png'));
}

export async function writePreview(P, root) {
  mkdirSync(P.preview, { recursive: true });
  // Standing Yoru from the v1 master, first idle cell: the scale every new clip is registered against.
  await sharp(join(root, 'design', 'the-walk', 'assets', 'yoru-spritesheet.webp'))
    .extract({ left: 0, top: 0, width: 192, height: 208 }).png().toFile(join(P.preview, 'standing.png'));

  const rel = (path) => relative(P.preview, path).replaceAll('\\', '/');
  const families = existsSync(P.families)
    ? readdirSync(P.families).filter((f) => f.endsWith('.json')).map((f) => loadFamily(P, f.slice(0, -5)))
    : [];

  const data = families.map((family) => ({
    id: family.family,
    title: family.title,
    cell: family.cell,
    pivot: family.pivot,
    sequences: family.sequences ?? [],
    clips: family.clips.map((clip) => {
      const dir = join(P.runs, family.family, clip.id);
      const runs = existsSync(dir) ? readdirSync(dir).sort().reverse() : [];
      return {
        id: clip.id,
        loop: clip.loop ?? false,
        durations: clipDurations(clip),
        selected: clip.selected ?? null,
        runs: runs.filter((run) => existsSync(join(dir, run, 'frames'))).map((run) => {
          const report = JSON.parse(readFileSync(join(dir, run, 'registration.json'), 'utf8'));
          const frames = readdirSync(join(dir, run, 'frames')).filter((f) => f.endsWith('.png')).sort();
          return {
            id: run,
            strip: rel(join(dir, run, 'strip.png')),
            frames: frames.map((f) => rel(join(dir, run, 'frames', f))),
            scale: report.scale,
            warnings: report.warnings,
          };
        }),
      };
    }),
  }));

  const file = join(P.preview, 'index.html');
  writeFileSync(file, page(data));
  return file;
}

const page = (data) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Yoru studio</title>
<style>
  :root { --dark: #100b11; --light: #fbfcfd; --ink: #f3e8dc; --quiet: #9c8c93; --line: #2a1f29; --accent: #eca557; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #0b080c; color: var(--ink); font: 14px/1.45 system-ui, sans-serif; }
  header { position: sticky; top: 0; z-index: 2; display: flex; gap: 16px; align-items: center; flex-wrap: wrap; padding: 12px 16px; background: #0b080cee; border-bottom: 1px solid var(--line); }
  header h1 { font-size: 16px; margin: 0 12px 0 0; }
  header label { display: flex; gap: 6px; align-items: center; color: var(--quiet); }
  main { padding: 8px 16px 64px; max-width: 1400px; margin: 0 auto; }
  h2 { margin: 32px 0 4px; font-size: 20px; }
  h3 { margin: 24px 0 8px; font-size: 15px; color: var(--accent); }
  .runs { display: flex; flex-wrap: wrap; gap: 12px; }
  .run { border: 1px solid var(--line); border-radius: 8px; padding: 8px; background: #140f15; }
  .run.selected { border-color: var(--accent); }
  .meta { display: flex; justify-content: space-between; gap: 8px; color: var(--quiet); font-size: 12px; margin-bottom: 6px; }
  .warn { color: #ef8ea1; font-size: 12px; max-width: 420px; }
  .stages { display: flex; gap: 6px; }
  .stage { position: relative; overflow: hidden; border-radius: 6px; }
  .stage.dark { background: var(--dark); } .stage.light { background: var(--light); }
  .stage img { position: absolute; left: 0; top: 0; image-rendering: auto; }
  .stage .floor { position: absolute; left: 0; right: 0; height: 1px; background: #73cae355; display: none; }
  body.floor .stage .floor { display: block; }
  .stage .standing { opacity: .35; }
  body:not(.ghost) .stage .standing { display: none; }
  details { margin-top: 6px; } details img { max-width: 100%; display: block; }
  code { color: var(--quiet); font-size: 11px; user-select: all; }
</style>
</head>
<body class="floor">
<header>
  <h1>Yoru studio</h1>
  <label>Zoom <select id="zoom"><option value="1">1× (site)</option><option value="2" selected>2×</option><option value="4">4×</option></select></label>
  <label>Tempo <input type="range" id="speed" min="0.3" max="1.5" step="0.05" value="1"> <output id="speedOut">1.00×</output></label>
  <label><input type="checkbox" id="floor" checked> Floor line</label>
  <label><input type="checkbox" id="ghost"> Standing Yoru for scale</label>
</header>
<main id="main"></main>
<script>
const DATA = ${JSON.stringify(data)};
const state = { zoom: 2, speed: 1 };
const players = [];

function stage(cell, pivot, kind) {
  const el = document.createElement('div');
  el.className = 'stage ' + kind;
  const img = new Image();
  const ghost = new Image();
  ghost.src = 'standing.png'; ghost.className = 'standing';
  const floor = document.createElement('div'); floor.className = 'floor';
  el.append(ghost, img, floor);
  const size = () => {
    const s = state.zoom / 2;
    el.style.width = cell.width * s + 'px'; el.style.height = cell.height * s + 'px';
    img.style.width = cell.width * s + 'px'; img.style.height = cell.height * s + 'px';
    // standing.png is a 192x208 cell whose feet sit at y=203 and centre at x=96
    ghost.style.width = 192 * s + 'px'; ghost.style.height = 208 * s + 'px';
    ghost.style.left = (pivot.x - 96) * s + 'px'; ghost.style.top = (pivot.y - 203) * s + 'px';
    floor.style.top = pivot.y * s + 'px';
  };
  size();
  return { el, img, size };
}

/** Plays a list of steps: { frames, durations } each, looping the whole list. */
function player(stages, steps) {
  let step = 0, frame = 0, timer = 0;
  const tick = () => {
    const s = steps[step];
    for (const st of stages) st.img.src = s.frames[frame];
    const wait = (s.durations[frame] ?? 140) / state.speed;
    frame++;
    if (frame >= s.frames.length) { frame = 0; step = (step + 1) % steps.length; }
    timer = setTimeout(tick, wait);
  };
  for (const s of steps) for (const f of s.frames) { const i = new Image(); i.src = f; }
  tick();
  const p = { stages, stop: () => clearTimeout(timer) };
  players.push(p);
  return p;
}

function render() {
  for (const p of players) p.stop();
  players.length = 0;
  const main = document.getElementById('main');
  main.textContent = '';
  for (const fam of DATA) {
    const h2 = document.createElement('h2'); h2.textContent = fam.title + ' (' + fam.id + ')'; main.append(h2);
    for (const seq of fam.sequences) {
      const steps = [];
      for (const part of seq) {
        const [id, times] = part.split('*');
        const clip = fam.clips.find((c) => c.id === id);
        const run = clip && (clip.runs.find((r) => r.id === clip.selected) ?? clip.runs[0]);
        if (!run) continue;
        for (let i = 0; i < Number(times ?? 1); i++) steps.push({ frames: run.frames, durations: clip.durations });
      }
      if (!steps.length) continue;
      const h3 = document.createElement('h3'); h3.textContent = 'Sequence: ' + seq.join(' → '); main.append(h3);
      const box = document.createElement('div'); box.className = 'stages';
      const stages = [stage(fam.cell, fam.pivot, 'dark'), stage(fam.cell, fam.pivot, 'light')];
      box.append(...stages.map((s) => s.el)); main.append(box);
      player(stages, steps);
    }
    for (const clip of fam.clips) {
      const h3 = document.createElement('h3'); h3.textContent = clip.id + (clip.loop ? ' (loop)' : ''); main.append(h3);
      const runs = document.createElement('div'); runs.className = 'runs'; main.append(runs);
      for (const run of clip.runs) {
        const card = document.createElement('div');
        card.className = 'run' + (run.id === clip.selected ? ' selected' : '');
        const meta = document.createElement('div'); meta.className = 'meta';
        meta.innerHTML = '<span>' + run.id + (run.id === clip.selected ? ' · selected' : '') + '</span><span>scale ' + run.scale.toFixed(3) + '</span>';
        const box = document.createElement('div'); box.className = 'stages';
        const stages = [stage(fam.cell, fam.pivot, 'dark'), stage(fam.cell, fam.pivot, 'light')];
        box.append(...stages.map((s) => s.el));
        card.append(meta, box);
        if (run.warnings.length) { const w = document.createElement('div'); w.className = 'warn'; w.textContent = run.warnings.join(' · '); card.append(w); }
        const cmd = document.createElement('code'); cmd.textContent = 'npm run yoru -- select ' + fam.id + ' ' + clip.id + ' ' + run.id; card.append(cmd);
        const d = document.createElement('details'); d.innerHTML = '<summary>Generated strip</summary><img loading="lazy" src="' + run.strip + '">'; card.append(d);
        runs.append(card);
        player(stages, [{ frames: run.frames, durations: clip.durations }]);
      }
    }
  }
}

document.getElementById('zoom').onchange = (e) => { state.zoom = Number(e.target.value); render(); };
document.getElementById('speed').oninput = (e) => { state.speed = Number(e.target.value); document.getElementById('speedOut').textContent = state.speed.toFixed(2) + '×'; };
document.getElementById('floor').onchange = (e) => document.body.classList.toggle('floor', e.target.checked);
document.getElementById('ghost').onchange = (e) => document.body.classList.toggle('ghost', e.target.checked);
render();
</script>
</body>
</html>
`;
