// Build every export from core.mjs:
//   node build.mjs --font <path-to/AbrilFatface-Regular.ttf> [--chrome <chrome.exe>] [--no-raster]
// Writes approved brand exports, editable geometry and design sponsor specimens; then (unless --no-raster) renders transparent PNGs,
// and play-once GIF/APNG via a headless Chrome in an isolated, temporary profile plus ffmpeg on PATH.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { spawn, execFileSync } from 'node:child_process';
import opentype from 'opentype.js';
import * as K from './core.mjs';
import * as SP from './sponsor-section.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', '..', '..', 'assets', 'brand');
const DESIGN = resolve(HERE, '..');
const arg = (name, dflt) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; };
const FONT = arg('--font', process.env.WORKS_FONT);
const CHROME = arg('--chrome', process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe');
const RASTER = !process.argv.includes('--no-raster');
if (!FONT || !existsSync(FONT)) { console.error('Need --font <AbrilFatface-Regular.ttf> (SIL OFL, github.com/google/fonts/tree/main/ofl/abrilfatface).'); process.exit(1); }

const font = opentype.parse(readFileSync(FONT).buffer);
const N = K.outlineName(font, 100);
const write = (rel, text) => { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); return p; };
const writeDesign = (rel, text) => { const p = join(DESIGN, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); return p; };
const XML = '<?xml version="1.0" encoding="UTF-8"?>\n';

/* ---------------- SVG ---------------- */
const svgs = {};
const put = (rel, svg) => { svgs[rel] = svg; write(rel, XML + svg + '\n'); };
for (const mode of ['dark', 'light', 'mono']) {
  put(`svg/icon/works-icon-${mode}.svg`, K.iconSvg(mode));
  put(`svg/lockup/works-lockup-${mode}.svg`, K.lockupSvg(N, 'full', mode));
  put(`svg/lockup/works-lockup-compact-${mode}.svg`, K.lockupSvg(N, 'compact', mode));
}
for (const mode of ['dark', 'light']) {
  put(`svg/icon/works-icon-animated-${mode}.svg`, K.iconSvg(mode, { animated: true }));
  put(`svg/lockup/works-lockup-animated-${mode}.svg`, K.lockupSvg(N, 'full', mode, { animated: true }));
  put(`svg/sponsor/works-sponsor-banner-${mode}.svg`, K.sponsorBannerSvg(N, mode));
  put(`svg/sponsor/works-sponsor-banner-animated-${mode}.svg`, K.sponsorBannerSvg(N, mode, { animated: true }));
}
put('svg/icon/favicon.svg', K.faviconSvg());
put('svg/glyph/works-glyph-24.svg', K.glyphSvg());

/* ---------------- adaptive light/dark SVG exports ---------------- */
// The two designs have distinct colors and, for the banner, distinct panel geometry.
// Select a complete layer rather than attempting to recolor a dark-only export.
function adaptiveSvg(light, dark) {
  const opening = light.match(/^<svg[^>]*>/)?.[0];
  if (!opening || dark.match(/^<svg[^>]*>/)?.[0] !== opening) throw new Error('Adaptive SVG root mismatch');
  const inside = (svg) => svg.slice(opening.length, svg.lastIndexOf('</svg>')).trim();
  return opening + '\n<style>\n  .for-dark-theme { display: none; }\n  @media (prefers-color-scheme: dark) {\n    .for-light-theme { display: none; }\n    .for-dark-theme { display: inline; }\n  }\n</style>\n' +
    '<g class="for-light-theme">' + inside(light) + '</g>\n' +
    '<g class="for-dark-theme">' + inside(dark) + '</g>\n</svg>';
}
for (const [folder, name] of [
  ['icon', 'works-icon'],
  ['lockup', 'works-lockup'],
  ['lockup', 'works-lockup-compact'],
  ['sponsor', 'works-sponsor-banner'],
]) {
  put('svg/' + folder + '/' + name + '.svg', adaptiveSvg(
    svgs['svg/' + folder + '/' + name + '-light.svg'],
    svgs['svg/' + folder + '/' + name + '-dark.svg'],
  ));
}

/* ---------------- sponsor section (design specimens) ---------------- */
writeDesign('sponsor-section/works-sponsor.css', SP.LAYOUT_CSS + '\n' + SP.MOTION_CSS);
writeDesign('sponsor-section/works-sponsor.js', SP.PLAY_JS);
writeDesign('sponsor-section/example.html', `<!-- One Works sponsor section, ready to paste. Requires works-sponsor.css and works-sponsor.js.
     Replace the two hrefs with the real enabled destinations; keep ids unique per page; set --works-sponsor-veil to the panel colour. -->
` + SP.sectionHtml(N, { mode: 'dark', id: 'works-sponsor' }) + '\n');
writeDesign('sponsor-section/example-light.html', SP.sectionHtml(N, { mode: 'light', id: 'works-sponsor-light' }) + '\n');
writeDesign('sponsor-section/specimen.html', SP.specimenHtml(N));

/* ---------------- geometry.json — numbers the website session needs ---------------- */
const geo = (v) => { const G = K.lockupGeometry(N, v); return { viewBox: G.vb, cornerScale: +G.h.s.toFixed(3), orangeAt: [+G.h.x0.toFixed(2), +G.h.y0.toFixed(2)], magentaAt: [+G.h.x1.toFixed(2), +G.h.y1.toFixed(2)], works: Object.fromEntries(Object.entries(G.works).map(([k, x]) => [k, +x.toFixed(3)])) }; };
writeDesign('source/geometry.json', JSON.stringify({
  note: 'Units: lockups are drawn with WOLFSBLVT at font-size 100 (cap height 70), baseline y=0, starting x=0. Icon on a 32-unit grid.',
  name: { font: 'Abril Fatface', size: 100, letterSpacingEm: .01, width: +N.w.toFixed(2), capHeight: N.capH },
  icon: { grid: 32, stroke: K.SW, orange: K.ORANGE, magenta: K.MAGENTA, dot: K.DOT, dotRadius: 3.1, bendRadius: { orange: K.R_O, magenta: K.R_M } },
  lockup: { full: geo('full'), compact: geo('compact'), switchBelowPx: 40 },
  sponsor: { cornerScale: 4, radiusTopLeftPx: K.R_O * 4, radiusBottomRightPx: K.R_M * 4 },
  motion: K.MOTION, colors: K.COLORS,
}, null, 2) + '\n');
console.log('SVG + geometry written. Name width', N.w.toFixed(1));
if (!RASTER) process.exit(0);

/* ---------------- headless Chrome (isolated temporary profile) ---------------- */
const TMP = join(tmpdir(), `wk-render-${process.pid}`);
const PROFILE = join(TMP, 'profile'); mkdirSync(PROFILE, { recursive: true });
const PORT = 9300 + (process.pid % 500);
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank'], { stdio: 'ignore', windowsHide: true });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) { await sleep(200); try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
if (!target) { chrome.kill(); throw new Error('Chrome did not start'); }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r, { once: true }));
let seq = 0; const pending = new Map(), waiters = [];
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } else if (m.method) waiters.filter(w => w.method === m.method).forEach(w => { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }); });
const cdp = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise(res => waiters.push({ method, res }));
await cdp('Page.enable');
await cdp('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
// Headless Chrome reports prefers-reduced-motion: reduce, which (correctly) disables the motion. Render frames as a normal viewer.
await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });

async function load(svg, w, h) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400&display=block" rel="stylesheet">
<style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block;width:${w}px;height:${h}px}</style></head><body>${svg}</body></html>`;
  const file = join(TMP, 'page.html'); writeFileSync(file, html);
  await cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired'); await cdp('Page.navigate', { url: pathToFileURL(file).href }); await loaded;
  await cdp('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>1)', awaitPromise: true });
}
const seek = (ms) => cdp('Runtime.evaluate', { expression: `(async()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=${ms}});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return 1})()`, awaitPromise: true });
const shot = async (path, w, h) => { const r = await cdp('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } }); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, Buffer.from(r.data, 'base64')); };
async function png(svg, rel, w, h) { await load(svg, w, h); await shot(join(OUT, rel), w, h); }
const aspect = (svg) => { const vb = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number); return vb[2] / vb[3]; };
const sized = (svg) => svg.replace(/ width="[^"]*" height="[^"]*"/, '');

/* ---------------- static PNGs ---------------- */
const tile = (mode, size, inner, bg) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${bg}"/><g transform="translate(${(size - inner) / 2} ${(size - inner) / 2}) scale(${inner / 32})">${K.iconSvg(mode).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g></svg>`;
for (const mode of ['dark', 'light']) {
  for (const s of [16, 32, 48, 64, 128, 256, 512, 1024]) await png(svgs[`svg/icon/works-icon-${mode}.svg`], `png/icon/works-icon-${mode}-${s}.png`, s, s);
  for (const w of [600, 1200, 2400]) { const svg = svgs[`svg/lockup/works-lockup-${mode}.svg`]; await png(svg, `png/lockup/works-lockup-${mode}-${w}w.png`, w, Math.round(w / aspect(svg))); }
  for (const h of [32, 64, 128]) { const svg = svgs[`svg/lockup/works-lockup-compact-${mode}.svg`]; await png(svg, `png/lockup/works-lockup-compact-${mode}-${h}h.png`, Math.round(h * aspect(svg)), h); }
  for (const scale of [1, 2]) { const svg = sized(svgs[`svg/sponsor/works-sponsor-banner-${mode}.svg`]); await png(svg, `png/sponsor/works-sponsor-banner-${mode}${scale > 1 ? '@2x' : ''}.png`, 920 * scale, 340 * scale); }
}
for (const [name, col] of [['white', '#ffffff'], ['black', '#000000']]) {
  const svg = svgs['svg/lockup/works-lockup-mono.svg'].replace(/currentColor/g, col);
  await png(svg, `png/lockup/works-lockup-${name}-1200w.png`, 1200, Math.round(1200 / aspect(svg)));
  await png(svgs['svg/icon/works-icon-mono.svg'].replace(/currentColor/g, col), `png/icon/works-icon-${name}-512.png`, 512, 512);
}
await png(tile('dark', 180, 124, K.COLORS.canvas), 'png/icon/apple-touch-icon-180.png', 180, 180);
await png(tile('dark', 512, 300, K.COLORS.canvas), 'png/icon/works-icon-maskable-512.png', 512, 512);
for (const [name, col] of [['bone', K.COLORS.text], ['ink', K.COLORS.ink]]) for (const s of [24, 48, 96]) await png(K.glyphSvg().replace('currentColor', col), `png/glyph/works-glyph-${name}-${s}.png`, s, s);
console.log('Static PNGs rendered.');

/* ---------------- animations: frames → play-once GIF (on background) and APNG (transparent) ---------------- */
const FPS = 30;
async function animate(svg, base, w, h, seconds, bg) {
  const dir = join(TMP, base); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await load(svg, w, h);
  const frames = Math.round(seconds * FPS);
  const count = (await cdp('Runtime.evaluate', { expression: 'document.getAnimations().length', returnByValue: true })).result.value;
  if (!count) throw new Error(`No running animations found for ${base}; frames would be static.`);
  for (let f = 0; f <= frames; f++) { await seek(f * 1000 / FPS); await shot(join(dir, String(f).padStart(4, '0') + '.png'), w, h); }
  const input = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, '%04d.png')];
  const hex = bg.replace('#', '0x');
  execFileSync('ffmpeg', [...input, '-filter_complex', `color=c=${hex}:s=${w}x${h}:r=${FPS}[bg];[bg][0:v]overlay=shortest=1,split[a][b];[a]palettegen=stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a`, '-loop', '-1', join(OUT, `animated/gif/${base}.gif`)], { windowsHide: true });
  execFileSync('ffmpeg', [...input, '-plays', '1', '-pix_fmt', 'rgba', '-f', 'apng', join(OUT, `animated/apng/${base}.apng`)], { windowsHide: true });
  console.log('animated', base, frames + 1, 'frames');
}
const total = K.MOTION.after + K.MOTION.sweep + .7;
for (const mode of ['dark', 'light']) {
  const bg = mode === 'dark' ? K.COLORS.canvas : K.COLORS.paper;
  await animate(svgs[`svg/icon/works-icon-animated-${mode}.svg`], `works-icon-${mode}-256`, 256, 256, K.MOTION.after + 1.1, bg);
  const lk = svgs[`svg/lockup/works-lockup-animated-${mode}.svg`];
  await animate(lk, `works-lockup-${mode}-1200w`, 1200, Math.round(1200 / aspect(lk)), total, bg);
  await animate(sized(svgs[`svg/sponsor/works-sponsor-banner-animated-${mode}.svg`]), `works-sponsor-banner-${mode}`, 920, 340, total, mode === 'dark' ? '#0d1117' : '#ffffff'); // GitHub README backgrounds
}

ws.close(); chrome.kill();
await sleep(400); try { rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log('Done.');
