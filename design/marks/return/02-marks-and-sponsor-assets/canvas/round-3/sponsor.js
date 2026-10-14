// Sponsor section, round 3: SP2 "lit edges", held by the icon's corners drawn on the section's own border.
(() => {
  const { T, uid, fontAttrs, ORANGE, MAGENTA, SW, R_O, R_M, works, worksBox } = window.V3;
  const VB = 'viewBox="0 0 640 320" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"';
  const X = 664, Y = 240, SIZE = 232; // anchored at the end so the distinctive …BLVT is what shows

  function art(dark, f) {
    const t = T(dark), id = uid('sp'), E = 240, travel = 640 + 2 * E;
    const txt = (extra) => `<text x="${X}" y="${Y}" text-anchor="end" ${fontAttrs(f, SIZE)} ${extra}>WOLFSBLVT</text>`;
    const face = dark ? '#1c131c' : '#f3e9df';
    const letters = `${txt(`fill="${t.o}" transform="translate(-2.6 -2.6)"`)}${txt(`fill="${t.m}" transform="translate(2.6 2.6)"`)}${txt(`fill="${face}"`)}`;
    const defs = `<defs>
      <linearGradient id="${id}h" x1="300" x2="650" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${dark ? '#ffd9a6' : t.o}"/><stop offset="1" stop-color="${dark ? '#ffc0e4' : t.m}"/></linearGradient>
      <linearGradient id="${id}b"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}e"><stop offset="0" stop-color="#fff"/><stop offset="${1 - E / 2 / (640 + 2 * E)}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="${id}w" maskUnits="userSpaceOnUse" x="${-travel - E}" y="-40" width="${travel * 2 + 640 + 2 * E}" height="400"><rect class="wipe" x="${-E}" y="-40" width="${640 + 2 * E}" height="400" fill="url(#${id}e)" style="--travel:${travel}px"/></mask>
      <mask id="${id}k" maskUnits="userSpaceOnUse" x="${-travel - E}" y="-40" width="${travel * 2 + 640 + 2 * E}" height="400"><rect class="band" x="${-E}" y="-40" width="${E}" height="400" fill="url(#${id}b)" style="--travel:${travel}px"/></mask>
      <filter id="${id}f" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="7"/></filter></defs>`;
    const bg = `<svg class="bg" ${VB}><g class="art-glow" filter="url(#${id}f)" opacity="${dark ? .26 : .22}">${txt(`fill="${t.o}" transform="translate(-6 -6)"`)}${txt(`fill="${t.m}" transform="translate(6 6)"`)}</g></svg>`;
    const fg = `<svg class="fg" ${VB}>${defs}<g class="art-base">${letters}</g><g class="art-on" mask="url(#${id}w)">${letters}</g>
      ${txt(`fill="none" stroke="url(#${id}h)" stroke-width="2.6" mask="url(#${id}k)"`)}</svg>`;
    return bg + fg;
  }

  // Corners drawn ON the section's border: the orange corner's lines lie on the top and left edges,
  // the magenta corner's on the bottom and right edges. The section's radii at those two corners
  // are the corners' own bend radii, so border and stroke are the same curve.
  const radii = (s) => ({ tl: R_O * s, br: R_M * s });
  const corners = (dark, s) => {
    const t = T(dark), px = 32 * s;
    return `<svg class="sp-c tl" style="left:${-4.6 * s}px;top:${-5 * s}px" width="${px}" height="${px}" viewBox="0 0 32 32" aria-hidden="true"><path class="dr" pathLength="1" d="${ORANGE}" fill="none" stroke="${t.o}" stroke-width="${SW}" stroke-linecap="round"/></svg>
      <svg class="sp-c br" style="right:${-(32 - 27.4) * s}px;bottom:${-(32 - 27.4) * s}px" width="${px}" height="${px}" viewBox="0 0 32 32" aria-hidden="true"><path class="dr" pathLength="1" style="--i:1" d="${MAGENTA}" fill="none" stroke="${t.m}" stroke-width="${SW}" stroke-linecap="round"/></svg>`;
  };

  // WORKS: beside the magenta corner on wide sections; written over the corner on narrow ones (CSS container query).
  const worksNote = (dark, s, halo) => {
    const t = T(dark), k = 25 / 30, b = worksBox(k);
    return `<svg class="sp-w" style="--s:${s}" width="${b.w + 12}" height="${b.h + 8}" viewBox="-7 -3 ${b.w + 12} ${b.h + 8}" aria-hidden="true">${works(t, { x: 0, y: 0, k, halo, sw: 3.4, hw: 6.5 })}</svg>`;
  };

  window.V3S = { art, corners, worksNote, radii };
})();
