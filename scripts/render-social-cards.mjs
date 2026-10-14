// Renders the social preview cards (1200x630) into public/social/ with a local headless Chromium: B (the hero with
// Yoru) for the home page, A (the lockup between the Walk lines with the page's own line) for every other shareable
// page. Legal pages get none. The PNGs are committed deliberate outputs: regenerate with `npm run cards` after
// `npm run assets` when the compositions, marks or pages change. Compositions follow design/the-walk/tools/finishing.mjs.
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public', 'social');
mkdirSync(outDir, { recursive: true });

const marks = join(root, 'design', 'marks', 'return', '02-marks-and-sponsor-assets');
const lockup = (prefix, height, extra = '') =>
  readFileSync(join(marks, 'svg', 'lockup', 'works-lockup-dark.svg'), 'utf8')
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace('<svg xmlns="http://www.w3.org/2000/svg"', `<svg xmlns="http://www.w3.org/2000/svg" style="height:${height}px;width:auto;display:block;${extra}"`)
    .split('wk-full-dark-')
    .join(prefix);
const yoru = `data:image/png;base64,${readFileSync(join(root, 'design', 'the-walk', 'assets', 'yoru-still-cutout.png')).toString('base64')}`;
// A page set from a string can't load file:// fonts, so the self-hosted files travel inline.
const fontCss = readFileSync(join(root, 'src', 'styles', 'fonts.generated.css'), 'utf8').replace(
  /url\('\/fonts\/([^']+)'\)/g,
  (_, file) => `url('data:font/woff2;base64,${readFileSync(join(root, 'public', 'fonts', file)).toString('base64')}')`,
);

const WALK = `<svg class="walk" viewBox="0 0 1200 630" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="ogb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"></feGaussianBlur></filter></defs>
<path d="M-60 -20 L118 -20 C 96 140, 132 300, 104 460 S 122 600, 116 660 L -60 660 Z" fill="#eca557" fill-opacity=".2" filter="url(#ogb)"></path>
<path d="M1260 -20 L1086 -20 C 1110 150, 1070 300, 1098 470 S 1080 600, 1090 660 L 1260 660 Z" fill="#db61aa" fill-opacity=".22" filter="url(#ogb)"></path>
<path d="M112 -20 C 96 140, 132 300, 104 460 S 122 600, 116 660" fill="none" stroke="#eca557" stroke-width="2.4" stroke-opacity=".7"></path>
<path d="M118 -20 C 104 160, 128 290, 110 450 S 128 590, 120 660" fill="none" stroke="#eca557" stroke-width="1" stroke-opacity=".35" stroke-dasharray="160 18 60 30"></path>
<path d="M1092 -20 C 1110 150, 1070 300, 1098 470 S 1080 600, 1090 660" fill="none" stroke="#db61aa" stroke-width="2.4" stroke-opacity=".72"></path>
<path d="M1086 -20 C 1100 170, 1076 310, 1092 460 S 1076 590, 1084 660" fill="none" stroke="#db61aa" stroke-width="1" stroke-opacity=".35" stroke-dasharray="190 14 80 26"></path></svg>`;
const STRIKE = `<svg class="strike" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 22 C 80 10, 160 30, 240 16 S 360 14, 396 20" fill="none" stroke="#ef8ea1" stroke-width="8" stroke-linecap="round"></path></svg>`;

const css = `${fontCss}
*{box-sizing:border-box}html,body{margin:0}
.card{position:relative;width:1200px;height:630px;overflow:hidden;color:#f3e8dc;background:linear-gradient(160deg,#100b11 0%,#181018 55%,#0c1217 100%)}
.walk{position:absolute;inset:0;width:100%;height:100%}
.del{position:relative;display:inline-block}
.strike{position:absolute;left:-3%;top:44%;width:106%;height:.3em;overflow:visible}
.b-in{position:absolute;left:170px;top:92px;right:170px;bottom:70px}
.b-h{font:300 132px/.92 'Literata',serif;letter-spacing:-.035em;font-variation-settings:'opsz' 72}
.b-ins{position:absolute;left:520px;top:250px;white-space:nowrap;font:500 40px/1.12 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-3deg)}
.b-foot{position:absolute;left:0;bottom:0}
.b-yoru{position:absolute;right:186px;bottom:56px;width:128px;height:auto}
.a-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px}
.a-line{margin:0;font:300 58px/1.05 'Literata',serif;letter-spacing:-.02em;color:#d1c0b8;font-variation-settings:'opsz' 60;text-align:center;white-space:nowrap}
`;

const CARDS = [
  {
    file: 'home.png',
    html: `<div class="card">${WALK}<div class="b-in"><div class="b-h">Oddly useful<br><span class="del">software.${STRIKE}</span></div><div class="b-ins">things. also games.<br>also questions.</div><div class="b-foot">${lockup('ogb-', 64)}</div></div><img class="b-yoru" src="${yoru}" alt=""></div>`,
  },
  {
    file: 'contact.png',
    html: `<div class="card">${WALK}<div class="a-in">${lockup('oga-', 150)}<p class="a-line">Arriving with a thought</p></div></div>`,
  },
];

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  for (const card of CARDS) {
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${card.html}</body></html>`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(outDir, card.file), clip: { x: 0, y: 0, width: 1200, height: 630 } });
    console.log(`Social card: public/social/${card.file}`);
  }
} finally {
  await browser.close();
}
