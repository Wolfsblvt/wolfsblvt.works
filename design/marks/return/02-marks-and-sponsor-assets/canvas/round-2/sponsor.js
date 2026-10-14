// Sponsor section, round 2: Big Type, held by the icon's corners.
(() => {
  const { C, T, uid, fontAttrs, ORANGE, MAGENTA, SW, works, worksBox } = window.V2;
  const VB = 'viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"';
  const X = 664, Y = 240, SIZE = 232; // anchored at the end so the distinctive …BLVT is what shows

  // SP1 — Outline: the name traced in one line of light, orange → rose → magenta across the *visible* letters.
  // SP2 — Lit edges: solid letters lit from the top-left in orange and the bottom-right in magenta — the corners' light.
  function art(variant, dark, f) {
    const t = T(dark), id = uid('bt');
    const txt = (extra) => `<text x="${X}" y="${Y}" text-anchor="end" ${fontAttrs(f, SIZE)} ${extra}>WOLFSBLVT</text>`;
    const grad = `<linearGradient id="${id}g" x1="300" x2="650" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${t.o}"/><stop offset=".5" stop-color="${t.r}"/><stop offset="1" stop-color="${t.m}"/></linearGradient>
      <linearGradient id="${id}h" x1="300" x2="650" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? '#ffd9a6' : t.o}"/><stop offset="1" stop-color="${dark ? '#ffc0e4' : t.m}"/></linearGradient>
      <filter id="${id}b" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>
      <linearGradient id="${id}s"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}c" maskUnits="userSpaceOnUse" x="-400" y="-40" width="1500" height="400"><rect class="band" x="-260" y="0" width="260" height="320" fill="url(#${id}s)" style="--travel:1160px"/></mask>`;
    const sweep = txt(`fill="none" stroke="url(#${id}h)" stroke-width="${variant === 'SP1' ? 3.2 : 2.4}" mask="url(#${id}c)" class="lit-sweep"`);
    if (variant === 'SP1') {
      const bg = `<svg class="bg" ${VB}><defs>${grad}</defs>
        ${txt(`fill="url(#${id}g)" opacity="${dark ? .07 : .1}"`)}
        ${txt(`fill="none" stroke="url(#${id}g)" stroke-width="7" opacity="${dark ? .24 : .16}" filter="url(#${id}b)"`)}</svg>`;
      const fg = `<svg class="fg" ${VB}>${txt(`fill="none" stroke="url(#${id}g)" stroke-width="1.7" opacity=".92"`)}${sweep}</svg>`;
      return bg + fg;
    }
    const face = dark ? '#1c131c' : '#f3e9df';
    const bg = `<svg class="bg" ${VB}><defs>${grad}</defs>
      <g filter="url(#${id}b)" opacity="${dark ? .26 : .22}">${txt(`fill="${t.o}" transform="translate(-6 -6)"`)}${txt(`fill="${t.m}" transform="translate(6 6)"`)}</g></svg>`;
    const fg = `<svg class="fg" ${VB}>
      ${txt(`fill="${t.o}" transform="translate(-2.6 -2.6)" opacity=".95"`)}${txt(`fill="${t.m}" transform="translate(2.6 2.6)" opacity=".95"`)}
      ${txt(`fill="${face}"`)}${sweep}</svg>`;
    return bg + fg;
  }

  // the corners, at icon scale s (64px icon → s=2, 128px icon → s=4), pinned to the section's corners
  const corners = (dark, s) => {
    const t = T(dark), px = 32 * s;
    return `<svg class="sp-c tl" width="${px}" height="${px}" viewBox="0 0 32 32" aria-hidden="true"><g class="c-o"><g class="c-in"><path class="dr" pathLength="1" d="${ORANGE}" fill="none" stroke="${t.o}" stroke-width="${SW}" stroke-linecap="round"/></g></g></svg>
      <svg class="sp-c br" width="${px}" height="${px}" viewBox="0 0 32 32" aria-hidden="true"><g class="c-m"><g class="c-in"><path class="dr" pathLength="1" style="--i:1" d="${MAGENTA}" fill="none" stroke="${t.m}" stroke-width="${SW}" stroke-linecap="round"/></g></g></svg>`;
  };

  // WORKS sits just left of the magenta corner; its underline runs toward the corner's foot.
  const worksNote = (dark, s, halo) => {
    const t = T(dark), k = (s >= 4 ? 25 : 19) / 30, b = worksBox(k);
    const right = 22.5 * s + 10, bottom = 4.6 * s - 4 * k;
    return `<svg class="sp-w" style="right:${right}px;bottom:${bottom}px" width="${b.w + 10}" height="${b.h + 6}" viewBox="-6 -2 ${b.w + 10} ${b.h + 6}" aria-hidden="true">${works(t, { x: 0, y: 0, k, halo })}</svg>`;
  };

  window.V2S = { art, corners, worksNote };
})();
