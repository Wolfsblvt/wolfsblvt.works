// Sponsor-section artwork candidates. Each returns an SVG string (viewBox 640×320) that sits on the
// right of the section and fades under the copy. The copy itself is always real HTML.
(() => {
  const { C, SYM } = window.WORKS_MARKS;

  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const FG = (cls = '') => `<svg class="fg ${cls}" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">`;
  const uid = () => 's' + Math.random().toString(36).slice(2, 8);

  // the mark in the art — swappable from the canvas toolbar
  const markAt = (sym, x, y, s, dark) => `<g class="sp-mark" transform="translate(${x - 16 * s} ${y - 16 * s}) scale(${s})">${SYM[sym](dark, sym === 'A' ? { rich: true } : {})}</g>`;

  // S1 — Lit edge: a slice of the Works light language. Two unequal winds, fields, glow, line.
  function litEdge({ dark = true, sym = 'A', resident = false } = {}) {
    const id = uid();
    const o = dark ? C.orange : C.orangeInk, m = dark ? C.magenta : C.magentaInk;
    const oLine = 'M292 -10C326 58 276 124 312 190C338 240 318 288 334 330';
    const oGlow = 'M300 -10C338 64 284 118 322 186C350 236 324 292 340 330';
    const mLine = 'M476 -10C440 70 506 130 458 202C424 252 470 292 452 330';
    const mGlow = 'M466 -10C432 76 500 126 448 206C416 256 462 290 444 330';
    const fieldO = `M120 -10H292C326 58 276 124 312 190C338 240 318 288 334 330H120Z`;
    const fieldM = `M476 -10C440 70 506 130 458 202C424 252 470 292 452 330H660V-10Z`;
    const a = dark ? 1 : .8;
    return `<svg class="bg" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="${id}o" x1="120" x2="336" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${o}" stop-opacity="0"/><stop offset=".55" stop-color="${o}" stop-opacity="${.2 * a}"/><stop offset="1" stop-color="${o}" stop-opacity="${.08 * a}"/></linearGradient>
        <linearGradient id="${id}m" x1="640" x2="424" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${m}" stop-opacity="${.32 * a}"/><stop offset="1" stop-color="${m}" stop-opacity="${.07 * a}"/></linearGradient>
        <filter id="${id}f" x="-20%" y="-10%" width="140%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>
        <filter id="${id}g" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="13"/></filter>
        <filter id="${id}b" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <g filter="url(#${id}f)"><path d="${fieldO}" fill="url(#${id}o)"/><path d="${fieldM}" fill="url(#${id}m)"/></g>
      <g fill="none" stroke-linecap="round">
        <path d="${oGlow}" stroke="${o}" stroke-width="22" opacity="${.14 * a}" filter="url(#${id}g)"/>
        <path d="${mGlow}" stroke="${m}" stroke-width="24" opacity="${.16 * a}" filter="url(#${id}g)"/>
        <path d="${oLine}" stroke="${o}" stroke-width="8" opacity="${.18 * a}" filter="url(#${id}b)"/>
        <path d="${mLine}" stroke="${m}" stroke-width="8" opacity="${.2 * a}" filter="url(#${id}b)"/>
      </g></svg>${FG('down')}<g class="sp-lines" fill="none" stroke-linecap="round">
        <path d="${oLine}" stroke="${o}" stroke-width="2.6" opacity=".55"/>
        <path d="${mLine}" stroke="${m}" stroke-width="2.6" opacity=".6"/>
      </g>
      ${markAt(sym, 388, 132, 2.3, dark)}
      ${resident ? `<image href="yoru-still-cutout.png" x="352" y="196" width="78" height="88" preserveAspectRatio="xMidYMid meet"/>` : ''}
    </svg>`;
  }

  // S2 — Fireworks: a burst of short strokes over drifting smoke, the mark at its centre.
  function fireworks({ dark = true, sym = 'A' } = {}) {
    const id = uid(), r = rng(7);
    const pal = dark ? [C.orange, C.rose, C.magenta, C.orange, C.magenta, C.rose, C.orange, C.magenta, C.cyan]
                     : [C.orangeInk, C.roseInk, C.magentaInk, C.orangeInk, C.magentaInk, C.roseInk, C.orangeInk, C.magentaInk, '#1f7f9c'];
    const burst = (cx, cy, n, r1, r2, sw, off = 0) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + (r() - .5) * .18 + off;
        const a = r1 + r() * r1 * .4, b = r2 * (.55 + r() * .45);
        const x1 = cx + Math.cos(ang) * a, y1 = cy + Math.sin(ang) * a, x2 = cx + Math.cos(ang) * b, y2 = cy + Math.sin(ang) * b;
        const col = pal[(i * 5 + Math.floor(r() * 3)) % pal.length];
        s += `<path class="ray" d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>`;
        if (r() > .55) { const e = b + 9 + r() * 8; s += `<circle class="spark" style="--d:${(.35 + r() * .3).toFixed(2)}s" cx="${(cx + Math.cos(ang) * e).toFixed(1)}" cy="${(cy + Math.sin(ang) * e).toFixed(1)}" r="${(1.2 + r() * 1.4).toFixed(1)}" fill="${col}"/>`; }
      }
      return s;
    };
    return `<svg class="bg" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs>
        <filter id="${id}s" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".011 .02" numOctaves="2" seed="4"/>
          <feColorMatrix values="0 0 0 0 ${dark ? .86 : .66}  0 0 0 0 ${dark ? .38 : .2}  0 0 0 0 ${dark ? .67 : .48}  0 0 0 1.25 -.48"/>
          <feGaussianBlur stdDeviation="5"/>
        </filter>
        <radialGradient id="${id}h" cx="450" cy="150" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".75" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
        <mask id="${id}k"><rect width="640" height="320" fill="url(#${id}h)"/></mask>
        <radialGradient id="${id}c" cx="452" cy="146" r="90" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? C.orange : C.orangeInk}" stop-opacity=".28"/><stop offset="1" stop-color="${dark ? C.orange : C.orangeInk}" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="640" height="320" filter="url(#${id}s)" mask="url(#${id}k)" opacity="${dark ? .55 : .35}"/>
      <circle cx="452" cy="146" r="90" fill="url(#${id}c)"/>
      </svg>${FG()}<g fill="none" stroke-linecap="round"><g class="burst" style="transform-origin:452px 146px">${burst(452, 146, 38, 34, 128, 2.4)}</g><g class="burst" style="transform-origin:586px 262px;--d:.35s">${burst(586, 262, 18, 10, 46, 1.8, .3)}</g><g class="burst" style="transform-origin:318px 52px;--d:.6s">${burst(318, 52, 12, 6, 26, 1.5, .1)}</g></g>
      ${markAt(sym, 452, 146, 1.55, dark)}
    </svg>`;
  }

  // S3 — Carved field: a lattice of chip-carved Vs, lit orange from upper left and magenta from the right.
  function carved({ dark = true, sym = 'A' } = {}) {
    const side = 40, h = side * Math.sqrt(3) / 2;
    const o = dark ? C.orange : C.orangeInk, m = dark ? C.magenta : C.magentaInk, top = dark ? '#3b1733' : '#e2cfc6';
    const LO = [360, -30], LM = [680, 230];
    let s = '';
    for (let row = -1; row < 9; row++) {
      for (let col = -1; col < 17; col++) {
        const x0 = col * side + (row % 2 ? side / 2 : 0), y0 = row * h;
        const A = [x0, y0], B = [x0 + side, y0], D = [x0 + side / 2, y0 + h];
        const cx = x0 + side / 2, cy = y0 + h / 3;
        if (cx < 170) continue;
        const dO = Math.hypot(cx - LO[0], cy - LO[1]), dM = Math.hypot(cx - LM[0], cy - LM[1]);
        const iO = Math.max(0, 1 - dO / 340) ** 1.8, iM = Math.max(0, 1 - dM / 330) ** 1.6;
        const pad = 2.2; // gap between chips
        const sh = (p) => [cx + (p[0] - cx) * (1 - pad / 14), cy + (p[1] - cy) * (1 - pad / 14)];
        const [a, b, d] = [sh(A), sh(B), sh(D)], c = [cx, cy];
        const P = (...pts) => pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
        const delay = ((640 - cx) / 640 * .9).toFixed(2);
        s += `<g class="chip" style="--d:${delay}s"><polygon points="${P(a, b, c)}" fill="${top}" opacity="${dark ? .4 : .55}"/>
          <polygon points="${P(a, c, d)}" fill="${o}" opacity="${(.04 + iO * .9).toFixed(2)}"/>
          <polygon points="${P(b, d, c)}" fill="${m}" opacity="${(.04 + iM * .9).toFixed(2)}"/></g>`;
      }
    }
    return `<svg class="bg" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">${s}
      ${sym !== 'A' ? `<rect x="${388 - 34}" y="${118 - 34}" width="68" height="68" rx="14" fill="${dark ? C.canvas : C.paper}" opacity=".92"/>${markAt(sym, 388, 118, 1.6, dark)}` : ''}</svg>`;
  }

  // S4 — Big type: the wordmark itself, oversized and cropped, traced in light.
  function bigType({ dark = true, word = 'WOLFSBLVT', family = 'Literata', weight = 800 } = {}) {
    const id = uid();
    const o = dark ? C.orange : C.orangeInk, m = dark ? C.magenta : C.magentaInk, r = dark ? C.rose : C.roseInk;
    return `<svg class="bg" viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
      <defs><linearGradient id="${id}t" x1="80" x2="660" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${o}"/><stop offset=".55" stop-color="${r}"/><stop offset="1" stop-color="${m}"/></linearGradient>
      <filter id="${id}g"><feGaussianBlur stdDeviation="7"/></filter></defs>
      <text x="664" y="238" text-anchor="end" font-family="${family}" font-weight="${weight}" font-size="232" letter-spacing="-4" style="font-variation-settings:'opsz' 72" fill="url(#${id}t)" opacity="${dark ? .07 : .09}">${word}</text>
      <text x="664" y="238" text-anchor="end" font-family="${family}" font-weight="${weight}" font-size="232" letter-spacing="-4" style="font-variation-settings:'opsz' 72" fill="none" stroke="url(#${id}t)" stroke-width="7" opacity=".22" filter="url(#${id}g)">${word}</text>
      </svg>${FG('across')}<text class="bt" x="664" y="238" text-anchor="end" font-family="${family}" font-weight="${weight}" font-size="232" letter-spacing="-4" style="font-variation-settings:'opsz' 72" fill="none" stroke="url(#${id}t)" stroke-width="1.6" opacity=".9">${word}</text>
      <text x="488" y="296" font-family="Shantell Sans" font-weight="500" font-size="30" fill="${r}" transform="rotate(-6 520 290)">works</text>
    </svg>`;
  }

  window.WORKS_SPONSOR = { litEdge, fireworks, carved, bigType };
})();
