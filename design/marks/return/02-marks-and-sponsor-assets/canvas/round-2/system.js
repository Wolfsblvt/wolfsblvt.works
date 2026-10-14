// Wolfsblvt Works — round 2 system. One direction: E's two corners hold the work.
// The icon holds a dot, the lockups hold the name, the sponsor section holds the invitation.
(() => {
  const C = {
    canvas: '#100b11', surface: '#181219', text: '#f3e8dc', soft: '#d1c0b8', muted: '#c0b0b1',
    orange: '#eca557', rose: '#ef8ea1', magenta: '#db61aa', cyan: '#73cae3', plum: '#4d1b40',
    paper: '#f6efe6', ink: '#22171c', inkSoft: '#6d5a60', orangeInk: '#b8661f', magentaInk: '#a8327a', roseInk: '#c4506b',
  };
  const T = (dark) => dark
    ? { dark, bg: C.canvas, fg: C.text, soft: C.soft, o: C.orange, m: C.magenta, r: C.rose }
    : { dark, bg: C.paper, fg: C.ink, soft: C.inkSoft, o: C.orangeInk, m: C.magentaInk, r: C.roseInk };
  let n = 0; const uid = (p = 'u') => p + (++n).toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------------- the two corners, exactly as in the 32-unit icon ---------------- */
  // Orange: its vertical line sits at x=4.6, its horizontal line at y=5.
  // Magenta: its vertical line sits at x=27.4, its horizontal line at y=27.4.
  const ORANGE = 'M4.6 20.5V13.2C4.6 8.2 7.6 5 12.6 5H17.5';
  const MAGENTA = 'M27.4 8.5V15.5C27.4 23 22.8 27.4 14.6 27.4H9.5';
  const SW = 3; // stroke in icon units — scales with the corner, as Wolf asked

  const cornerO = (t, s, x, y) => `<g class="c-o" transform="translate(${x - 4.6 * s} ${y - 5 * s}) scale(${s})"><g class="c-in"><path class="dr" pathLength="1" d="${ORANGE}" fill="none" stroke="${t.o}" stroke-width="${SW}" stroke-linecap="round"/></g></g>`;
  const cornerM = (t, s, x, y) => `<g class="c-m" transform="translate(${x - 27.4 * s} ${y - 27.4 * s}) scale(${s})"><g class="c-in"><path class="dr" pathLength="1" style="--i:1" d="${MAGENTA}" fill="none" stroke="${t.m}" stroke-width="${SW}" stroke-linecap="round"/></g></g>`;
  // a frame: orange lines meet at (x0,y0), magenta lines meet at (x1,y1)
  const frame = (t, s, x0, y0, x1, y1) => cornerO(t, s, x0, y0) + cornerM(t, s, x1, y1);

  /* ---------------- icon candidates ---------------- */
  const ICONS = {
    I1: { name: 'Held', dot: [16, 16.2], r: 3.1, glyphDot: [12, 12.2] },
    I2: { name: 'Off-centre', dot: [18.3, 18.5], r: 3.1, glyphDot: [13.6, 13.8] },
  };
  const icon = (id, dark = true, { mono = false } = {}) => {
    const t = T(dark), d = ICONS[id], tt = mono ? { ...t, o: t.fg, m: t.fg } : t;
    return `<g class="ic">${frame(tt, 1, 4.6, 5, 27.4, 27.4)}<g class="dot-w"><circle class="dot" cx="${d.dot[0]}" cy="${d.dot[1]}" r="${d.r}" fill="${t.fg}"/></g></g>`;
  };
  const iconSvg = (id, size, dark = true, opts = {}) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true">${icon(id, dark, opts)}</svg>`;
  const glyph = (id) => `<path d="M3.5 15.5V10.5C3.5 6.6 5.8 4 9.6 4H13.5"/><path d="M20.5 7V12.2C20.5 17.6 17.2 20.5 11.2 20.5H7.5"/><circle cx="${ICONS[id].glyphDot[0]}" cy="${ICONS[id].glyphDot[1]}" r="1"/>`;
  const glyphSvg = (inner, size = 24) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const LUCIDE = {
    globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>',
  };

  /* ---------------- WORKS, hand-drawn, capitals with a bigger W ---------------- */
  // Local units: ORKS cap height 30 (y 0..30), the W stands taller (y -9..31). One stroke per letter.
  const HAND = [
    'M0.4 -8.6C1.6 3.6 3.6 18 6.6 30.6C9 20.4 11.4 10.6 13.6 3.4C15.6 11.2 18 21 20.6 30C23.2 18.2 26 4.6 28.6 -9.2',
    'M45.6 3.4C42 -0.6 34.6 -0.2 33.4 8.8C32.2 18.6 35.2 30.2 41.4 30.2C47.4 30.2 49.6 21.4 49 12.2C48.6 5.4 45.8 1.2 41.8 1.6',
    'M55.2 30.4C55 20.2 55 9.4 55.6 1C61.2 -0.6 67.4 0.8 67.4 7.4C67.4 13.6 61.4 15.2 56.2 15.2C60.4 19.4 64.4 25.2 68.8 30.6',
    'M75.2 0.6C75 11 75 21 75.6 30.6M88.4 0C84.4 6 80.2 11 76.2 16C80.4 20.2 84.4 25.4 89.2 31',
    'M108.2 4.2C105.2 0 98.2 -0.6 96.6 5C95.4 9.6 100 12 103.2 14C107.4 16.6 109.8 20 108.2 25.2C106.2 31.4 98.2 31.8 94.6 26.6',
  ];
  const UNDERLINE = 'M-2 40C26 37.6 66 36.8 104 34.6C107.6 34.4 110.6 34.6 113.4 35.6';
  const HAND_W = 116, HAND_TOP = -10, HAND_BOT = 42; // bounding box in local units (approx, incl. underline)
  // place WORKS so its box (excluding skew) is k-scaled with its top-left at (x,y)
  function works(t, { x, y, k, halo = null, cls = '' }) {
    const sw = 3.3, letters = HAND.map((d, i) => `<path class="hw" pathLength="1" style="--i:${i}" d="${d}"/>`).join('');
    const ul = `<path class="ul" pathLength="1" d="${UNDERLINE}"/>`;
    const haloG = halo ? `<g class="halo" fill="none" stroke="${halo}" stroke-width="${sw + 5.5}" stroke-linecap="round" stroke-linejoin="round">${HAND.map(d => `<path d="${d}"/>`).join('')}<path d="${UNDERLINE}"/></g>` : '';
    return `<g class="works ${cls}" transform="translate(${x + 4 * k} ${y - HAND_TOP * k}) scale(${k}) skewX(-7)">${haloG}<g fill="none" stroke="${t.r}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${letters}${ul}</g></g>`;
  }
  const worksBox = (k) => ({ w: HAND_W * k, h: (HAND_BOT - HAND_TOP) * k });

  /* ---------------- fonts for WOLFSBLVT ---------------- */
  const FONTS = [
    { id: 'lit8', label: 'Literata 800', family: 'Literata', weight: 800, vs: "'opsz' 72", track: 0.5, cap: .7 },
    { id: 'lit6', label: 'Literata 640, tighter', family: 'Literata', weight: 640, vs: "'opsz' 72", track: -1.5, cap: .7 },
    { id: 'fra', label: 'Fraunces 800 soft', family: 'Fraunces', weight: 800, vs: "'opsz' 144, 'SOFT' 60", track: -1, cap: .7 },
    { id: 'pla', label: 'Playfair Display 900', family: 'Playfair Display', weight: 900, vs: 'normal', track: 0, cap: .71 },
    { id: 'glo', label: 'Gloock', family: 'Gloock', weight: 400, vs: 'normal', track: 0, cap: .71 },
    { id: 'abr', label: 'Abril Fatface', family: 'Abril Fatface', weight: 400, vs: 'normal', track: 1, cap: .7 },
    { id: 'dms', label: 'DM Serif Display', family: 'DM Serif Display', weight: 400, vs: 'normal', track: 0, cap: .7 },
  ];
  const fontAttrs = (f, size) => `font-family="${f.family}" font-weight="${f.weight}" font-size="${size}" letter-spacing="${f.track * size / 100}" style="font-variation-settings:${f.vs}"`;

  let meter;
  function measure(f, size, text = 'WOLFSBLVT') {
    if (!meter) { meter = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); meter.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden'); document.body.appendChild(meter); }
    meter.innerHTML = `<text x="0" y="100" ${fontAttrs(f, size)}>${text}</text>`;
    const el = meter.firstChild; const w = el.getComputedTextLength();
    // trailing letter-spacing is counted; remove it
    return w - f.track * size / 100;
  }

  // the name, with an optional light-sweep copy on top (motion B)
  function name(t, f, size, x, y, { sweep = true } = {}) {
    const id = uid('sw'), w = measure(f, size), capH = f.cap * size;
    const grad = `<linearGradient id="${id}g" x1="${x}" x2="${x + w}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.o}"/><stop offset="1" stop-color="${t.m}"/></linearGradient>`;
    const band = Math.max(w * .42, 80);
    return `<defs>${grad}<linearGradient id="${id}s"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}c" maskUnits="userSpaceOnUse" x="${x - band * 2}" y="${y - capH * 1.6}" width="${w + band * 4}" height="${capH * 2.2}"><rect class="band" x="${x - band}" y="${y - capH * 1.4}" width="${band}" height="${capH * 1.8}" fill="url(#${id}s)" style="--travel:${w + band * 2}px"/></mask></defs>
      <text class="name" x="${x}" y="${y}" ${fontAttrs(f, size)} fill="${t.fg}">WOLFSBLVT</text>
      ${sweep ? `<text class="name-lit" x="${x}" y="${y}" ${fontAttrs(f, size)} fill="url(#${id}g)" mask="url(#${id}c)">WOLFSBLVT</text>` : ''}`;
  }

  /* ---------------- frames around content ---------------- */
  // Hold a content box: the corner scale s follows the held height (as in the icon, the corner lines sit
  // 22.4 units apart), and the gap is measured from the stroke's inner edge, so heavier corners never crowd.
  function hold(t, box, { gx, gy }) {
    const H = ((box.y1 - box.y0) + 2 * gy) / (1 - 3 / 22.4);
    const s = H / 22.4, half = SW * s / 2;
    const x0 = box.x0 - gx - half, y0 = box.y0 - gy - half, x1 = box.x1 + gx + half, y1 = box.y1 + gy + half;
    const m = half + 2;
    return { s, svg: frame(t, s, x0, y0, x1, y1), bb: [x0 - m, y0 - m, x1 + m, y1 + m] };
  }
  const vbOf = (bb, extra = []) => {
    let [a, b, c, d] = bb; for (const e of extra) { a = Math.min(a, e[0]); b = Math.min(b, e[1]); c = Math.max(c, e[2]); d = Math.max(d, e[3]); }
    return [a, b, c - a, d - b];
  };

  /* ---------------- stacked lockups ---------------- */
  // WM1 — the frame holds everything: the name and the WORKS note, off-centre right inside the frame.
  // WM2 — the frame holds only the name; WORKS is a margin note written past the magenta corner.
  function stacked(id, dark, f) {
    const t = T(dark), size = 100, w = measure(f, size), capH = f.cap * size, base = 0, capTop = -capH;
    const k = (capH * .42) / 30, wb = worksBox(k);
    if (id === 'WM1') {
      const wx = w - wb.w * .96, wy = base + capH * .14;
      const h = hold(t, { x0: 0, y0: capTop, x1: w, y1: wy + wb.h * .92 }, { gx: capH * .32, gy: capH * .2 });
      return { vb: vbOf(h.bb), svg: h.svg + name(t, f, size, 0, base) + works(t, { x: wx, y: wy, k }) };
    }
    const h = hold(t, { x0: 0, y0: capTop, x1: w, y1: base }, { gx: capH * .3, gy: capH * .2 });
    const k2 = k * 1.08, wb2 = worksBox(k2);
    const wx = h.bb[2] - wb2.w - 2, wy = h.bb[3] + capH * .02;
    return { vb: vbOf(h.bb, [[wx - 6, wy, wx + wb2.w + 6, wy + wb2.h + 4]]), svg: h.svg + name(t, f, size, 0, base) + works(t, { x: wx, y: wy, k: k2, halo: t.bg }) };
  }

  /* ---------------- horizontal lockups ---------------- */
  // H1 — corner · WOLFSBLVT · WORKS a touch lower (subscript) with its line · corner
  // H2 — corner · WOLFSBLVT with WORKS written over its right end, lower · corner. Narrower.
  function horizontal(id, dark, f, { size = 100 } = {}) {
    const t = T(dark), w = measure(f, size), capH = f.cap * size, base = 0, capTop = -capH;
    if (id === 'H1') {
      const k = (capH * .5) / 30, wb = worksBox(k);
      const wx = w + capH * .14, wy = base - capH * .5;
      const h = hold(t, { x0: 0, y0: capTop, x1: wx + wb.w * .97, y1: wy + wb.h * .92 }, { gx: capH * .4, gy: capH * .14 });
      const vb = vbOf(h.bb);
      return { vb, ratio: vb[2] / capH, svg: h.svg + name(t, f, size, 0, base) + works(t, { x: wx, y: wy, k }) };
    }
    const k = (capH * .5) / 30, wb = worksBox(k);
    const wx = w - wb.w * .8, wy = base - capH * .4;
    const h = hold(t, { x0: 0, y0: capTop, x1: Math.max(w, wx + wb.w * .97), y1: wy + wb.h * .92 }, { gx: capH * .4, gy: capH * .14 });
    const vb = vbOf(h.bb);
    return { vb, ratio: vb[2] / capH, svg: h.svg + name(t, f, size, 0, base) + works(t, { x: wx, y: wy, k, halo: t.bg }) };
  }
  const wrap = (r, cls = 'lock') => `<svg class="${cls}" viewBox="${r.vb.map(v => v.toFixed(1)).join(' ')}" aria-hidden="true">${r.svg}</svg>`;

  window.V2 = { hold, C, T, uid, ORANGE, MAGENTA, SW, cornerO, cornerM, frame, ICONS, icon, iconSvg, glyph, glyphSvg, LUCIDE, HAND, works, worksBox, FONTS, fontAttrs, measure, name, stacked, horizontal, wrap };
})();
