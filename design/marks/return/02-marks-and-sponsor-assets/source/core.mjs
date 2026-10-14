// Wolfsblvt Works marks — production core.
// Pure geometry and SVG composition, ported 1:1 from the round-3 canvas (canvas/round-3/system.js),
// with WOLFSBLVT outlined from Abril Fatface so every export is font-independent.
// "Two corners hold the work": the icon holds a dot, the lockup holds the name, the sponsor section the invitation.

export const COLORS = {
  canvas: '#100b11', text: '#f3e8dc', soft: '#d1c0b8',
  orange: '#eca557', rose: '#ef8ea1', magenta: '#db61aa',
  paper: '#f6efe6', ink: '#22171c', orangeInk: '#b8661f', magentaInk: '#a8327a', roseInk: '#c4506b',
};
/** Colour set for a background: 'dark' (Works default), 'light' (authored paper relatives) or 'mono' (currentColor). */
export const palette = (mode) => mode === 'mono'
  ? { mode, fg: 'currentColor', o: 'currentColor', m: 'currentColor', r: 'currentColor', face: 'none' }
  : mode === 'light'
    ? { mode, fg: COLORS.ink, o: COLORS.orangeInk, m: COLORS.magentaInk, r: COLORS.roseInk, bg: COLORS.paper }
    : { mode, fg: COLORS.text, o: COLORS.orange, m: COLORS.magenta, r: COLORS.rose, bg: COLORS.canvas };

const f2 = (v) => +v.toFixed(2);

/* ---------------- the two corners (32-unit icon grid) ---------------- */
export const R_O = 8, R_M = 12.4, SW = 3;
export const ORANGE = `M4.6 20.5V${f2(5 + R_O)}A${R_O} ${R_O} 0 0 1 ${f2(4.6 + R_O)} 5H17.5`;
export const MAGENTA = `M27.4 8.5V${f2(27.4 - R_M)}A${R_M} ${R_M} 0 0 1 ${f2(27.4 - R_M)} 27.4H9.5`;
export const DOT = [17.15, 17.35]; // deliberately ~1.2 units right/down of centre
export const GLYPH24 = '<path d="M3.5 15.5V10a6 6 0 0 1 6-6h4"/><path d="M20.5 7v4.6a8.9 8.9 0 0 1-8.9 8.9H7.5"/><circle cx="12.8" cy="13" r="1"/>';

const cornerO = (p, s, x, y) => `<g transform="translate(${f2(x - 4.6 * s)} ${f2(y - 5 * s)}) scale(${f2(s)})"><path class="dr" pathLength="1" d="${ORANGE}" fill="none" stroke="${p.o}" stroke-width="${SW}" stroke-linecap="round"/></g>`;
const cornerM = (p, s, x, y) => `<g transform="translate(${f2(x - 27.4 * s)} ${f2(y - 27.4 * s)}) scale(${f2(s)})"><path class="dr" pathLength="1" style="--i:1" d="${MAGENTA}" fill="none" stroke="${p.m}" stroke-width="${SW}" stroke-linecap="round"/></g>`;

/* ---------------- WORKS, hand-drawn (Tala), capitals with a taller W ---------------- */
export const HAND = [
  'M0.4 -8.6C1.6 3.6 3.6 18 6.6 30.6C9 20.4 11.4 10.6 13.6 3.4C15.6 11.2 18 21 20.6 30C23.2 18.2 26 4.6 28.6 -9.2',
  'M45.6 3.4C42 -0.6 34.6 -0.2 33.4 8.8C32.2 18.6 35.2 30.2 41.4 30.2C47.4 30.2 49.6 21.4 49 12.2C48.6 5.4 45.8 1.2 41.8 1.6',
  'M55.2 30.4C55 20.2 55 9.4 55.6 1C61.2 -0.6 67.4 0.8 67.4 7.4C67.4 13.6 61.4 15.2 56.2 15.2C60.4 19.4 64.4 25.2 68.8 30.6',
  'M75.2 0.6C75 11 75 21 75.6 30.6M88.4 0C84.4 6 80.2 11 76.2 16C80.4 20.2 84.4 25.4 89.2 31',
  'M108.2 4.2C105.2 0 98.2 -0.6 96.6 5C95.4 9.6 100 12 103.2 14C107.4 16.6 109.8 20 108.2 25.2C106.2 31.4 98.2 31.8 94.6 26.6',
];
export const UNDERLINE = 'M-2 40C26 37.6 66 36.8 104 34.6C107.6 34.4 110.6 34.6 113.4 35.6';
const HAND_W = 116, HAND_TOP = -10, HAND_BOT = 42;
export const worksBox = (k) => ({ w: HAND_W * k, h: (HAND_BOT - HAND_TOP) * k });
const worksTransform = ({ x, y, k }) => `translate(${f2(x + 4 * k)} ${f2(y - HAND_TOP * k)}) scale(${f2(k)}) skewX(-7)`;
/** WORKS ink: one stroke per letter (so it can be written on), then the underline. */
const worksInk = (p, w) => `<g class="works" transform="${worksTransform(w)}" fill="none" stroke="${p.r}" stroke-width="${w.sw ?? 3.3}" stroke-linecap="round" stroke-linejoin="round">${HAND.map((d, i) => `<path class="hw" pathLength="1" style="--i:${i}" d="${d}"/>`).join('')}<path class="ul" pathLength="1" d="${UNDERLINE}"/></g>`;
/** WORKS halo as mask content (black = cut away). It is drawn with the same pen timing, so the knockout follows the writing. */
const worksHaloMask = (w) => `<g transform="${worksTransform(w)}" fill="none" stroke="#000" stroke-width="${(w.sw ?? 3.3) + (w.hw ?? 5.5)}" stroke-linecap="round" stroke-linejoin="round">${HAND.map((d, i) => `<path class="hw" pathLength="1" style="--i:${i}" d="${d}"/>`).join('')}<path class="ul" pathLength="1" d="${UNDERLINE}"/></g>`;

/* ---------------- WOLFSBLVT outline (Abril Fatface) ---------------- */
// Layout matches the canvas: 100px size, letter-spacing 0.01em, font kerning on.
export function outlineName(font, size = 100, text = 'WOLFSBLVT', trackEm = .01) {
  const scale = size / font.unitsPerEm; let x = 0; const parts = []; let prev = null;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (prev) x += font.getKerningValue(prev, g) * scale + trackEm * size;
    parts.push(g.getPath(x, 0, size).toPathData(2));
    x += g.advanceWidth * scale; prev = g;
  }
  return { d: parts.join(''), w: x, capH: .7 * size };
}

/* ---------------- frames ---------------- */
function hold(p, box, { gx, gy }) {
  const H = ((box.y1 - box.y0) + 2 * gy) / (1 - 3 / 22.4);
  const s = H / 22.4, half = SW * s / 2;
  const x0 = box.x0 - gx - half, y0 = box.y0 - gy - half, x1 = box.x1 + gx + half, y1 = box.y1 + gy + half;
  const m = half + 2;
  return { s, x0, y0, x1, y1, o: cornerO(p, s, x0, y0), m: cornerM(p, s, x1, y1), bb: [x0 - m, y0 - m, x1 + m, y1 + m] };
}
const vbOf = (bb, extra = []) => {
  let [a, b, c, d] = bb; for (const e of extra) { a = Math.min(a, e[0]); b = Math.min(b, e[1]); c = Math.max(c, e[2]); d = Math.max(d, e[3]); }
  return [a, b, c - a, d - b].map(f2);
};

/* ---------------- motion (one motion everywhere) ---------------- */
// Corners draw first (magenta answers noticeably later); when they're done, the name lights up from dim
// while WORKS is written. Both start together; the writing finishes first.
// Dashes are '1 2' with a 1.001 offset so an undrawn round-capped stroke shows no dot at its start.
export const MOTION = { dim: .14, sweep: 2.2, ws: .19, wl: .26, corner: .7, stagger: .38, after: 1.15 };
export const motionCss = (scope = '.wk') => `${scope}{--dim:${MOTION.dim};--sweep:${MOTION.sweep}s;--ws:${MOTION.ws}s;--wl:${MOTION.wl}s;--corner:${MOTION.corner}s;--stagger:${MOTION.stagger}s;--after:${MOTION.after}s}
${scope} .dr,${scope} .hw,${scope} .ul{stroke-dasharray:1 2;stroke-dashoffset:1.001}
${scope} .dr{animation:wk-draw var(--corner) cubic-bezier(.55,0,.2,1) forwards;animation-delay:calc(var(--i,0) * var(--stagger) + .05s)}
${scope} .dot{transform-box:fill-box;transform-origin:50% 50%;animation:wk-pop .5s cubic-bezier(.3,1.9,.5,1) both calc(var(--after) - .05s)}
${scope} .name-base,${scope} .art-base{animation:wk-holddim var(--sweep) linear both var(--after)}
${scope} .art-glow{animation:wk-glowup var(--sweep) ease-in both var(--after)}
${scope} .wipe{animation:wk-wipein var(--sweep) cubic-bezier(.45,.05,.3,1) both var(--after)}
${scope} .band{animation:wk-band var(--sweep) cubic-bezier(.45,.05,.3,1) both var(--after)}
${scope} .hw{animation:wk-draw var(--wl) cubic-bezier(.4,0,.6,1) forwards;animation-delay:calc(var(--after) + var(--i) * var(--ws))}
${scope} .ul{animation:wk-draw .36s cubic-bezier(.3,0,.2,1) forwards;animation-delay:calc(var(--after) + 5 * var(--ws) + .04s)}
@keyframes wk-draw{to{stroke-dashoffset:0}}
@keyframes wk-pop{0%{transform:scale(0)}100%{transform:none}}
@keyframes wk-holddim{0%,99.9%{opacity:var(--dim)}100%{opacity:1}}
@keyframes wk-glowup{from{opacity:calc(var(--dim) * .25)}}
@keyframes wk-wipein{from{transform:translateX(calc(-1 * var(--travel)))}to{transform:none}}
@keyframes wk-band{from{transform:none}to{transform:translateX(var(--travel))}}
@media (prefers-reduced-motion:reduce){${scope} *{animation:none!important}${scope} .dr,${scope} .hw,${scope} .ul{stroke-dashoffset:0}}`;

/* ---------------- the name, static or lighting up ---------------- */
function nameLayers(p, N, { animated, id, mask }) {
  const maskAttr = mask ? ` mask="url(#${mask})"` : '';
  if (!animated || p.mode === 'mono') return `<g${maskAttr}><path class="${animated ? 'name-base' : ''}" d="${N.d}" fill="${p.fg}"/></g>`;
  const E = Math.max(N.w * .32, 70), travel = f2(N.w + 2 * E), top = f2(-N.capH * 1.5), h = f2(N.capH * 2.1);
  const mx = f2(-travel - E), mw = f2(travel * 2 + N.w + E * 2);
  return `<defs>
    <path id="${id}n" d="${N.d}"/>
    <linearGradient id="${id}g" x1="0" x2="${f2(N.w)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.o}"/><stop offset="1" stop-color="${p.m}"/></linearGradient>
    <linearGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}e"><stop offset="0" stop-color="#fff"/><stop offset="${f2(1 - E / 2 / (N.w + 2 * E))}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}w" maskUnits="userSpaceOnUse" x="${mx}" y="${top}" width="${mw}" height="${h}"><rect class="wipe" x="${f2(-E)}" y="${top}" width="${f2(N.w + 2 * E)}" height="${h}" fill="url(#${id}e)" style="--travel:${travel}px"/></mask>
    <mask id="${id}k" maskUnits="userSpaceOnUse" x="${mx}" y="${top}" width="${mw}" height="${h}"><rect class="band" x="${f2(-E)}" y="${top}" width="${f2(E)}" height="${h}" fill="url(#${id}b)" style="--travel:${travel}px"/></mask>
  </defs>
  <g${maskAttr}><use class="name-base" href="#${id}n" fill="${p.fg}"/><use href="#${id}n" fill="${p.fg}" mask="url(#${id}w)"/><use href="#${id}n" fill="url(#${id}g)" mask="url(#${id}k)"/></g>`;
}

/* ---------------- icon ---------------- */
export function iconSvg(mode = 'dark', { animated = false, size = null } = {}) {
  const p = palette(mode);
  const dim = size ? ` width="${size}" height="${size}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"${dim} role="img" aria-label="Wolfsblvt Works"${mode === 'mono' ? ' fill="currentColor"' : ''}${animated ? ' class="wk"' : ''}>
${animated ? `<style>${motionCss('.wk')}</style>` : ''}${cornerO(p, 1, 4.6, 5)}${cornerM(p, 1, 27.4, 27.4)}<circle class="dot" cx="${DOT[0]}" cy="${DOT[1]}" r="3.1" fill="${p.fg}"/></svg>`;
}
/** Favicon: one SVG that follows the browser's light/dark preference. */
export function faviconSvg() {
  const d = palette('dark'), l = palette('light');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<style>.o{stroke:${l.o}}.m{stroke:${l.m}}.d{fill:${l.fg}}@media (prefers-color-scheme:dark){.o{stroke:${d.o}}.m{stroke:${d.m}}.d{fill:${d.fg}}}</style>
<path class="o" d="${ORANGE}" fill="none" stroke-width="${SW}" stroke-linecap="round"/><path class="m" d="${MAGENTA}" fill="none" stroke-width="${SW}" stroke-linecap="round"/><circle class="d" cx="${DOT[0]}" cy="${DOT[1]}" r="3.1"/></svg>`;
}
export const glyphSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${GLYPH24}</svg>`;

/* ---------------- lockup (also the wordmark) ---------------- */
// full    — WORKS written over the end of the name, lower. Use at 40px tall and up.
// compact — WORKS bigger and lower, across the name and the magenta corner. Use below 40px (the 32px header).
// Layering: orange · name (knocked out under WORKS) · magenta corner · WORKS ink.
// The magenta corner is never knocked out, so WORKS reads as written over it.
export function lockupGeometry(N, variant) {
  const capH = N.capH, w = N.w, capTop = -capH, base = 0;
  if (variant === 'full') {
    const k = (capH * .5) / 30, wb = worksBox(k), wx = w - wb.w * .8, wy = base - capH * .4;
    const h = hold(palette('dark'), { x0: 0, y0: capTop, x1: Math.max(w, wx + wb.w * .97), y1: wy + wb.h * .92 }, { gx: capH * .4, gy: capH * .14 });
    return { h, works: { x: wx, y: wy, k, sw: 3.3, hw: 5.5 }, vb: vbOf(h.bb) };
  }
  const h = hold(palette('dark'), { x0: 0, y0: capTop, x1: w, y1: base }, { gx: capH * .36, gy: capH * .16 });
  const k = (capH * .66) / 30, wb = worksBox(k), wx = h.x1 - wb.w * .97, wy = base - capH * .3;
  return { h, works: { x: wx, y: wy, k, sw: 3.9, hw: 6 }, vb: vbOf(h.bb, [[wx - 4, wy, wx + wb.w + 6, wy + wb.h + 2]]) };
}
export function lockupSvg(N, variant = 'full', mode = 'dark', { animated = false, height = null } = {}) {
  const p = palette(mode), G = lockupGeometry(N, variant), id = `wk-${variant}-${mode}-`;
  const vb = G.vb, dims = height ? ` height="${height}" width="${f2(height * vb[2] / vb[3])}"` : '';
  const ko = `<mask id="${id}ko" maskUnits="userSpaceOnUse" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>${worksHaloMask(G.works)}</mask>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}"${dims} role="img" aria-label="Wolfsblvt Works"${animated ? ' class="wk"' : ''}>
${animated ? `<style>${motionCss('.wk')}</style>` : ''}<defs>${ko}</defs>
${cornerO(p, G.h.s, G.h.x0, G.h.y0)}${nameLayers(p, N, { animated, id, mask: `${id}ko` })}${cornerM(p, G.h.s, G.h.x1, G.h.y1)}${worksInk(p, G.works)}</svg>`;
}

/* ---------------- sponsor banner (static / animated SVG for READMEs and fixed slots) ---------------- */
// The web section is real HTML (see ../sponsor-section). This is the same composition for places that
// only take an image. Copy stays editable <text>; it falls back to Georgia where Literata isn't installed.
export const SPONSOR_COPY = {
  head: 'Support the work.',
  lines: ['Help fund development, maintenance,', 'and the ideas behind Wolfsblvt Works.'],
};
export function sponsorArt(N, mode, { animated, id }) {
  // The art lives in a 640×320 box; letters anchored at the end so the distinctive …BLVT shows.
  const p = palette(mode), dark = mode !== 'light';
  const SIZE = 232, sc = SIZE / 100, X = 664 - N.w * sc, Y = 240, E = 240, travel = 640 + 2 * E;
  const face = dark ? '#1c131c' : '#f3e9df';
  const L = `<path id="${id}L" d="${N.d}" transform="translate(${f2(X)} ${Y}) scale(${sc})"/>`;
  const use = (attrs) => `<use href="#${id}L" ${attrs}/>`;
  const letters = `${use(`fill="${p.o}" transform="translate(-2.6 -2.6)"`)}${use(`fill="${p.m}" transform="translate(2.6 2.6)"`)}${use(`fill="${face}"`)}`;
  const defs = `<defs>${L}
    <linearGradient id="${id}h" x1="300" x2="650" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? '#ffd9a6' : p.o}"/><stop offset="1" stop-color="${dark ? '#ffc0e4' : p.m}"/></linearGradient>
    <filter id="${id}f" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
    ${animated ? `<linearGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="${id}e"><stop offset="0" stop-color="#fff"/><stop offset="${f2(1 - E / 2 / travel)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${id}w" maskUnits="userSpaceOnUse" x="${-travel - E}" y="-40" width="${travel * 2 + 640 + 2 * E}" height="400"><rect class="wipe" x="${-E}" y="-40" width="${travel}" height="400" fill="url(#${id}e)" style="--travel:${travel}px"/></mask>
    <mask id="${id}k" maskUnits="userSpaceOnUse" x="${-travel - E}" y="-40" width="${travel * 2 + 640 + 2 * E}" height="400"><rect class="band" x="${-E}" y="-40" width="${E}" height="400" fill="url(#${id}b)" style="--travel:${travel}px"/></mask>` : ''}</defs>`;
  const glow = `<g class="art-glow" filter="url(#${id}f)" opacity="${dark ? .26 : .22}">${use(`fill="${p.o}" transform="translate(-6 -6)"`)}${use(`fill="${p.m}" transform="translate(6 6)"`)}</g>`;
  const fg = animated
    ? `<g class="art-base">${letters}</g><g mask="url(#${id}w)">${letters}</g>${use(`fill="none" stroke="url(#${id}h)" stroke-width="2.6" mask="url(#${id}k)"`)}`
    : letters;
  return { defs, glow, fg };
}
export function sponsorBannerSvg(N, mode = 'dark', { animated = false, w = 880, h = 300, s = 4 } = {}) {
  const p = palette(mode), dark = mode !== 'light', id = `wks-${mode}-`;
  const panel = dark ? '#140d14' : '#fff7ee', rule = dark ? 'rgb(243 232 220 / 14%)' : '#efe1d0';
  const ink = dark ? COLORS.text : '#2b1d14', soft = dark ? COLORS.soft : '#6b5446';
  const rTL = R_O * s, rBR = R_M * s, r = dark ? 10 : 24;
  const shape = `M${rTL} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${f2(h - rBR)}A${rBR} ${rBR} 0 0 1 ${f2(w - rBR)} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${rTL}A${rTL} ${rTL} 0 0 1 ${rTL} 0Z`;
  const art = sponsorArt(N, mode, { animated, id });
  const sc = h / 320, ax = w - 640 * sc;
  const k = 25 / 30, wb = worksBox(k), wx = w - (17.9 * s + 14) - wb.w, wy = h - (4 * s + 8) - wb.h;
  const W = { x: wx, y: wy, k, sw: 3.4, hw: 6.5 };
  const pad = 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}" width="${w + 2 * pad}" height="${h + 2 * pad}" role="img" aria-label="Support the work. Help fund development, maintenance, and the ideas behind Wolfsblvt Works."${animated ? ' class="wk"' : ''}>
${animated ? `<style>${motionCss('.wk')}</style>` : ''}<defs>
  <clipPath id="${id}clip"><path d="${shape}"/></clipPath>
  <linearGradient id="${id}veil" x1="0" x2="${w}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${panel}"/><stop offset=".26" stop-color="${panel}"/><stop offset=".4" stop-color="${panel}" stop-opacity=".7"/><stop offset=".58" stop-color="${panel}" stop-opacity="0"/></linearGradient>
  <mask id="${id}ko" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#fff"/>${worksHaloMask(W)}</mask>
</defs>
<path d="${shape}" fill="${panel}"/>
<g clip-path="url(#${id}clip)"><g mask="url(#${id}ko)"><g transform="translate(${f2(ax)} 0) scale(${f2(sc)})">${art.defs}${art.glow}${art.fg}</g></g><rect width="${w}" height="${h}" fill="url(#${id}veil)"/></g>
<path d="${shape}" fill="none" stroke="${rule}"/>
<g font-family="Literata, Georgia, 'Times New Roman', serif">
  <text x="58" y="${f2(h / 2 - 22)}" font-size="44" letter-spacing="-1.1" fill="${ink}">${SPONSOR_COPY.head}</text>
  <text x="58" y="${f2(h / 2 + 22)}" font-size="17" fill="${soft}">${SPONSOR_COPY.lines[0]}</text>
  <text x="58" y="${f2(h / 2 + 48)}" font-size="17" fill="${soft}">${SPONSOR_COPY.lines[1]}</text>
</g>
${cornerO(p, s, 0, 0)}${cornerM(p, s, w, h)}${worksInk(p, W)}</svg>`;
}
