export function glowTile(size) {
  const s = size;
  const icon = s * 0.62;
  const offset = (s - icon) / 2;
  const k = icon / 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="o" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="scale(${1.2 * s} ${0.9 * s})">
      <stop offset="0" stop-color="#eca557" stop-opacity=".30"/><stop offset=".55" stop-color="#eca557" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="m" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${s} ${s}) scale(${1.2 * s} ${0.9 * s})">
      <stop offset="0" stop-color="#db61aa" stop-opacity=".34"/><stop offset=".55" stop-color="#db61aa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="#140d14"/>
  <rect width="${s}" height="${s}" fill="url(#o)"/>
  <rect width="${s}" height="${s}" fill="url(#m)"/>
  <g transform="translate(${offset} ${offset}) scale(${k})">
    <path d="M4.6 20.5V13A8 8 0 0 1 12.6 5H17.5" fill="none" stroke="#eca557" stroke-width="3" stroke-linecap="round"/>
    <path d="M27.4 8.5V15A12.4 12.4 0 0 1 15 27.4H9.5" fill="none" stroke="#db61aa" stroke-width="3" stroke-linecap="round"/>
    <circle cx="17.15" cy="17.35" r="3.1" fill="#f3e8dc"/>
  </g>
</svg>`;
}

