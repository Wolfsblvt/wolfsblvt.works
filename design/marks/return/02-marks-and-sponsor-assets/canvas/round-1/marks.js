// Wolfsblvt Works — mark explorations, round 1.
// Every mark here is hand-built SVG so it can be inspected, animated and later exported.
// Typeset lockups use live Google Fonts (Literata, Albert Sans, Shantell Sans) as explicit
// provisional stand-ins; a chosen direction gets outlined/drawn paths in round 2.

const C = {
  canvas: '#100b11', surface: '#181219', raised: '#211720',
  text: '#f3e8dc', soft: '#d1c0b8', muted: '#c0b0b1',
  orange: '#eca557', rose: '#ef8ea1', magenta: '#db61aa', cyan: '#73cae3', plum: '#4d1b40',
  // provisional light relatives (authored, not inverted)
  paper: '#f6efe6', ink: '#22171c', inkSoft: '#6d5a60',
  orangeInk: '#b8661f', magentaInk: '#a8327a', roseInk: '#c4506b',
};

const theme = (dark) => dark
  ? { bg: C.canvas, fg: C.text, soft: C.soft, o: C.orange, m: C.magenta, r: C.rose, plum: C.plum }
  : { bg: C.paper, fg: C.ink, soft: C.inkSoft, o: C.orangeInk, m: C.magentaInk, r: C.roseInk, plum: '#5a2149' };

/* ------------------------------------------------------------------ */
/* Monoline caps (direction B). Cap height 24, drawn as strokes.       */
/* ------------------------------------------------------------------ */
const MONO = {
  W: { w: 25, d: 'M0 0L7 24L14 0M10 0L17.5 24L25 0' },
  O: { w: 22, d: 'M11 0C17.1 0 22 5.4 22 12S17.1 24 11 24 0 18.6 0 12 4.9 0 11 0Z' },
  L: { w: 13, d: 'M0 0V24H13' },
  F: { w: 13, d: 'M13 0H0V24M0 11.5H10' },
  S: { w: 15, d: 'M14.5 4C13 1.5 10.5 0 7.5 0 3.8 0 1 2.2 1 5.8 1 9.8 4.5 10.9 7.8 11.9 11.4 13 15 14.3 15 18.3 15 21.9 12 24 8 24 4.6 24 1.8 22.6 0 20' },
  B: { w: 14.6, d: 'M0 24V0H7.5C11.2 0 13.2 2.2 13.2 5.8S11.2 11.5 7.5 11.5H0M7.5 11.5H8.3C12.4 11.5 14.6 14 14.6 17.8S12.3 24 8.3 24H0' },
  V: { w: 19, d: 'M0 0L9.5 24L19 0' },
  T: { w: 17, d: 'M0 0H17M8.5 0V24' },
  R: { w: 14.5, d: 'M0 24V0H8C11.8 0 14 2.3 14 6.2S11.8 12.4 8 12.4H0M7.5 12.4L14.5 24' },
  K: { w: 14.5, d: 'M0 0V24M14 0L0 15M4.8 10L14.5 24' },
};
// optical gaps between pairs (default 5)
const MONO_KERN = { LF: 3.5, FS: 4, LV: 2.5, VT: 0.5, OR: 4.5, RK: 4.5, KS: 3.5 };

function monoWord(word, { x = 0, y = 0, scale = 1, stroke = 2.4, color = 'currentColor', track = 0, split = null, draw = false } = {}) {
  let cx = 0; const parts = [];
  for (let i = 0; i < word.length; i++) {
    const ch = word[i], g = MONO[ch];
    if (i > 0) cx += (MONO_KERN[word[i - 1] + ch] ?? 5) + track;
    const pl = draw ? ' pathLength="1" class="draw" style="--i:' + i + '"' : '';
    if (ch === 'W' && split) {
      parts.push(`<path${pl} d="M${cx} 0L${cx + 7} 24L${cx + 14} 0" stroke="${split[0]}"/>`);
      parts.push(`<path${pl} d="M${cx + 10} 0L${cx + 17.5} 24L${cx + 25} 0" stroke="${split[1]}"/>`);
    } else {
      parts.push(`<path${pl} transform="translate(${cx} 0)" d="${g.d}"/>`);
    }
    cx += g.w;
  }
  return {
    width: cx * scale,
    svg: `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${stroke / scale * scale}" stroke-linecap="round" stroke-linejoin="round" vector-effect="none">${parts.join('')}</g>`,
  };
}

/* ------------------------------------------------------------------ */
/* Symbols — 32×32 compact marks per direction                         */
/* ------------------------------------------------------------------ */
const SYM = {
  // A — Chip-cut: a chip-carved V lit from the left (orange) and right (magenta).
  A(dark = true, { rich = false, mono = false } = {}) {
    const t = theme(dark);
    if (mono) return `<polygon points="4,7 28,7 16,13.67" fill="${t.fg}" opacity=".22"/><polygon points="4,7 16,13.67 16,27" fill="${t.fg}"/><polygon points="28,7 16,27 16,13.67" fill="${t.fg}" opacity=".58"/>`;
    const top = dark ? '#3b1733' : '#5a2149';
    if (!rich) return `<polygon points="4,7 28,7 16,13.67" fill="${top}"/><polygon points="4,7 16,13.67 16,27" fill="${t.o}"/><polygon points="28,7 16,27 16,13.67" fill="${t.m}"/>`;
    const id = 'a' + Math.random().toString(36).slice(2, 7);
    return `<defs>
      <linearGradient id="${id}l" x1="4" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? '#f6c98a' : '#d4893f'}"/><stop offset="1" stop-color="${t.o}"/></linearGradient>
      <linearGradient id="${id}r" x1="28" y1="7" x2="16" y2="25" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? '#ee86c4' : '#c24a92'}"/><stop offset="1" stop-color="${dark ? '#b84590' : '#8e2766'}"/></linearGradient>
      <linearGradient id="${id}t" x1="16" y1="7" x2="16" y2="13.7" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${dark ? '#24101f' : '#3d1532'}"/></linearGradient>
    </defs>
    <polygon class="fa ft" points="4,7 28,7 16,13.67" fill="url(#${id}t)"/>
    <polygon class="fa fl" points="4,7 16,13.67 16,27" fill="url(#${id}l)"/>
    <polygon class="fa fr" points="28,7 16,27 16,13.67" fill="url(#${id}r)"/>`;
  },
  // B — Double-V: W written as two unequal, overlapping Vs.
  B(dark = true, { mono = false, weave = false, sw = 3.2 } = {}) {
    const t = theme(dark);
    const c1 = mono ? t.fg : t.o, c2 = mono ? t.fg : t.m;
    const v1 = 'M4 6.5L10.5 26L17 6.5', v2 = 'M12.6 6.5L20.4 27L28.2 5.2';
    return `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path class="draw" pathLength="1" style="--i:0" d="${v1}" stroke="${c1}" stroke-width="${sw}"/>
      ${weave ? `<path d="M13.6 9.1L16.3 16.2" stroke="${t.bg}" stroke-width="${sw + 2.6}" stroke-linecap="butt"/>` : ''}
      <path class="draw" pathLength="1" style="--i:1" d="${v2}" stroke="${c2}" stroke-width="${sw}"/></g>`;
  },
  // C — Maker's punch: a hallmark stamp with the V notched into its edge.
  C(dark = true, { mono = false, letter = true } = {}) {
    const t = theme(dark);
    const fill = mono ? t.fg : (dark ? C.text : C.ink);
    const notch = 'M3 9.2Q3 6 6.2 6H12.4L16 10.2L19.6 6H25.8Q29 6 29 9.2V23.8Q29 27 25.8 27H6.2Q3 27 3 23.8Z';
    return `<g class="punch"><path d="${notch}" fill="${fill}"/>
      ${letter ? `<path d="M8.6 13.6L11.6 22.2L16 15.2L20.4 22.2L23.4 13.6" fill="none" stroke="${t.bg}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${!mono ? `<path d="M12.4 6L16 10.2L19.6 6" fill="none" stroke="${t.o}" stroke-width="1.4" stroke-linejoin="round" opacity="0"/>` : ''}</g>`;
  },
  // D — Margin note: a heavy W, circled by hand in rose.
  D(dark = true, { mono = false } = {}) {
    const t = theme(dark);
    return `<text x="16.2" y="22.6" text-anchor="middle" font-family="Literata" font-weight="800" font-size="17.5" style="font-variation-settings:'opsz' 24" fill="${t.fg}">W</text>
      <path class="draw" pathLength="1" style="--i:0" d="M24.8 5.2C21.6 3.4 17.6 2.9 13.6 3.6 7.4 4.8 3.3 9.8 4 16.4 4.8 23.4 10.8 28.2 18 27.4 24.9 26.6 29.2 21 28.4 14.6 27.9 10.8 25.6 7.9 22 6.3 19.3 5.1 16.6 5 14.1 5.6" fill="none" stroke="${mono ? t.fg : t.r}" stroke-width="1.9" stroke-linecap="round"/>`;
  },
  // E — Two lights: two unequal winds of light holding a centre.
  E(dark = true, { mono = false } = {}) {
    const t = theme(dark);
    return `<g fill="none" stroke-linecap="round" stroke-width="3">
      <path class="draw" pathLength="1" style="--i:0" d="M4.6 20.5V13.2C4.6 8.2 7.6 5 12.6 5H17.5" stroke="${mono ? t.fg : t.o}"/>
      <path class="draw" pathLength="1" style="--i:1" d="M27.4 8.5V15.5C27.4 23 22.8 27.4 14.6 27.4H9.5" stroke="${mono ? t.fg : t.m}"/></g>
      <circle class="dot" cx="16" cy="16.2" r="3.1" fill="${t.fg}"/>`;
  },
};

/* ------------------------------------------------------------------ */
/* wolfsblvt-icons glyph candidates — 24×24, 2px round, currentColor   */
/* ------------------------------------------------------------------ */
const GLYPH = {
  A: '<path d="M3.5 5.5h17L12 19.5Z"/><path d="M3.5 5.5 12 10.2l8.5-4.7M12 10.2v9.3"/>',
  B: '<path d="M2.6 5 7.4 19 12.2 5"/><path d="M9.9 5l5.6 15 6-15.5"/>',
  C: '<path d="M4 7.6Q4 5 6.6 5h2.9L12 8.2 14.5 5h2.9Q20 5 20 7.6v10Q20 20 17.4 20H6.6Q4 20 4 17.6Z"/><path d="m8 11.3 1.9 5.2 2.1-3.6 2.1 3.6 1.9-5.2"/>',
  D: '<path d="m7.6 9.4 1.6 5.4 2.8-4.2 2.8 4.2 1.6-5.4"/><path d="M20.4 8C19.3 4.7 15.9 3 12.3 3.2 7.1 3.5 3.3 7.4 3.4 12.4c.2 5.2 4.4 8.6 9.2 8.4 5-.2 8.4-4 8.2-8.8-.1-1.5-.6-2.7-1.4-3.7"/>',
  E: '<path d="M3.5 15.5V10.5C3.5 6.6 5.8 4 9.6 4H13.5"/><path d="M20.5 7V12.2C20.5 17.6 17.2 20.5 11.2 20.5H7.5"/><circle cx="12" cy="12.2" r="1"/>',
};
// a few real Lucide neighbours (ISC) for the slot comparison
const LUCIDE = {
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  rss: '<path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
};
const glyphSvg = (inner, size = 24, cls = '') => `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

/* ------------------------------------------------------------------ */
/* Lockups                                                             */
/* ------------------------------------------------------------------ */
const LOCK = {
  A: {
    stacked(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 560 170" class="lock">
        <text x="280" y="92" text-anchor="middle" font-family="Literata" font-weight="520" font-size="74" letter-spacing="9" style="font-variation-settings:'opsz' 72" fill="${t.fg}">WOLFSBLVT</text>
        <g transform="translate(221 113) scale(.62)">${SYM.A(dark, { rich: true })}</g>
        <text x="250" y="133" font-family="Albert Sans" font-weight="600" font-size="15" letter-spacing="9.5" fill="${t.soft}">WORKS</text>
      </svg>`;
    },
    horizontal(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 380 44" class="lock-h"><g transform="translate(0 4) scale(1.1)">${SYM.A(dark)}</g>
        <text x="46" y="31" font-family="Literata" font-weight="560" font-size="25" letter-spacing="3.4" style="font-variation-settings:'opsz' 48" fill="${t.fg}">WOLFSBLVT</text>
        <text x="262" y="30" font-family="Albert Sans" font-weight="600" font-size="11.5" letter-spacing="5.2" fill="${t.soft}">WORKS</text></svg>`;
    },
    note: 'Literata 520 caps, opsz 72, tracked +0.12em. Round 2 would draw the caps with sharper, slightly flared inscriptional terminals.',
  },
  B: {
    stacked(dark = true) {
      const t = theme(dark);
      const big = monoWord('WOLFSBLVT', { x: 0, y: 0, scale: 2.6, stroke: 2.3, color: t.fg, split: [t.o, t.m], draw: true });
      const small = monoWord('WORKS', { x: 0, y: 0, scale: 0.62, stroke: 2.4, color: t.soft, track: 11 });
      const sx = (big.width - small.width) / 2;
      return `<svg viewBox="-8 -10 ${big.width + 16} 124" class="lock">${big.svg}<g transform="translate(${sx} 88)">${small.svg}</g></svg>`;
    },
    horizontal(dark = true) {
      const t = theme(dark);
      const big = monoWord('WOLFSBLVT', { scale: 1, stroke: 2.5, color: t.fg, split: [t.o, t.m] });
      const small = monoWord('WORKS', { x: big.width + 16, y: 7, scale: 0.5, stroke: 2.6, color: t.soft, track: 6 });
      return `<svg viewBox="-3 -3 ${big.width + 16 + small.width + 6} 30" class="lock-h">${big.svg}${small.svg}</svg>`;
    },
    note: 'Hand-built monoline caps on a 24-unit cap height — the same stroke grammar as the 24px glyph, scaled up. No font needed; the W is the symbol.',
  },
  C: {
    stacked(dark = true) {
      const t = theme(dark), ink = dark ? C.text : C.ink;
      return `<svg viewBox="0 0 560 210" class="lock">
        <g class="punch"><path d="M150 26Q150 12 164 12H262L280 34L298 12H396Q410 12 410 26V150Q410 164 396 164H164Q150 164 150 150Z" fill="${ink}"/>
        <text x="280" y="88" text-anchor="middle" font-family="Albert Sans" font-weight="800" font-size="56" letter-spacing="6" fill="${t.bg}">WOLFS</text>
        <text x="280" y="146" text-anchor="middle" font-family="Albert Sans" font-weight="800" font-size="56" letter-spacing="6" fill="${t.bg}">BLVT</text></g>
        <text x="280" y="198" text-anchor="middle" font-family="Albert Sans" font-weight="600" font-size="15" letter-spacing="10" fill="${t.soft}">WORKS</text></svg>`;
    },
    horizontal(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 330 40" class="lock-h"><g transform="translate(0 2) scale(1.08)">${SYM.C(dark)}</g>
        <text x="44" y="28" font-family="Albert Sans" font-weight="800" font-size="22" letter-spacing="3" fill="${t.fg}">WOLFSBLVT</text>
        <text x="208" y="27.5" font-family="Albert Sans" font-weight="600" font-size="11" letter-spacing="5" fill="${t.soft}">WORKS</text></svg>`;
    },
    note: 'Albert Sans 800 inside the punch as a stand-in; round 2 would cut custom stamp letters with slightly swollen, impressed corners.',
  },
  D: {
    stacked(dark = true) {
      const t = theme(dark), cid = 'w' + Math.random().toString(36).slice(2, 7);
      return `<svg viewBox="0 0 560 190" class="lock">
        <text x="280" y="100" text-anchor="middle" font-family="Literata" font-weight="800" font-size="80" letter-spacing="1" style="font-variation-settings:'opsz' 72" fill="${t.fg}">WOLFSBLVT</text>
        <clipPath id="${cid}"><rect class="wipe" x="330" y="96" width="170" height="96"/></clipPath>
        <g clip-path="url(#${cid})"><text x="352" y="152" font-family="Shantell Sans" font-weight="500" font-size="42" fill="${t.r}" transform="rotate(-5 400 140)">works</text>
        <path d="M352 164C384 160 420 157 470 152" fill="none" stroke="${t.r}" stroke-width="2.6" stroke-linecap="round" transform="rotate(-5 400 140)"/></g></svg>`;
    },
    horizontal(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 330 46" class="lock-h">
        <text x="0" y="30" font-family="Literata" font-weight="800" font-size="27" letter-spacing=".5" style="font-variation-settings:'opsz' 36" fill="${t.fg}">WOLFSBLVT</text>
        <text x="216" y="37" font-family="Shantell Sans" font-weight="500" font-size="21" fill="${t.r}" transform="rotate(-6 240 30)">works</text></svg>`;
    },
    note: 'Literata 800 caps + Shantell Sans as the stand-in for the scribble. The real “works” should be Wolf’s own handwriting, vectorised.',
  },
  E: {
    stacked(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 560 200" class="lock"><g fill="none" stroke-linecap="round" stroke-width="5">
        <path class="draw" pathLength="1" style="--i:0" d="M62 132V82C62 50 80 32 114 32H178" stroke="${t.o}"/>
        <path class="draw" pathLength="1" style="--i:1" d="M500 62V120C500 160 474 182 424 182H346" stroke="${t.m}"/></g>
        <text x="280" y="112" text-anchor="middle" font-family="Albert Sans" font-weight="700" font-size="58" letter-spacing="9" fill="${t.fg}">WOLFSBLVT</text>
        <text x="280" y="146" text-anchor="middle" font-family="Albert Sans" font-weight="600" font-size="14" letter-spacing="10" fill="${t.soft}">WORKS</text></svg>`;
    },
    horizontal(dark = true) {
      const t = theme(dark);
      return `<svg viewBox="0 0 330 40" class="lock-h"><g transform="translate(0 4) scale(1)">${SYM.E(dark)}</g>
        <text x="42" y="27" font-family="Albert Sans" font-weight="700" font-size="21" letter-spacing="3.4" fill="${t.fg}">WOLFSBLVT</text>
        <text x="206" y="26.5" font-family="Albert Sans" font-weight="600" font-size="11" letter-spacing="5" fill="${t.soft}">WORKS</text></svg>`;
    },
    note: 'Albert Sans 700 tracked caps as stand-in. The two winds are hand-drawn; they never mirror and the right one is always the longer reach.',
  },
};

window.WORKS_MARKS = { C, theme, SYM, GLYPH, LUCIDE, LOCK, glyphSvg, monoWord };
