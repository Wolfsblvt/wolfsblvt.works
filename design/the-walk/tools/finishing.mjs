// The finishing sheet: the last open identity choices side by side (signpost glyph, social cards, app icons and
// favicon, small leftovers). Static comparison artboard; the marks come from the brand return through brand.mjs.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { footerLockup } from './brand.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const YORU_STILL = '/_blob/36919bf9a17f13c1a1c0d3e3e1b780b0';
const lockup = (id, h, extra = '') => footerLockup(id).replace('class="mark-foot"', `class="lk-sh" style="height:${h}px;width:auto;display:block;${extra}"`);

// ---------- signpost candidates: Lucide-like 24 grid, 2px round strokes, currentColor, no transforms ----------
// The pencil feel lives in the geometry itself: slightly bowed lines, small overshoots, nothing perfectly level.
const SIGNS = [
  {
    key: 'A', name: 'Three boards', note: 'Right, left, right. The post shows between the boards, like Lucide’s own signpost; every board sits a little off level.',
    paths: [
      'M5.8 2.7l10.8-.3 2.6 2.2-2.5 2.3-10.8.1c-.3-1.4-.3-2.9-.1-4.3z',
      'M12.1 7.1v1.7',
      'M18.3 8.9l-10.9.2-2.6 2.1 2.7 2.2 10.7-.2c.3-1.4.3-2.9.1-4.3z',
      'M12 13.4v1.6',
      'M12 15.1l4.4-.1 2.2 2.2-2.2 2.2-4.4-.1',
      'M12.1 19.4v2.6',
    ],
  },
  {
    key: 'B', name: 'Leaning, open boards', note: 'The post leans and the boards stay open on their back edge, like flags. The most “found on a walk”.',
    paths: [
      'M12.8 1.9l-.2 1.1',
      'M6.1 3.6l10.5-.9 2.7 2-2.3 2.5-10.4.8',
      'M12.2 8.1l-.2 1.3',
      'M18.1 9.4l-10.6.6-2.5 2.3 2.7 2.1 10.5-.6',
      'M11.6 14.5l-.2 1.3',
      'M11.3 16l4.6-.3 2.2 2-2 2.3-4.6.3',
      'M10.9 20.4l-.2 1.6',
    ],
  },
  {
    key: 'C', name: 'Sketched · chosen', note: 'Edges run a little past their corners, like a quick pencil drawing. Final cut: the two upper boards are narrower and offset from each other, so each one reads on its own.',
    paths: [
      'M6.2 2.8c3.5-.2 7-.3 10.6-.4',
      'M16.4 2.2l2.6 2.4-2.4 2.4',
      'M17 6.8c-3.4.1-6.9.2-10.4.3',
      'M6.9 2.1c-.3 1.8-.2 3.8.2 5.6',
      'M12.1 7.2v1.6',
      'M17.2 9c-3.4.1-6.9.2-10.3.3',
      'M7.3 8.8l-2.6 2.3 2.7 2.3',
      'M6.8 13.5c3.4 0 6.8-.1 10.2-.2',
      'M16.5 8.3c.3 1.9.3 3.8-.1 5.8',
      'M12 13.6v8.4',
      'M12.3 15.3c1.6-.1 3.2-.1 4.8-.1l2 2.1-2 2',
    ],
  },
  {
    key: 'D', name: 'Two boards on the path', note: 'Two bigger boards and the Walk at its foot: the post stands in a small wavy path. Calmest at small sizes.',
    paths: [
      'M5.4 2.9l11.3-.3 2.7 2.5-2.6 2.6-11.3.2c-.4-1.7-.4-3.3-.1-5z',
      'M12.1 7.9v1.8',
      'M18.6 9.8l-11.4.2-2.7 2.5 2.8 2.6 11.2-.2c.4-1.7.4-3.4.1-5.1z',
      'M12 15v4.4',
      'M3.4 21.4c2.5-1.2 5.2-1.1 7.9-.7 3 .4 6.4.6 9.4-.6',
    ],
  },
];
const signSvg = (s, size, color = 'currentColor', sw = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s.paths.map((d) => `<path d="${d}"></path>`).join('')}</svg>`;

const SIGN_CARDS = SIGNS.map((s) => `
<div class="opt">
<div class="opt-k">${s.key}</div>
<div class="sizes">
<div class="sz">${signSvg(s, 48)}<span>48</span></div>
<div class="sz">${signSvg(s, 32)}<span>32</span></div>
<div class="sz">${signSvg(s, 24)}<span>24</span></div>
<div class="sz">${signSvg(s, 20)}<span>20</span></div>
<div class="sz">${signSvg(s, 16)}<span>16</span></div>
</div>
<div class="in-head">${signSvg(s, 30, '#d1c0b8', 1.6)}<span class="nh on">Hi</span><span class="nh">What</span><span class="nh">Why</span><span class="nh">Who</span></div>
<div class="in-light">${signSvg(s, 24, '#22171c')}${signSvg(s, 20, '#22171c')}<span>beside GitHub</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22171c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg></div>
<h3>${s.name}</h3>
<p>${s.note}</p>
</div>`).join('');

// ---------- the Works icon (32 grid) from the return ----------
const ICON = (o = '#eca557', m = '#db61aa', d = '#f3e8dc') =>
  `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4.6 20.5V13A8 8 0 0 1 12.6 5H17.5" fill="none" stroke="${o}" stroke-width="3" stroke-linecap="round"></path><path d="M27.4 8.5V15A12.4 12.4 0 0 1 15 27.4H9.5" fill="none" stroke="${m}" stroke-width="3" stroke-linecap="round"></path><circle cx="17.15" cy="17.35" r="3.1" fill="${d}"></circle></svg>`;
const ICON_LIGHT = () => ICON('#b8661f', '#a8327a', '#22171c');

// a static slice of the Walk for the cards
const WALK_SLICE = `<svg class="og-walk" viewBox="0 0 1200 630" preserveAspectRatio="none" aria-hidden="true"><defs><filter id="ogb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"></feGaussianBlur></filter></defs>
<path d="M-60 -20 L118 -20 C 96 140, 132 300, 104 460 S 122 600, 116 660 L -60 660 Z" fill="#eca557" fill-opacity=".2" filter="url(#ogb)"></path>
<path d="M1260 -20 L1086 -20 C 1110 150, 1070 300, 1098 470 S 1080 600, 1090 660 L 1260 660 Z" fill="#db61aa" fill-opacity=".22" filter="url(#ogb)"></path>
<path d="M112 -20 C 96 140, 132 300, 104 460 S 122 600, 116 660" fill="none" stroke="#eca557" stroke-width="2.4" stroke-opacity=".7"></path>
<path d="M118 -20 C 104 160, 128 290, 110 450 S 128 590, 120 660" fill="none" stroke="#eca557" stroke-width="1" stroke-opacity=".35" stroke-dasharray="160 18 60 30"></path>
<path d="M1092 -20 C 1110 150, 1070 300, 1098 470 S 1080 600, 1090 660" fill="none" stroke="#db61aa" stroke-width="2.4" stroke-opacity=".72"></path>
<path d="M1086 -20 C 1100 170, 1076 310, 1092 460 S 1076 590, 1084 660" fill="none" stroke="#db61aa" stroke-width="1" stroke-opacity=".35" stroke-dasharray="190 14 80 26"></path></svg>`;
const STRIKE = `<svg class="og-strike" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true"><path d="M4 22 C 80 10, 160 30, 240 16 S 360 14, 396 20" fill="none" stroke="#ef8ea1" stroke-width="8" stroke-linecap="round"></path></svg>`;

const OG = [
  {
    key: 'A', name: 'The mark on the Walk', note: 'The full lockup, large, between the two Walk lines, with the hero line underneath. Calm, unmistakably the brand; reads at thumbnail size.',
    html: `<div class="og og-a">${WALK_SLICE}<div class="og-a-in">${lockup('oga-', 150)}<p class="og-line">Oddly useful <span class="og-del">software.${STRIKE}</span> <span class="og-ins">things.</span></p></div></div>`,
  },
  {
    key: 'B', name: 'The hero, with Yoru', note: 'The actual first screen: the sentence and its correction, small lockup, Yoru on his perch. Most personality; the text carries the card.',
    html: `<div class="og og-b">${WALK_SLICE}<div class="og-b-in"><div class="og-b-h">Oddly useful<br><span class="og-del">software.${STRIKE}</span></div><div class="og-b-ins">things. also games.<br>also questions.</div><div class="og-b-foot">${lockup('ogb-', 64)}</div></div><img class="og-yoru" src="${YORU_STILL}" alt=""></div>`,
  },
  {
    key: 'C', name: 'A corner of the pile', note: 'Pieces of the pile spill in from the right, the lockup holds the left. Says "lots of odd things" at a glance; busier at small sizes.',
    html: `<div class="og og-c">${WALK_SLICE}<div class="og-c-l">${lockup('ogc-', 92)}<p class="og-c-t">Software, games, experiments and ideas. Some of them finished.</p></div>
<div class="og-c-pile"><div class="pc pc-note">a game where you only ever plant one tree.</div><div class="pc pc-th">There’s probably a shortcut for that.</div><div class="pc pc-chip"><span>x</span>xkcd tracker</div><div class="pc pc-term">$ rpgm-export ./game<br># read how they made it</div><div class="pc pc-door"></div></div></div>`,
  },
];
const OG_CARDS = OG.map((o) => `
<div class="ogopt">
<div class="opt-k">${o.key}</div>
<div class="og-frame">${o.html}</div>
<div class="og-small"><div class="og-mini">${o.html.replace(/id="ogb"/g, 'id="ogb-s' + o.key + '"').replace(/url\(#ogb\)/g, 'url(#ogb-s' + o.key + ')').replace(/(id|url\(#)(og[abc]-)/g, '$1s$2')}</div><span>in a chat preview, ~400px</span></div>
<h3>${o.name}</h3><p>${o.note}</p>
</div>`).join('');

// ---------- app icons and favicon ----------
const TILES = [
  { key: '1', name: 'Canvas tile', note: 'The icon on the site’s own dark canvas. Plain and exact.', bg: '#100b11' },
  { key: '2', name: 'Walk glow tile', note: 'The same, with the Walk’s orange and magenta glowing in from the corners.', bg: 'radial-gradient(120% 90% at 0% 0%,rgb(236 165 87 / 30%),transparent 55%),radial-gradient(120% 90% at 100% 100%,rgb(219 97 170 / 34%),transparent 55%),#140d14' },
  { key: '3', name: 'Paper tile', note: 'Light paper with the ink colours. Stands out on dark home screens, less like the site.', bg: '#f6efe6', light: true },
];
const TILE_CARDS = TILES.map((t) => `
<div class="tile-opt">
<div class="opt-k">${t.key}</div>
<div class="tiles">
<div class="tile t-ios" style="background:${t.bg}">${t.light ? ICON_LIGHT() : ICON()}</div>
<div class="tile t-round" style="background:${t.bg}">${t.light ? ICON_LIGHT() : ICON()}</div>
<div class="tile t-sm" style="background:${t.bg}">${t.light ? ICON_LIGHT() : ICON()}</div>
</div>
<div class="home"><div class="home-ico" style="background:${t.bg}">${t.light ? ICON_LIGHT() : ICON()}</div><span>Works</span></div>
<h3>${t.name}</h3><p>${t.note}</p>
</div>`).join('');

const FAV = [
  { key: 'a', name: 'Transparent, adapts', note: 'The return’s favicon.svg: no background, dark or light colours by the browser theme.', dark: ICON(), light: ICON_LIGHT() },
  { key: 'b', name: 'On a dark tile', note: 'Always the dark icon on a small rounded canvas tile. Same everywhere, and a crisper shape at 16px.', dark: `<span class="fav-tile">${ICON()}</span>`, light: `<span class="fav-tile">${ICON()}</span>` },
];
const tab = (ico, title, light) => `<div class="tab ${light ? 'tab-l' : ''}"><span class="fav">${ico}</span><span class="tab-t">${title}</span><span class="tab-x">×</span></div>`;
const FAV_CARDS = FAV.map((f) => `
<div class="fav-opt">
<div class="opt-k">${f.key}</div>
<div class="strip strip-d">${tab(f.dark, 'Wolfsblvt Works', false)}${tab('<span class="gh"></span>', 'Wolfsblvt/diffdevil', false)}</div>
<div class="strip strip-l">${tab(f.light, 'Wolfsblvt Works', true)}${tab('<span class="gh gh-l"></span>', 'Wolfsblvt/diffdevil', true)}</div>
<h3>${f.name}</h3><p>${f.note}</p>
</div>`).join('');

const CSS = `
body{margin:0;background:#100b11;color:#f3e8dc;font-family:'Albert Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.sheet{padding:64px 72px 96px;background:linear-gradient(160deg,#100b11 0%,#181018 52%,#0c1217 100%);min-height:100vh;box-sizing:border-box}
.sheet-h{margin:0;font:300 64px/1 'Literata',serif;letter-spacing:-.03em;font-variation-settings:'opsz' 72}
.sheet-sub{margin:16px 0 0;max-width:72ch;font:17px/1.55 'Literata',serif;color:#d1c0b8}
.sec{margin-top:88px}
.sec-h{display:flex;align-items:baseline;gap:16px;margin:0 0 6px;font:400 34px/1.1 'Literata',serif;letter-spacing:-.015em}
.sec-h .n{font:600 13px 'Albert Sans',sans-serif;color:#73cae3;letter-spacing:.08em}
.sec-p{margin:0 0 28px;max-width:80ch;font-size:15px;line-height:1.55;color:#c0b0b1}
.rec{display:inline-flex;align-items:baseline;gap:10px;margin:22px 0 0;font:500 19px/1.3 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-1.5deg)}
.grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:22px}
.opt,.ogopt,.tile-opt,.fav-opt,.mini-opt{position:relative;border:1px solid rgb(243 232 220 / 12%);border-radius:16px;background:rgb(243 232 220 / 3%);padding:22px 22px 20px}
.opt-k{position:absolute;right:16px;top:12px;font:700 13px 'Albert Sans',sans-serif;color:#73cae3;letter-spacing:.08em}
h3{margin:18px 0 6px;font:700 16px 'Albert Sans',sans-serif}
.opt>p,.ogopt>p,.tile-opt>p,.fav-opt>p,.mini-opt>p{margin:0;font-size:14px;line-height:1.5;color:#c0b0b1}
.sizes{display:flex;align-items:flex-end;gap:16px;color:#f3e8dc;min-height:70px}
.sz{display:flex;flex-direction:column;align-items:center;gap:6px}
.sz span{font-size:10.5px;color:#7d6e77}
.in-head{display:flex;align-items:center;gap:14px;margin-top:18px;padding:12px 14px;border-radius:10px;background:#120c13;border:1px solid rgb(243 232 220 / 8%)}
.nh{font-size:13.5px;color:#9c8c93}.nh.on{color:#f3e8dc;font-weight:700}
.in-light{display:flex;align-items:center;gap:12px;margin-top:10px;padding:10px 14px;border-radius:10px;background:#f6efe6;color:#22171c;font-size:12px}
.in-light span{color:#7a6a70}
.og-frame{width:100%;aspect-ratio:1200/630;overflow:hidden;border-radius:10px;position:relative;container-type:inline-size;border:1px solid rgb(243 232 220 / 10%)}
.og{position:absolute;left:0;top:0;width:1200px;height:630px;transform-origin:0 0;transform:scale(calc(100cqw / 1200px));background:linear-gradient(160deg,#100b11 0%,#181018 55%,#0c1217 100%);overflow:hidden;color:#f3e8dc}
.og-walk{position:absolute;inset:0;width:100%;height:100%}
.og-a-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}
.og-line{margin:0;font:300 54px/1 'Literata',serif;letter-spacing:-.02em;color:#d1c0b8}
.og-del{position:relative;display:inline-block}
.og-strike{position:absolute;left:-3%;top:44%;width:106%;height:.3em;overflow:visible}
.og-ins{font:500 50px/1 'Shantell Sans',cursive;color:#ef8ea1;display:inline-block;transform:rotate(-4deg) translateY(-6px)}
.og-b-in{position:absolute;left:170px;top:92px;right:170px;bottom:70px}
.og-b-h{font:300 132px/.92 'Literata',serif;letter-spacing:-.035em;font-variation-settings:'opsz' 72}
.og-b-ins{position:absolute;left:520px;top:250px;white-space:nowrap;font:500 40px/1.12 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-3deg)}
.og-b-foot{position:absolute;left:0;bottom:0}
.og-yoru{position:absolute;right:186px;bottom:56px;width:128px;height:auto}
.og-c-l{position:absolute;left:170px;top:0;bottom:0;width:430px;display:flex;flex-direction:column;justify-content:center;gap:30px}
.og-c-t{margin:0;font:400 30px/1.32 'Literata',serif;color:#d1c0b8}
.og-c-pile{position:absolute;left:640px;top:0;right:0;bottom:0}
.pc{position:absolute;filter:drop-shadow(0 12px 16px rgb(0 0 0 / 45%))}
.pc-note{left:40px;top:70px;width:230px;padding:22px 20px 26px;background:#eadbc8;color:#4a2234;font:500 21px/1.3 'Shantell Sans',cursive;transform:rotate(-5deg);clip-path:polygon(0 0,100% 0,100% 92%,88% 100%,74% 94%,60% 100%,44% 94%,28% 100%,12% 94%,0 100%)}
.pc-th{left:300px;top:118px;width:250px;font:italic 300 32px/1.15 'Literata',serif;transform:rotate(3deg);text-shadow:0 0 14px #100b11}
.pc-chip{left:80px;top:360px;display:flex;flex-direction:column;align-items:center;gap:8px;font:700 19px 'Albert Sans',sans-serif;transform:rotate(-3deg)}
.pc-chip span{width:92px;height:92px;border-radius:24px;background:linear-gradient(160deg,#7cc4d6,#4f93a8);display:grid;place-items:center;font:800 38px 'Albert Sans',sans-serif;color:#100b11}
.pc-term{left:260px;top:330px;width:300px;padding:16px 18px;border-radius:10px;background:#0c1217;border:1px solid rgb(115 202 227 / 25%);font:17px/1.6 'IBM Plex Mono',monospace;color:#c9d4dc;transform:rotate(2.5deg)}
.pc-door{left:470px;top:40px;width:110px;height:170px;border:2px solid rgb(243 232 220 / 40%);border-radius:55px 55px 3px 3px;background:#120c13;transform:rotate(4deg)}
.og-small{display:flex;align-items:center;gap:14px;margin-top:14px}
.og-small>span{font-size:12px;color:#9c8c93}
.og-mini{position:relative;width:200px;aspect-ratio:1200/630;overflow:hidden;border-radius:6px;container-type:inline-size;flex:none}
.tiles{display:flex;align-items:flex-end;gap:16px}
.tile{display:grid;place-items:center}
.tile svg{width:62%;height:62%}
.t-ios{width:120px;height:120px;border-radius:27px}
.t-round{width:96px;height:96px;border-radius:50%}
.t-sm{width:48px;height:48px;border-radius:11px}
.home{display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin-top:18px;padding:18px 22px;border-radius:18px;background:linear-gradient(160deg,#2b3550,#3d2a46);font-size:12px;color:#fff}
.home-ico{width:60px;height:60px;border-radius:14px;display:grid;place-items:center}
.home-ico svg{width:64%;height:64%}
.strip{display:flex;gap:2px;padding:8px 8px 0;border-radius:10px 10px 0 0}
.strip-d{background:#202124}.strip-l{background:#dfe3e8;margin-top:10px}
.tab{display:flex;align-items:center;gap:10px;width:220px;height:34px;padding:0 12px;border-radius:9px 9px 0 0;background:#35363a;font-size:12.5px;color:#e8eaed}
.tab-l{background:#fff;color:#202124}
.tab-t{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tab-x{opacity:.6}
.fav{display:grid;place-items:center;width:16px;height:16px}
.fav svg{width:16px;height:16px}
.fav-tile{display:grid;place-items:center;width:16px;height:16px;border-radius:4px;background:#100b11}
.fav-tile svg{width:13px;height:13px}
.gh{width:14px;height:14px;border-radius:50%;background:#e8eaed}.gh-l{background:#202124}
.mini-opt h3{margin-top:0}
.chips{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 14px}
.chip{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid rgb(243 232 220 / 16%);font-size:13px}
.sw{width:14px;height:14px;border-radius:4px;border:1px solid rgb(243 232 220 / 25%)}
.mini-opt .rec{font-size:16px;margin-top:12px}
`;

const BODY = `
<div class="sheet">
<h1 class="sheet-h">Finishing touches</h1>
<p class="sheet-sub">The last identity choices before the site gets built, side by side. Each has my recommendation underneath. Pick by letter; anything not picked stays as recommended.</p>

<section class="sec">
<h2 class="sec-h"><span class="n">01</span>The signpost</h2>
<p class="sec-p">Our own glyph for <code>@wolfsblvt/icons</code>, replacing my provisional sketch in the header. Lucide grid and weight (24 units, 2px round strokes, currentColor, no transforms or filters, as the icon standard asks). The pencil feel is in the geometry: slightly bowed lines, boards a little off level.</p>
<div class="grid4">${SIGN_CARDS}</div>
<div class="rec">chosen: C, with narrower, offset upper boards. it goes into @wolfsblvt/icons as wolfsblvt/signpost.</div>
</section>

<section class="sec">
<h2 class="sec-h"><span class="n">02</span>Social preview</h2>
<p class="sec-p">The 1200×630 card for links to wolfsblvt.works. Ordinary pages reuse the chosen layout with their own title (Contact gets “Arriving with a thought”); legal pages get none, as the legal standard asks.</p>
<div class="grid3">${OG_CARDS}</div>
<div class="rec">my pick: B for the home page (it’s the site’s own first impression), A as the template for every other page.</div>
</section>

<section class="sec">
<h2 class="sec-h"><span class="n">03</span>App icons</h2>
<p class="sec-p">Apple touch icon, the maskable PWA icon and Android home screens need an opaque tile behind the two corners. Shown as iOS square, maskable circle and small.</p>
<div class="grid3">${TILE_CARDS}</div>
<div class="rec">my pick: 2. the glow makes it ours without adding anything to the mark.</div>
</section>

<section class="sec">
<h2 class="sec-h"><span class="n">04</span>Favicon</h2>
<p class="sec-p">In a dark and a light browser tab, next to a neighbouring tab.</p>
<div class="grid2">${FAV_CARDS}</div>
<div class="rec">my pick: a. it’s the return’s favicon as designed; b only if the light-tab dot looks too thin in real use.</div>
</section>

<section class="sec">
<h2 class="sec-h"><span class="n">05</span>Small leftovers</h2>
<div class="grid3">
<div class="mini-opt"><h3>Browser theme colour</h3><p>The colour mobile browsers paint their bar with.</p><div class="chips"><span class="chip"><span class="sw" style="background:#100b11"></span>#100b11 canvas</span><span class="chip"><span class="sw" style="background:#181018"></span>#181018 header</span></div><div class="rec">canvas. it matches the top of every page.</div></div>
<div class="mini-opt"><h3>When the mark plays</h3><p>The header lockup’s draw-in on the home page. “Once per visit” needs browser storage, which would need a line in Privacy and data.</p><div class="chips"><span class="chip">every home-page load</span><span class="chip">once per visit</span></div><div class="rec">every home load. it’s 2.5 seconds and nothing is stored.</div></div>
<div class="mini-opt"><h3>Fonts to self-host</h3><p>Literata, Shantell Sans, Albert Sans, IBM Plex Sans and Mono, Special Elite. Abril Fatface is outlined inside the marks, so it doesn’t ship.</p><div class="chips"><span class="chip">Latin subset</span><span class="chip">Latin + Latin Extended</span></div><div class="rec">Latin + Extended. names, German, and the odd ł.</div></div>
</div>
</section>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="dark">
<meta name="darkreader-lock">
<title>Finishing touches · Wolfsblvt Works</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,300..800;1,7..72,300..800&family=Shantell+Sans:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;500&family=Albert+Sans:wght@400..800&family=Special+Elite&display=swap" rel="stylesheet">
<style>${CSS}</style>
</helmet>
${BODY}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":3300}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body>
</html>
`;
writeFileSync(join(ROOT, 'project', 'Finishing.dc.html'), html);
console.log('wrote Finishing.dc.html', html.length);
