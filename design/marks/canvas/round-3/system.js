// Wolfsblvt Works — round 3. Two corners hold the work.
// Selected: Abril Fatface for WOLFSBLVT, the dot slightly off-centre, H2 "written over", SP2 "lit edges",
// one motion everywhere: corners draw, then the name lights up while WORKS is written.
(() => {
  const C = {
    canvas: '#100b11', text: '#f3e8dc', soft: '#d1c0b8',
    orange: '#eca557', rose: '#ef8ea1', magenta: '#db61aa', cyan: '#73cae3',
    paper: '#f6efe6', ink: '#22171c', inkSoft: '#6d5a60', orangeInk: '#b8661f', magentaInk: '#a8327a', roseInk: '#c4506b',
  };
  const T = (dark) => dark
    ? { dark, bg: C.canvas, fg: C.text, soft: C.soft, o: C.orange, m: C.magenta, r: C.rose }
    : { dark, bg: C.paper, fg: C.ink, soft: C.inkSoft, o: C.orangeInk, m: C.magentaInk, r: C.roseInk };
  let n = 0; const uid = (p = 'u') => p + (++n).toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------- the two corners (32-unit icon) ---------------- */
  // Now true circular arcs, so a section's border-radius can match them exactly.
  // Orange: vertical line x=4.6, horizontal line y=5, bend radius 8.
  // Magenta: vertical line x=27.4, horizontal line y=27.4, bend radius 12.4.
  const R_O = 8, R_M = 12.4;
  const ORANGE = `M4.6 20.5V${5 + R_O}A${R_O} ${R_O} 0 0 1 ${4.6 + R_O} 5H17.5`;
  const MAGENTA = `M27.4 8.5V${27.4 - R_M}A${R_M} ${R_M} 0 0 1 ${27.4 - R_M} 27.4H9.5`;
  const SW = 3;
  const DOT = [17.15, 17.35]; // halfway between "held" (16,16.2) and "off-centre" (18.3,18.5)

  const cornerO = (t, s, x, y) => `<g class="c-o" transform="translate(${x - 4.6 * s} ${y - 5 * s}) scale(${s})"><path class="dr" pathLength="1" d="${ORANGE}" fill="none" stroke="${t.o}" stroke-width="${SW}" stroke-linecap="round"/></g>`;
  const cornerM = (t, s, x, y) => `<g class="c-m" transform="translate(${x - 27.4 * s} ${y - 27.4 * s}) scale(${s})"><path class="dr" pathLength="1" style="--i:1" d="${MAGENTA}" fill="none" stroke="${t.m}" stroke-width="${SW}" stroke-linecap="round"/></g>`;
  const frame = (t, s, x0, y0, x1, y1) => cornerO(t, s, x0, y0) + cornerM(t, s, x1, y1);

  const icon = (dark = true, { mono = false, dot = DOT } = {}) => {
    const t = T(dark), tt = mono ? { ...t, o: t.fg, m: t.fg } : t;
    return `${frame(tt, 1, 4.6, 5, 27.4, 27.4)}<circle class="dot" cx="${dot[0]}" cy="${dot[1]}" r="3.1" fill="${t.fg}"/>`;
  };
  const iconSvg = (size, dark = true, opts = {}) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${icon(dark, opts)}</svg>`;
  // 24px glyph for wolfsblvt-icons: same arcs, same slightly off-centre dot
  const GLYPH = '<path d="M3.5 15.5V10a6 6 0 0 1 6-6h4"/><path d="M20.5 7v4.6a8.9 8.9 0 0 1-8.9 8.9H7.5"/><circle cx="12.8" cy="13" r="1"/>';
  const glyphSvg = (inner, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const LUCIDE = {
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
  };

  /* ---------------- WORKS, hand-drawn ---------------- */
  const HAND = [
    'M0.4 -8.6C1.6 3.6 3.6 18 6.6 30.6C9 20.4 11.4 10.6 13.6 3.4C15.6 11.2 18 21 20.6 30C23.2 18.2 26 4.6 28.6 -9.2',
    'M45.6 3.4C42 -0.6 34.6 -0.2 33.4 8.8C32.2 18.6 35.2 30.2 41.4 30.2C47.4 30.2 49.6 21.4 49 12.2C48.6 5.4 45.8 1.2 41.8 1.6',
    'M55.2 30.4C55 20.2 55 9.4 55.6 1C61.2 -0.6 67.4 0.8 67.4 7.4C67.4 13.6 61.4 15.2 56.2 15.2C60.4 19.4 64.4 25.2 68.8 30.6',
    'M75.2 0.6C75 11 75 21 75.6 30.6M88.4 0C84.4 6 80.2 11 76.2 16C80.4 20.2 84.4 25.4 89.2 31',
    'M108.2 4.2C105.2 0 98.2 -0.6 96.6 5C95.4 9.6 100 12 103.2 14C107.4 16.6 109.8 20 108.2 25.2C106.2 31.4 98.2 31.8 94.6 26.6',
  ];
  const UNDERLINE = 'M-2 40C26 37.6 66 36.8 104 34.6C107.6 34.4 110.6 34.6 113.4 35.6';
  const HAND_W = 116, HAND_TOP = -10, HAND_BOT = 42;
  function works(t, { x, y, k, halo = null, sw = 3.3, hw = 5.5, part = 'all' }) {
    const letters = HAND.map((d, i) => `<path class="hw" pathLength="1" style="--i:${i}" d="${d}"/>`).join('');
    const haloG = halo ? `<g class="halo" fill="none" stroke="${halo}" stroke-width="${sw + hw}" stroke-linecap="round" stroke-linejoin="round">${HAND.map(d => `<path d="${d}"/>`).join('')}<path d="${UNDERLINE}"/></g>` : '';
    const ink = `<g fill="none" stroke="${t.r}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${letters}<path class="ul" pathLength="1" d="${UNDERLINE}"/></g>`;
    return `<g class="works" transform="translate(${x + 4 * k} ${y - HAND_TOP * k}) scale(${k}) skewX(-7)">${part !== 'ink' ? haloG : ''}${part !== 'halo' ? ink : ''}</g>`;
  }
  const worksBox = (k) => ({ w: HAND_W * k, h: (HAND_BOT - HAND_TOP) * k });

  /* ---------------- fonts ---------------- */
  const FONTS = [
    { id: 'abr', label: 'Abril Fatface', family: 'Abril Fatface', weight: 400, vs: 'normal', track: 1, cap: .7 },
    { id: 'lit8', label: 'Literata 800', family: 'Literata', weight: 800, vs: "'opsz' 72", track: 0.5, cap: .7 },
    { id: 'dms', label: 'DM Serif Display', family: 'DM Serif Display', weight: 400, vs: 'normal', track: 0, cap: .7 },
  ];
  const fontAttrs = (f, size) => `font-family="${f.family}" font-weight="${f.weight}" font-size="${size}" letter-spacing="${f.track * size / 100}" style="font-variation-settings:${f.vs}"`;
  let meter;
  function measure(f, size, text = 'WOLFSBLVT') {
    if (!meter) { meter = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); meter.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden'); document.body.appendChild(meter); }
    meter.innerHTML = `<text x="0" y="100" ${fontAttrs(f, size)}>${text}</text>`;
    return meter.firstChild.getComputedTextLength() - f.track * size / 100;
  }

  /* ---------------- the name and its light-up ---------------- */
  // Three layers: a dim base; a full-brightness copy revealed by a soft wipe ("lit and stays lit");
  // and a coloured band of light (orange → magenta) riding just ahead of the wipe.
  function name(t, f, size, x, y) {
    const id = uid('nm'), w = measure(f, size), capH = f.cap * size;
    const E = Math.max(w * .32, 70), travel = w + 2 * E, top = y - capH * 1.5, h = capH * 2.1;
    return `<defs>
      <linearGradient id="${id}g" x1="${x}" x2="${x + w}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.o}"/><stop offset="1" stop-color="${t.m}"/></linearGradient>
      <linearGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}e"><stop offset="0" stop-color="#fff"/><stop offset="${1 - E / 2 / (w + 2 * E)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}w" maskUnits="userSpaceOnUse" x="${x - travel - E}" y="${top}" width="${travel * 2 + w + E * 2}" height="${h}"><rect class="wipe" x="${x - E}" y="${top}" width="${w + 2 * E}" height="${h}" fill="url(#${id}e)" style="--travel:${travel}px"/></mask>
      <mask id="${id}k" maskUnits="userSpaceOnUse" x="${x - travel - E}" y="${top}" width="${travel * 2 + w + E * 2}" height="${h}"><rect class="band" x="${x - E}" y="${top}" width="${E}" height="${h}" fill="url(#${id}b)" style="--travel:${travel}px"/></mask>
    </defs>
    <text class="name" x="${x}" y="${y}" ${fontAttrs(f, size)} fill="${t.fg}">WOLFSBLVT</text>
    <text class="name-on" x="${x}" y="${y}" ${fontAttrs(f, size)} fill="${t.fg}" mask="url(#${id}w)">WOLFSBLVT</text>
    <text class="name-lit" x="${x}" y="${y}" ${fontAttrs(f, size)} fill="url(#${id}g)" mask="url(#${id}k)">WOLFSBLVT</text>`;
  }

  /* ---------------- frames ---------------- */
  function hold(t, box, { gx, gy }) {
    const H = ((box.y1 - box.y0) + 2 * gy) / (1 - 3 / 22.4);
    const s = H / 22.4, half = SW * s / 2;
    const x0 = box.x0 - gx - half, y0 = box.y0 - gy - half, x1 = box.x1 + gx + half, y1 = box.y1 + gy + half;
    const m = half + 2;
    return { s, x0, y0, x1, y1, o: cornerO(t, s, x0, y0), m: cornerM(t, s, x1, y1), svg: frame(t, s, x0, y0, x1, y1), bb: [x0 - m, y0 - m, x1 + m, y1 + m] };
  }
  const vbOf = (bb, extra = []) => {
    let [a, b, c, d] = bb; for (const e of extra) { a = Math.min(a, e[0]); b = Math.min(b, e[1]); c = Math.max(c, e[2]); d = Math.max(d, e[3]); }
    return [a, b, c - a, d - b];
  };

  // Layering: the magenta corner sits between WORKS's halo and its ink, so WORKS is written over the
  // corner without erasing it, while the halo still separates the scribble from the name's letters.
  const layer = (t, h, f, size, w) => h.o + name(t, f, size, 0, 0) + works(t, { ...w, halo: t.bg, part: 'halo' }) + h.m + works(t, { ...w, part: 'ink' });

  /* ---------------- lockups ---------------- */
  // H2  — full: WORKS written over the end of the name, lower. (round 2, kept)
  // H2s — header: WORKS bigger and lower, written over the name AND the magenta corner piece.
  // WM3 — WM2 with WORKS pulled up over the magenta corner; still below the name, not as high as H2.
  function lockup(id, dark, f) {
    const t = T(dark), size = 100, w = measure(f, size), capH = f.cap * size, base = 0, capTop = -capH;
    if (id === 'H2') {
      const k = (capH * .5) / 30, wb = worksBox(k), wx = w - wb.w * .8, wy = base - capH * .4;
      const h = hold(t, { x0: 0, y0: capTop, x1: Math.max(w, wx + wb.w * .97), y1: wy + wb.h * .92 }, { gx: capH * .4, gy: capH * .14 });
      const vb = vbOf(h.bb);
      return { vb, ratio: vb[2] / capH, svg: layer(t, h, f, size, { x: wx, y: wy, k }) };
    }
    if (id === 'H2s') {
      const h = hold(t, { x0: 0, y0: capTop, x1: w, y1: base }, { gx: capH * .36, gy: capH * .16 });
      const k = (capH * .66) / 30, wb = worksBox(k);
      const wx = h.x1 - wb.w * .97, wy = base - capH * .3;
      const vb = vbOf(h.bb, [[wx - 4, wy, wx + wb.w + 6, wy + wb.h + 2]]);
      return { vb, ratio: vb[2] / capH, svg: layer(t, h, f, size, { x: wx, y: wy, k, sw: 3.9, hw: 6 }) };
    }
    // WM3
    const h = hold(t, { x0: 0, y0: capTop, x1: w, y1: base }, { gx: capH * .3, gy: capH * .2 });
    const k = (capH * .5) / 30, wb = worksBox(k);
    const wx = h.x1 - wb.w * .94, wy = h.y1 - wb.h * .55;
    const vb = vbOf(h.bb, [[wx - 4, wy, wx + wb.w + 6, wy + wb.h + 2]]);
    return { vb, ratio: vb[2] / capH, svg: layer(t, h, f, size, { x: wx, y: wy, k, sw: 3.5 }) };
  }
  const wrap = (r, cls = 'lock', label = '') => `<svg class="${cls}" viewBox="${r.vb.map(v => v.toFixed(1)).join(' ')}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${r.svg}</svg>`;

  window.V3 = { C, T, uid, R_O, R_M, ORANGE, MAGENTA, SW, DOT, cornerO, cornerM, frame, icon, iconSvg, GLYPH, glyphSvg, LUCIDE, works, worksBox, FONTS, fontAttrs, measure, name, hold, lockup, wrap };
})();
