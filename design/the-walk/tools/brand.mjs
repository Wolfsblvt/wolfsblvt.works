// The Works marks for the site, lifted from the brand return (design/marks/return/02-marks-and-sponsor-assets).
// One source for Main and the generated rooms: the scroll-eased header lockup, the footer lockup and the
// Works-hosted sponsor section. Nothing here redraws a mark; it re-ids, re-scopes and parameterises the returned SVG.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RET = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'marks', 'return', '02-marks-and-sponsor-assets');
const read = (p) => readFileSync(join(RET, p), 'utf8');
const stripXml = (s) => s.replace(/<\?xml[^>]*\?>\s*/, '');

function mustReplace(s, from, to, count = 1) {
  const n = s.split(from).length - 1;
  if (n !== count) throw new Error(`brand.mjs: expected ${count}× "${from.slice(0, 60)}", found ${n}`);
  return s.split(from).join(to);
}

// The two drawings. The header interpolates between them while scrolling instead of crossfading two images.
export const LOCKUP = {
  full: { vb: [-48.16, -99.96, 725.72, 157.73], o: [-64.92, -119.14, 6.05], m: [500.65, -119.14, 6.05], w: [502.8, -16.33, 1.17], wsw: 3.3, ksw: 8.8 },
  compact: { vb: [-41.49, -97.49, 691.59, 158.57], o: [-54.25, -112.16, 4.76], m: [508.24, -112.16, 4.76], w: [471.62, -5.6, 1.54], wsw: 3.9, ksw: 9.9 },
};

// Runtime half of the header ease, pasted into each artboard's script. t is the header's scroll progress (0 at the
// top, 1 once settled); topPx is the drawn height of the full lockup before scrolling.
export const MARK_JS = String.raw`
const LOCKUP = ${JSON.stringify(LOCKUP)};
// the mark at the top is the full drawing, large and hanging over the header border; scrolling eases it into the
// compact 32px drawing, transform by transform, rather than crossfading two pictures
function markVals(t, topPx, narrow, still) {
  const k = t * t * (3 - 2 * t); const F = LOCKUP.full, C = LOCKUP.compact;
  const mix = (a, b) => a.map((v, i) => Math.round((v + (b[i] - v) * k) * 100) / 100);
  const vb = mix(F.vb, C.vb), o = mix(F.o, C.o), m = mix(F.m, C.m), w = mix(F.w, C.w);
  const top = narrow ? Math.min(topPx, 42) : topPx;
  const h = top + (32 - top) * k, wd = h * vb[2] / vb[3], mt = (narrow ? 10 : 7) + ((narrow ? 15 : 15) - (narrow ? 10 : 7)) * k;
  return {
    vb: vb.join(' '), cls: still ? 'mark-still' : '',
    style: 'width:' + Math.round(wd * 10) / 10 + 'px;height:' + Math.round(h * 10) / 10 + 'px;margin-top:' + Math.round(mt * 10) / 10 + 'px',
    oT: 'translate(' + o[0] + ' ' + o[1] + ') scale(' + o[2] + ')', mT: 'translate(' + m[0] + ' ' + m[1] + ') scale(' + m[2] + ')',
    wT: 'translate(' + w[0] + ' ' + w[1] + ') scale(' + w[2] + ') skewX(-7)',
    wSW: Math.round((F.wsw + (C.wsw - F.wsw) * k) * 100) / 100, kSW: Math.round((F.ksw + (C.ksw - F.ksw) * k) * 100) / 100,
  };
}
`;

// ---------- header: the animated full lockup with every differing transform as a template hole ----------
export function headerLockup() {
  let s = stripXml(read('svg/lockup/works-lockup-animated-dark.svg'));
  s = s.replace(/<style>[\s\S]*?<\/style>\s*/, '');
  s = mustReplace(s, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works" class="wk">',
    '<svg class="wk mark-head {{mark.cls}}" viewBox="{{mark.vb}}" style="{{mark.style}}" aria-hidden="true" focusable="false">');
  s = s.split('wk-full-dark-').join('hk-');
  // a generous fixed knockout region so the mask survives the viewBox ease
  s = mustReplace(s, 'x="-48.16" y="-99.96" width="725.72" height="157.73"', 'x="-80" y="-130" width="800" height="230"', 2);
  s = mustReplace(s, 'transform="translate(502.8 -16.33) scale(1.17) skewX(-7)"', 'transform="{{mark.wT}}"', 2);
  s = mustReplace(s, 'stroke="#000" stroke-width="8.8"', 'stroke="#000" stroke-width="{{mark.kSW}}"');
  s = mustReplace(s, 'stroke="#ef8ea1" stroke-width="3.3"', 'stroke="#ef8ea1" stroke-width="{{mark.wSW}}"');
  s = mustReplace(s, 'transform="translate(-64.92 -119.14) scale(6.05)"', 'transform="{{mark.oT}}"');
  s = mustReplace(s, 'transform="translate(500.65 -119.14) scale(6.05)"', 'transform="{{mark.mT}}"');
  return s;
}

// The motion rules from the animated SVG, scoped to the header mark; .mark-still shows the finished state.
export function markCss() {
  const svg = read('svg/lockup/works-lockup-animated-dark.svg');
  const css = /<style>([\s\S]*?)<\/style>/.exec(svg)[1];
  return css + '\n.wk.mark-still *{animation:none!important}.wk.mark-still .dr,.wk.mark-still .hw,.wk.mark-still .ul{stroke-dashoffset:0}\n';
}

// ---------- footer: the static full lockup ----------
export function footerLockup(idPrefix = 'fk-') {
  let s = stripXml(read('svg/lockup/works-lockup-dark.svg'));
  s = mustReplace(s, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works">',
    '<svg class="mark-foot" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works" focusable="false">');
  return s.split('wk-full-dark-').join(idPrefix);
}

// ---------- the sponsor section, Works instance, from the return's specimen ----------
export function sponsorSection() {
  const lines = read('sponsor-section/specimen.html').split('\n');
  const start = lines.findIndex((l) => l.includes('<div class="works-sponsor host-works">'));
  const end = lines.findIndex((l, i) => i > start && l.trim() === '</div></div>');
  if (start < 0 || end < 0) throw new Error('brand.mjs: Works sponsor block not found in specimen.html');
  let html = lines.slice(start, end + 1).join('\n');
  html = html.replace(/^.*?<div class="works-sponsor host-works">/, '<div class="works-sponsor host-works" ref="{{sponsorRef}}">').replace(/<\/div><\/div>\s*$/, '</div>');
  return html;
}

export function sponsorCss() {
  const css = read('sponsor-section/works-sponsor.css');
  const spec = read('sponsor-section/specimen.html');
  const host = spec.split('\n').filter((l) => /^\.(works-sponsor \.actions|works-sponsor h2|host-works)/.test(l)).join('\n');
  return css + '\n' + host + '\n';
}
