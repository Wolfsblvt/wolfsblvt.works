// Generates the reusable web sponsor section: CSS (layout + the one motion), a play-once script,
// per-instance markup, and a specimen page showing it on Works, diffdevil, a light page and a phone.
import * as K from './core.mjs';

const S = 4; // corners at the 128px icon scale (selected)
const VB = 'viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false"';

export const LAYOUT_CSS = `/* Wolfsblvt Works — shared sponsor section.
   Works owns: the artwork, the two corners on the border, the WORKS note, the two Works radii, the motion.
   The host owns: panel background and border, its other two radii, typography, buttons, spacing around it.
   Set --works-sponsor-veil to the panel's background colour so the copy side stays calm. */
.works-sponsor{--works-sponsor-veil:#140d14;position:relative;container-type:inline-size}
.works-sponsor__panel{position:relative;overflow:hidden;isolation:isolate;min-height:270px;display:flex;align-items:center;
  border-top-left-radius:${K.R_O * S}px;border-bottom-right-radius:${K.R_M * S}px}
.works-sponsor__art{position:absolute;inset:0 0 0 auto;width:74%;z-index:-2}
.works-sponsor__art svg{position:absolute;inset:0;width:100%;height:100%;display:block}
.works-sponsor__veil{position:absolute;inset:0;z-index:-1;pointer-events:none;
  background:linear-gradient(90deg,var(--works-sponsor-veil) 0%,var(--works-sponsor-veil) 24%,color-mix(in srgb,var(--works-sponsor-veil) 70%,transparent) 36%,transparent 54%)}
.works-sponsor__copy{position:relative;padding:56px clamp(22px,3vw,40px) 52px 56px;max-width:min(520px,60%)}
.works-sponsor__corner{position:absolute;width:${32 * S}px;height:${32 * S}px;overflow:visible;pointer-events:none;z-index:2}
.works-sponsor__corner--tl{left:${-4.6 * S}px;top:${-5 * S}px}
.works-sponsor__corner--br{right:${-(32 - 27.4) * S}px;bottom:${-(32 - 27.4) * S}px}
.works-sponsor__works{position:absolute;overflow:visible;pointer-events:none;z-index:3;right:${17.9 * S + 14}px;bottom:${4 * S + 8}px}
/* Narrow sections: one column, the type behind the copy at low strength, WORKS written over the magenta corner. */
@container (max-width:600px){
  .works-sponsor__art{width:100%;opacity:.24}
  .works-sponsor__veil{display:none}
  .works-sponsor__copy{max-width:100%;padding:52px 30px 92px 40px}
  .works-sponsor__works{right:${1.5 * S}px;bottom:${-2.2 * S}px}
}
`;

// Before the section is seen, it waits in its start state; IntersectionObserver adds .is-playing once.
const PRE = '.works-sponsor.will-play:not(.is-playing)';
export const MOTION_CSS = `/* Motion: corners draw (magenta answers later), then the letters light up from dim while WORKS is written. Plays once. */
.works-sponsor{--dim:${K.MOTION.dim}}
${PRE} .dr,${PRE} .hw,${PRE} .ul{stroke-dasharray:1 2;stroke-dashoffset:1.001}
${PRE} .art-base{opacity:var(--dim)}
${PRE} .art-glow{opacity:calc(var(--dim) * .25)}
${PRE} .wipe{transform:translateX(calc(-1 * var(--travel)))}
${K.motionCss('.works-sponsor.is-playing')}
`;

export const PLAY_JS = `// Wolfsblvt Works sponsor section: play the motion once when the section first comes into view.
// Without JS, with reduced motion, or without IntersectionObserver, the section simply shows its finished state.
(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-playing'); io.unobserve(e.target); }
  }), { threshold: 0.35 });
  document.querySelectorAll('.works-sponsor').forEach((el) => { el.classList.add('will-play'); io.observe(el); });
})();
`;

export const COPY = {
  head: 'Support the work.',
  common: 'Help fund development, maintenance, and the ideas behind Wolfsblvt Works.',
  works: 'Your support gives me more room for the projects that need a longer stretch of attention, and helps cover infrastructure, releases and artwork.',
};

/** One section instance. ids must be unique per page (the artwork uses SVG masks).
 *  The two hrefs are placeholders until the real enabled GitHub Sponsors and Ko-fi destinations are set. */
export function sectionHtml(N, { mode = 'dark', id = 'works-sponsor', add = '', hostClass = '', headingLevel = 2, sponsorsHref = '#github-sponsors', kofiHref = '#ko-fi' } = {}) {
  const p = K.palette(mode), a = K.sponsorArt(N, mode, { animated: true, id: `${id}-` });
  const k = 25 / 30, wb = K.worksBox(k), W = { x: 0, y: 0, k };
  const hw = (cls) => K.HAND.map((d, i) => `<path class="${cls}" pathLength="1" style="--i:${i}" d="${d}"/>`).join('');
  const tf = `translate(${(4 * k).toFixed(2)} ${(10 * k).toFixed(2)}) scale(${k.toFixed(3)}) skewX(-7)`;
  const halo = `<g transform="${tf}" fill="none" style="stroke:var(--works-sponsor-veil)" stroke-width="9.9" stroke-linecap="round" stroke-linejoin="round">${hw('hw')}<path class="ul" pathLength="1" d="${K.UNDERLINE}"/></g>`;
  const ink = `<g transform="${tf}" fill="none" stroke="${p.r}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">${hw('hw')}<path class="ul" pathLength="1" d="${K.UNDERLINE}"/></g>`;
  const H = `h${headingLevel}`;
  return `<div class="works-sponsor ${hostClass}">
  <section class="works-sponsor__panel" aria-labelledby="${id}-title">
    <div class="works-sponsor__art"><svg class="works-sponsor__glow" ${VB}>${a.defs}${a.glow}</svg><svg class="works-sponsor__letters" ${VB}>${a.fg}</svg></div>
    <div class="works-sponsor__veil"></div>
    <div class="works-sponsor__copy">
      <${H} id="${id}-title">${COPY.head}</${H}>
      <p>${COPY.common}</p>${add ? `\n      <p class="add">${add}</p>` : ''}
      <div class="actions"><a class="primary" href="${sponsorsHref}">GitHub Sponsors</a><a class="secondary" href="${kofiHref}">Ko-fi</a></div>
    </div>
  </section>
  <svg class="works-sponsor__corner works-sponsor__corner--tl" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="dr" pathLength="1" d="${K.ORANGE}" fill="none" stroke="${p.o}" stroke-width="${K.SW}" stroke-linecap="round"/></svg>
  <svg class="works-sponsor__corner works-sponsor__corner--br" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path class="dr" pathLength="1" style="--i:1" d="${K.MAGENTA}" fill="none" stroke="${p.m}" stroke-width="${K.SW}" stroke-linecap="round"/></svg>
  <svg class="works-sponsor__works" width="${(wb.w + 12).toFixed(1)}" height="${(wb.h + 8).toFixed(1)}" viewBox="-7 -3 ${(wb.w + 12).toFixed(1)} ${(wb.h + 8).toFixed(1)}" aria-hidden="true" focusable="false">${halo}${ink}</svg>
</div>`;
}

// Specimen host styles: sketches of three host pages (diffdevil from its window in the Walk; the light page is illustrative).
const HOSTS_CSS = `
body{margin:0;background:#1b1a1e;color:#ece6ef;font:14px/1.5 'Albert Sans',system-ui,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:40px 24px 100px;display:flex;flex-direction:column;gap:40px}
.cap{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#a8a2ad;margin:0 0 10px}
h1{font:400 34px/1.1 'Literata',Georgia,serif;margin:0}
.lede{color:#c9c2cd;max-width:70ch}
.btn{appearance:none;border:1px solid #3a3640;background:#1a181d;color:#ece6ef;font:inherit;font-size:12.5px;padding:6px 12px;border-radius:999px;cursor:pointer}
.phones{display:flex;gap:24px;flex-wrap:wrap}.phone{width:380px;max-width:100%;padding:14px;border-radius:26px;background:#09080a;border:1px solid #2c2930}
.works-sponsor .actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.works-sponsor .actions a{display:inline-flex;align-items:center;min-height:40px;padding:0 16px;text-decoration:none;font-weight:600;font-size:14px}
.works-sponsor .actions a:focus-visible{outline:2px solid #73cae3;outline-offset:3px}
.works-sponsor h2,.works-sponsor h3{margin:0}.works-sponsor p{margin:10px 0 0}
/* Works itself */
.host-works{--works-sponsor-veil:#140d14}
.host-works .works-sponsor__panel{background:linear-gradient(160deg,#120c13 0%,#181018 60%,#0d1318 100%);border:1px solid rgb(243 232 220 / 12%);border-top-right-radius:10px;border-bottom-left-radius:10px;color:#f3e8dc;min-height:330px}
.host-works h2{font:400 clamp(34px,3.4vw,48px)/1 'Literata',serif;letter-spacing:-.025em;font-variation-settings:'opsz' 72}
.host-works p{font-family:'Literata',serif;font-size:16.5px;color:#d1c0b8;line-height:1.55}.host-works .add{color:#e6d8cc}
.host-works .actions a{border-radius:999px}.host-works .primary{background:#f3e8dc;color:#140d14}.host-works .secondary{border:1px solid rgb(243 232 220 / 35%);color:#f3e8dc}
/* diffdevil */
.host-dd{--works-sponsor-veil:#151922}
.host-dd .works-sponsor__panel{background:#151922;border:1px solid #484d58;color:#f0f2f5;font-family:'IBM Plex Sans',sans-serif}
.host-dd h2{font-weight:600;font-size:24px}.host-dd p{color:#aab0bb;font-size:14px}
.host-dd .actions a{border-radius:6px;font-size:13.5px;min-height:36px}.host-dd .primary{background:#f061ba;color:#151922}.host-dd .secondary{border:1px solid #484d58;color:#f0f2f5}
/* a light product page */
.host-light{--works-sponsor-veil:#fff7ee}
.host-light .works-sponsor__panel{background:#fff7ee;color:#2b1d14;border:1px solid #efe1d0;border-top-right-radius:24px;border-bottom-left-radius:24px}
.host-light h2{font:800 28px 'Albert Sans',sans-serif;letter-spacing:-.03em}.host-light p{color:#6b5446;font-size:14px}.host-light .add{color:#2b1d14;font-weight:600}
.host-light .actions a{border-radius:999px;font-size:13.5px;min-height:38px}.host-light .primary{background:#2b1d14;color:#fff7ee}.host-light .secondary{border:1.5px solid #2b1d14;color:#2b1d14}
`;

export function specimenHtml(N) {
  const sec = (o) => sectionHtml(N, o);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Works Sponsor Section</title>
<link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,400&family=Albert+Sans:wght@400..800&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="works-sponsor.css">
<style>${HOSTS_CSS}</style>
</head>
<body>
<div class="wrap">
  <div><p class="cap">Wolfsblvt Works · shared sponsor section · specimen</p><h1>One section, three very different hosts</h1>
  <p class="lede">The copy is real HTML in each host's own type and buttons. Works brings the artwork, the two corners drawn on the border, the WORKS note and the motion. Scroll each into view to play it once; <button class="btn" onclick="document.querySelectorAll('.works-sponsor').forEach(s=>{s.classList.remove('is-playing');void s.offsetWidth;s.classList.add('is-playing')})">Replay all ↻</button></p></div>
  <div><p class="cap">On Works · the full Works instance</p>${sec({ mode: 'dark', id: 'sp-works', hostClass: 'host-works', add: COPY.works })}</div>
  <div><p class="cap">On diffdevil · common words only</p>${sec({ mode: 'dark', id: 'sp-dd', hostClass: 'host-dd' })}</div>
  <div><p class="cap">On a light product page · example project line</p>${sec({ mode: 'light', id: 'sp-light', hostClass: 'host-light', add: 'A little support for smaller images.' })}</div>
  <div><p class="cap">Small screens</p><div class="phones"><div class="phone">${sec({ mode: 'dark', id: 'sp-phone-d', hostClass: 'host-works', add: COPY.works })}</div><div class="phone" style="background:#e9e3da">${sec({ mode: 'light', id: 'sp-phone-l', hostClass: 'host-light', add: 'A little support for smaller images.' })}</div></div></div>
</div>
<script src="works-sponsor.js"></script>
</body>
</html>
`;
}
