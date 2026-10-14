// Builds the sub-page artboards (legal pages, error pages) from Main.dc.html's shared chrome.
// The header, footer, icons and base styles are lifted from Main so the rooms never drift from the page.
// Usage: node tools/subpages.mjs   (from design/the-walk)
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { headerLockup, footerLockup, MARK_JS } from './brand.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAIN = readFileSync(join(ROOT, 'project', 'Main.dc.html'), 'utf8');
const SPRITE = '/_blob/a9e26be4b3cd29986bf387744e64c0e8';

function between(src, start, end, { includeEnd = false } = {}) {
  const a = src.indexOf(start); if (a < 0) throw new Error('marker not found: ' + start);
  const b = src.indexOf(end, a + start.length); if (b < 0) throw new Error('end marker not found: ' + end);
  return src.slice(a, includeEnd ? b + end.length : b);
}
function pick(src, re) { const m = re.exec(src); if (!m) throw new Error('pattern not found: ' + re); return m[1] || m[0]; }

// ---------- shared chrome lifted from Main ----------
const CSS_BASE = between(MAIN, 'body{', '/* ---------- hero');
const CSS_SPRITES = between(MAIN, '/* sprites */', '.hero-yoru:hover');
const CSS_BTN = between(MAIN, '.btn{', '/* ---------- the pile');
const CSS_FOOT = between(MAIN, '/* footer */', '@media (prefers-reduced-motion');
const FONTS = pick(MAIN, /(<link rel="preconnect"[^>]*>\s*<link href="https:\/\/fonts[^>]*>)/);
const SIGNPOST = pick(MAIN, /(<svg class="signpost"[\s\S]*?<\/svg>)/);
const PROG = pick(MAIN, /(<svg class="prog" [\s\S]*?<\/svg>)/);
const PROG_M = pick(MAIN, /(<svg class="prog-m"[\s\S]*?<\/svg>)/);
const UTILS = pick(MAIN, /(<div class="utils">[\s\S]*?<\/sc-if>\n<\/div>\n<\/div>)/);
const ICONS = pick(MAIN, /(<div class="icons">[\s\S]*?<\/div>)/);
const MINI_SVG = pick(MAIN, /<div class="mini">\n(<svg[\s\S]*?<\/svg>)/);
const FOOT_ABOUT = pick(MAIN, /(<p style="margin:6px 0 0;max-width:40ch[\s\S]*?<\/p>\n<p[\s\S]*?<\/p>)/);

const CSS_SUB = `
/* ---------- sub-pages ---------- */
.root{min-height:100vh}
.loc{align-self:center;font:13px 'Albert Sans',sans-serif;color:#9c8c93;padding-left:14px;margin-left:2px;border-left:1px solid rgb(243 232 220 / 14%);white-space:nowrap}
@media (max-width:560px){.loc{display:none}}
.foot-col a[aria-current=page]{color:#f3e8dc;position:relative}
.foot-col a[aria-current=page]::before{content:'';position:absolute;left:-12px;top:.55em;width:5px;height:5px;border-radius:50%;background:#73cae3;box-shadow:0 0 8px rgb(115 202 227 / 70%)}
[data-reveal=fade]{opacity:0;transform:translateY(14px);transition:opacity 1s ease,transform 1s ease}
[data-reveal=fade][data-on]{opacity:1;transform:none}
.walk-bg.ends svg{-webkit-mask-image:linear-gradient(180deg,#000 0 46%,rgb(0 0 0 / 35%) 68%,transparent 88%);mask-image:linear-gradient(180deg,#000 0 46%,rgb(0 0 0 / 35%) 68%,transparent 88%)}
/* legal rooms: readable measure, a sticky contents column, fixtures marked while they are still dummies */
.lg{padding:clamp(56px,10vh,110px) 0 0}
.lg-head{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px 40px;align-items:end;padding-bottom:36px;border-bottom:1px solid rgb(243 232 220 / 10%)}
.lg-h{margin:0;font-weight:300;font-size:clamp(46px,6.4vw,92px);line-height:.98;letter-spacing:-.03em;font-variation-settings:'opsz' 72}
.lg-sub{margin:16px 0 0;font:15px 'Albert Sans',sans-serif;color:#9c8c93}
.lg-nap{position:relative;display:flex;align-items:flex-end;gap:2px;margin-right:clamp(0px,4vw,60px)}
.lg-nap .sprite{flex:none}
.lg-nap-line{position:absolute;left:-30px;right:-30px;bottom:6px;border-top:1px solid rgb(243 232 220 / 16%)}
.lg-nap-cap{position:absolute;right:100%;top:-6px;display:flex;align-items:flex-start;gap:2px;white-space:nowrap}
.lg-nap-cap span{font:500 16px/1.25 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-4deg);text-align:right}
@media (max-width:760px){.lg-head{grid-template-columns:1fr}.lg-nap{justify-self:end;margin-top:24px}}
.fx-key{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:5px 11px;border-radius:999px;border:1px dashed rgb(236 165 87 / 45%);font:12.5px 'Albert Sans',sans-serif;color:#eca557}
.fixtures .fx{background:rgb(236 165 87 / 12%);box-shadow:inset 0 -1.5px 0 rgb(236 165 87 / 70%);border-radius:2px;padding:0 2px}
.lg-grid{display:grid;grid-template-columns:minmax(0,1fr) 240px;gap:48px clamp(40px,6vw,96px);align-items:start;padding-top:48px}
@media (max-width:1000px){.lg-grid{grid-template-columns:1fr}.toc{display:none}}
.prose{max-width:68ch;font-size:17.5px;line-height:1.7;color:#d1c0b8}
.prose p{margin:0 0 16px;text-wrap:pretty}
.prose a{color:#f3e8dc;text-decoration-color:rgb(115 202 227 / 55%);text-underline-offset:3px}
.prose a:hover{color:#73cae3}
.prose h2{margin:72px 0 18px;font-weight:400;font-size:clamp(26px,2.3vw,32px);line-height:1.15;letter-spacing:-.015em;color:#f3e8dc;scroll-margin-top:110px;display:flex;align-items:baseline;gap:14px;font-variation-settings:'opsz' 36}
.prose h2 .n{font:600 13px 'Albert Sans',sans-serif;color:#73cae3;letter-spacing:.06em;min-width:20px}
.prose h3{margin:28px 0 10px;font:700 15px 'Albert Sans',sans-serif;color:#f3e8dc}
.prose address{font-style:normal;color:#f3e8dc;line-height:1.6;margin:0 0 16px}
.facts{display:grid;grid-template-columns:minmax(0,190px) minmax(0,1fr);gap:12px 24px;margin:20px 0 22px;padding:18px 0;border-top:1px solid rgb(243 232 220 / 9%);border-bottom:1px solid rgb(243 232 220 / 9%)}
.facts dt{font:600 12px/1.5 'Albert Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#9c8c93;padding-top:4px}
.facts dd{margin:0;font-size:16px;line-height:1.6}
@media (max-width:640px){.facts{grid-template-columns:1fr;gap:4px}.facts dd{margin-bottom:12px}}
.short{position:relative;margin:34px 0 8px;padding:26px 28px 22px;border:1px solid rgb(243 232 220 / 12%);border-radius:14px;background:rgb(243 232 220 / 3%)}
.short-tag{position:absolute;left:22px;top:-15px;padding:0 8px;background:#130e14;font:500 18px/1 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-2deg)}
.short ul{margin:0;padding:0;list-style:none;display:grid;gap:12px}
.short li{position:relative;padding-left:26px;color:#f3e8dc}
.short li::before{content:'';position:absolute;left:2px;top:.62em;width:12px;height:2px;border-radius:2px;background:#eca557}
.toc{position:sticky;top:96px;font-family:'Albert Sans',sans-serif}
.toc-h{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9c8c93;margin:0 0 14px}
.toc ol{list-style:none;margin:0;padding:0 0 0 16px;border-left:1px solid rgb(243 232 220 / 12%);display:grid;gap:2px}
.toc a{position:relative;display:block;padding:5px 0;font-size:14px;color:#9c8c93;text-decoration:none;transition:color .25s}
.toc a:hover{color:#f3e8dc}
.toc a.on{color:#f3e8dc;font-weight:600}
.toc a.on::before{content:'';position:absolute;left:-19.5px;top:50%;width:5px;height:5px;margin-top:-2.5px;border-radius:50%;background:#73cae3;box-shadow:0 0 8px rgb(115 202 227 / 70%)}
.toc-note{margin:22px 0 0;font:500 15px/1.3 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-2deg);max-width:22ch}
/* the provider card borrows a pile note: two tapes, a slightly crooked, torn sheet */
.card{position:relative;margin:30px 0 34px 6px;padding-top:10px;max-width:420px;transform:rotate(-1.4deg);filter:drop-shadow(0 16px 18px rgb(0 0 0 / 45%))}
.card-in{padding:30px 30px 36px;background:#eadbc8;color:#3b2430;font-size:18px;line-height:1.55;clip-path:polygon(0 3%,38% 0,100% 1.5%,99% 52%,100% 93%,91% 99%,80% 95%,68% 100%,55% 95%,43% 100%,30% 95%,18% 99%,8% 94%,1% 98%,.5% 50%)}
.card-in address{color:#3b2430;margin:0}
.card-in .who{font-weight:700}
.card-in .fx{color:#3b2430}
.fixtures .card-in .fx{background:rgb(236 165 87 / 30%);box-shadow:inset 0 -1.5px 0 #c9782a}
.card .tape{position:absolute;top:0;left:7%;width:66px;height:21px;background:rgb(239 142 161 / 62%);transform:rotate(-9deg);z-index:1}
.card .tape.b{left:auto;right:6%;background:rgb(236 165 87 / 58%);transform:rotate(7deg)}
.card.plain{max-width:none;transform:none;filter:none}
.card.plain .tape{display:none}
.card.plain .card-in{background:none;color:#f3e8dc;padding:0;clip-path:none;box-shadow:none}
.card.plain .card-in address{color:#f3e8dc}
.card.plain .card-in .fx{color:inherit}
.aside-scribble{margin:-4px 0 0 18px;font:500 17px/1.3 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-2deg);width:max-content;max-width:100%}
.next{margin-top:72px;padding-top:28px;border-top:1px dashed rgb(243 232 220 / 16%);display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.next-h{width:100%;margin:0 0 6px;font:500 17px/1.3 'Shantell Sans',cursive;color:#ef8ea1}
.lk{display:inline-flex;align-items:center;gap:7px;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgb(243 232 220 / 18%);font:13.5px 'Albert Sans',sans-serif;color:#f3e8dc;text-decoration:none}
.lk:hover{border-color:#73cae3;color:#73cae3}
/* error rooms */
.yoru-btn{appearance:none;background:none;border:0;padding:0;margin:0;cursor:pointer;display:block}
.er{position:relative;min-height:calc(100vh - 62px - 120px);padding:clamp(64px,12vh,140px) 0 40px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:start}
@media (max-width:820px){.er{grid-template-columns:1fr}}
.er-code{margin:0 0 22px}
.er-h{margin:0;font-weight:300;font-size:clamp(54px,8.4vw,128px);line-height:.95;letter-spacing:-.035em;font-variation-settings:'opsz' 72;max-width:12ch}
.er-h-sm{font-size:clamp(46px,6.2vw,96px);max-width:15ch}
.er-path{display:flex;flex-wrap:wrap;align-items:flex-end;gap:6px 22px;margin:34px 0 0}
.er-url{position:relative;display:inline-block;font:500 clamp(16px,1.5vw,20px) 'IBM Plex Mono',monospace;color:#d1c0b8;padding:2px 0}
.er-url .strike{position:absolute;left:-3%;top:44%;width:106%;height:.7em;overflow:visible}
.er-url .strike path{fill:none;stroke-linecap:round;stroke:#ef8ea1;stroke-width:4;stroke-dasharray:430;stroke-dashoffset:430;animation:dash .8s cubic-bezier(.3,.7,.2,1) .9s forwards}
.er-ins{font:500 clamp(18px,1.8vw,24px)/1.15 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-3deg) translateY(-.2em);clip-path:inset(0 100% -10px 0);animation:write 1.1s cubic-bezier(.2,.7,.2,1) 1.6s forwards}
@keyframes write{to{clip-path:inset(0 -4% -10px 0)}}
@keyframes dash{to{stroke-dashoffset:0}}
@keyframes fadein{to{opacity:1}}
.er-lead{margin:30px 0 0;max-width:44ch;font-size:clamp(19px,1.6vw,23px);line-height:1.5;color:#d1c0b8;opacity:0;animation:fadein 1s ease 2.2s forwards;text-wrap:pretty}
.er-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:34px;opacity:0;animation:fadein .9s ease 2.6s forwards}
.er-quiet{font:14.5px 'Albert Sans',sans-serif;color:#d1c0b8;margin-left:6px}
.er-quiet:hover{color:#73cae3}
.er-yoru{position:relative;align-self:end;margin:0 clamp(0px,5vw,80px) 30px 0;display:flex;flex-direction:column;align-items:center}
@media (max-width:820px){.er-yoru{justify-self:end;margin-right:24px}}
.er-yoru .yoru-btn{transition:transform 1.6s linear}
.er-yoru .yoru-btn.out{transform:translateX(70vw)}
.er-yoru .yoru-btn.away{transform:translateX(70vw);transition:none;visibility:hidden}
.er-ground{width:150px;border-top:1px solid rgb(243 232 220 / 16%)}
.er-cap{position:absolute;right:calc(100% - 20px);bottom:58px;display:flex;align-items:flex-end;gap:2px;opacity:0;animation:fadein .6s ease 3.1s forwards}
@media (max-width:640px){.er-cap{right:-10px;bottom:118px;flex-direction:row-reverse}.er-cap svg{transform:scaleX(-1)}}
.er-cap span{font:500 16px/1.25 'Shantell Sans',cursive;color:#ef8ea1;white-space:nowrap;transform:rotate(-4deg)}
.er-mini{display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;padding:28px 0 34px;border-top:1px solid rgb(243 232 220 / 10%);font:13.5px 'Albert Sans',sans-serif;color:#9c8c93}
.er-mini a{color:#d1c0b8;text-decoration:none}.er-mini a:hover{color:#73cae3}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}[data-reveal]{opacity:1!important;transform:none!important}.er-url .strike path{stroke-dashoffset:0!important}.er-ins{clip-path:none!important}.er-lead,.er-acts,.er-cap{opacity:1!important}}
`;

// ---------- shared markup ----------
const WALK = `
<div class="walk-bg {{walk.readyCls}} {{walk.endsCls}}" aria-hidden="true" style="height:{{walk.h}}px">
<svg width="100%" height="{{walk.h}}" viewBox="{{walk.vb}}" preserveAspectRatio="none" style="display:block">
<defs>
<filter id="wFill" filterUnits="userSpaceOnUse" x="-400" y="-800" width="{{walk.fW}}" height="{{walk.fH}}"><feGaussianBlur stdDeviation="{{walk.fillBlur}}"></feGaussianBlur></filter>
<filter id="wPool" filterUnits="userSpaceOnUse" x="-400" y="-800" width="{{walk.fW}}" height="{{walk.fH}}"><feGaussianBlur stdDeviation="26"></feGaussianBlur></filter>
<filter id="wGlow" filterUnits="userSpaceOnUse" x="-400" y="-800" width="{{walk.fW}}" height="{{walk.fH}}"><feGaussianBlur stdDeviation="11"></feGaussianBlur></filter>
<filter id="wNear" filterUnits="userSpaceOnUse" x="-400" y="-800" width="{{walk.fW}}" height="{{walk.fH}}"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter>
</defs>
<path d="{{walk.fillL}}" fill="#eca557" fill-opacity="{{walk.fillOp}}" filter="url(#wFill)"></path>
<path d="{{walk.fillR}}" fill="#db61aa" fill-opacity="{{walk.fillOpR}}" filter="url(#wFill)"></path>
<path d="{{walk.edgeL}}" fill="none" stroke="#eca557" stroke-width="64" stroke-opacity=".09" filter="url(#wPool)"></path><path d="{{walk.edgeR}}" fill="none" stroke="#db61aa" stroke-width="72" stroke-opacity=".1" filter="url(#wPool)"></path>
<path d="{{walk.glowL}}" fill="none" stroke="#eca557" stroke-width="16" stroke-opacity=".15" filter="url(#wGlow)"></path>
<path d="{{walk.glowR}}" fill="none" stroke="#db61aa" stroke-width="18" stroke-opacity=".16" filter="url(#wGlow)"></path>
<path d="{{walk.lineL}}" fill="none" stroke="#eca557" stroke-width="7" stroke-opacity=".18" filter="url(#wNear)"></path>
<path d="{{walk.lineR}}" fill="none" stroke="#db61aa" stroke-width="7" stroke-opacity=".2" filter="url(#wNear)"></path>
<path d="{{walk.lineL}}" fill="none" stroke="#eca557" stroke-width="2.2" stroke-opacity=".62"></path>
<path d="{{walk.lineR}}" fill="none" stroke="#db61aa" stroke-width="2.3" stroke-opacity=".64"></path>
<path d="{{walk.strL1}}" fill="none" stroke="#eca557" stroke-width=".9" stroke-opacity=".4" stroke-dasharray="190 16 60 28 300 10 90 34"></path><path d="{{walk.strL2}}" fill="none" stroke="#eca557" stroke-width=".7" stroke-opacity=".28" stroke-dasharray="70 40 240 18 120 52"></path><path d="{{walk.strR1}}" fill="none" stroke="#db61aa" stroke-width="1" stroke-opacity=".42" stroke-dasharray="210 14 80 30 260 12 70 40"></path><path d="{{walk.strR2}}" fill="none" stroke="#db61aa" stroke-width=".7" stroke-opacity=".3" stroke-dasharray="90 36 200 24 150 46"></path>
</svg>
</div>`;

const HEADER_FULL = `
<header class="site-head" style="{{headStyle}}">
<div class="frame hdr">
<a href="/" data-route="/" class="brand brand-mark" aria-label="Wolfsblvt Works, home">${headerLockup()}</a>
<sc-if value="{{hasLoc}}" hint-placeholder-val="{{ true }}"><span class="loc">{{loc}}</span></sc-if>
<div class="hdr-right">
<div class="navwrap">
${SIGNPOST}
<nav aria-label="Along the walk" class="nav-full">
<sc-for list="{{nav}}" as="n" hint-placeholder-count="7">
<div class="nav-i" data-nav="{{n.id}}">
<a href="{{n.href}}" data-route="{{n.href}}" onMouseEnter="{{n.enter}}" onMouseLeave="{{n.leave}}" onFocus="{{n.enter}}" onBlur="{{n.leave}}" class="nav-a {{n.cls}}" aria-label="{{n.aria}}"><span class="{{n.wordCls}}">{{n.word}}</span></a>
<sc-if value="{{n.isHello}}" hint-placeholder-val="{{ false }}"><span class="nav-x" aria-hidden="true">Contact</span></sc-if>
<sc-if value="{{n.showDots}}" hint-placeholder-val="{{ false }}"><span class="nav-x nav-dots {{n.dotsCls}}" aria-hidden="true">...</span></sc-if>
<sc-if value="{{n.showName}}" hint-placeholder-val="{{ false }}"><span class="nav-x {{n.nameCls}}" aria-hidden="true">{{n.plain}}</span></sc-if>
</div>
</sc-for>
${PROG}
</nav>
</div>
<div class="nav-menu">
<button class="menu-btn" aria-expanded="{{menuOpen}}" aria-controls="menu-panel" onClick="{{toggleMenu}}" onKeyDown="{{escClose}}">Menu<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg></button>
<sc-if value="{{menuOpen}}" hint-placeholder-val="{{ false }}">
<div id="menu-panel" class="panel panel-start" onKeyDown="{{escClose}}">
<sc-for list="{{nav}}" as="n" hint-placeholder-count="7"><a class="prow" href="{{n.href}}" data-route="{{n.href}}"><span><span class="prow-t" style="font-weight:600">{{n.word}}</span><span class="prow-s">{{n.plain}}</span></span></a></sc-for>
</div>
</sc-if>
</div>
<span class="divider" aria-hidden="true"></span>
${UTILS}
</div>
</div>
${PROG_M}
</header>`;

// the server-error room keeps only the wordmark: the rest of the site may be what is broken
const HEADER_BARE = `
<header class="site-head" style="{{headStyle}}">
<div class="frame hdr">
<a href="/" data-route="/" class="brand brand-mark" aria-label="Wolfsblvt Works, home">${headerLockup()}</a>
</div>
</header>`;

const FOOTER_FULL = `
<footer class="lift" style="margin-top:clamp(90px,12vh,130px)">
<div class="frame" style="position:relative;border-top:1px solid rgb(243 232 220 / 12%)">
<div class="foot">
<div class="foot-col" style="min-width:0">
<a href="/" data-route="/" class="brand-foot" aria-label="Wolfsblvt Works, home">${footerLockup()}</a>
${FOOT_ABOUT}
${ICONS}
</div>
<nav class="foot-col" aria-label="The walk, in plain names">
<div class="foot-h" style="padding-left:34px">The walk</div>
<div class="mini">
${MINI_SVG}
<sc-for list="{{nav}}" as="n" hint-placeholder-count="7"><a href="{{n.href}}" data-route="{{n.href}}"><span class="fw">{{n.word}}</span><span class="fp">{{n.plain}}</span></a></sc-for>
</div>
</nav>
<nav class="foot-col" aria-label="Legal">
<div class="foot-h">Site</div>
<a href="https://contact.wolfsblvt.works" data-route="contact.wolfsblvt.works" aria-current="{{curContact}}">Contact</a>
<a href="/privacy/" data-route="/privacy/" aria-current="{{curPrivacy}}">Privacy and data</a>
<a href="/impressum/" data-route="/impressum/" aria-current="{{curImpressum}}">Impressum</a>
</nav>
</div>
</div>
</footer>`;

const TOAST = `<div class="toast {{toastCls}}" role="status" aria-live="polite">{{toast}}</div>`;

// ---------- page bodies ----------
const NAP = (cap) => `
<div class="lg-nap" aria-hidden="true">
<div class="lg-nap-cap"><span>${cap}</span><svg width="34" height="30" viewBox="0 0 34 30" fill="none" stroke="#ef8ea1" stroke-width="1.6" stroke-linecap="round"><path d="M3 6c9 1 18 6 26 17"></path><path d="M22 22l7 1.5-1-7"></path></svg></div>
<div class="sprite s-doze"></div>
<div class="lg-nap-line"></div>
</div>`;

const FX_KEY = `<sc-if value="{{fixtures}}" hint-placeholder-val="{{ true }}"><span class="fx-key ui">Highlighted bits are dummy fixtures. The real values come from the private build.</span></sc-if>`;

const TOC = `
<nav class="toc" aria-label="On this page">
<p class="toc-h">On this page</p>
<ol><sc-for list="{{toc}}" as="t" hint-placeholder-count="7"><li><a href="{{t.href}}" onClick="{{t.go}}" class="{{t.cls}}">{{t.title}}</a></li></sc-for></ol>
<p class="toc-note">nothing here is meant to be clever. just true.</p>
</nav>`;

const PRIVACY_BODY = `
<main class="frame lift lg {{fxCls}}" id="top">
<div class="lg-head">
<div>
<h1 class="lg-h">Privacy and data</h1>
<p class="lg-sub">Last updated <span class="fx">14 October 2026</span> · applies to wolfsblvt.works</p>
${FX_KEY}
</div>
${NAP('the boring part.<br>Yoru already fell asleep.')}
</div>
<div class="lg-grid">
<article class="prose">
<p>This page explains what happens to your data when you visit wolfsblvt.works, and how to reach me about it. It’s written to be read, not skimmed past.</p>
<div class="short">
<span class="short-tag">the short version</span>
<ul>
<li>No analytics, no advertising, no tracking across sites.</li>
<li>To deliver a page, the hosting provider has to handle your request, which includes your IP address.</li>
<li>Fonts, scripts and images come from this site itself. The contact form’s bot check is the one exception.</li>
<li>If you write to me, I use what you send to answer you, and nothing else.</li>
<li>Your pile is shuffled a little by your browser’s name and language. Nothing about it is stored.</li>
</ul>
</div>

<h2 id="controller"><span class="n">01</span>Who is responsible</h2>
<p>The controller for this website is <span class="fx">Max Mustermann</span>. The postal address is in the <a href="/impressum/" data-route="/impressum/">Impressum</a>.</p>
<p>Privacy contact: <a href="mailto:legal@wolfsblvt.works">legal@wolfsblvt.works</a>. You can also use the <a href="https://contact.wolfsblvt.works" data-route="contact.wolfsblvt.works">contact form</a> and pick “Privacy”.</p>
<p>Wolfsblvt Works is the name I make and publish things under. It isn’t a company.</p>

<h2 id="hosting"><span class="n">02</span>Hosting and delivery</h2>
<p>wolfsblvt.works is a static website served through <span class="fx">Cloudflare, Inc.</span> When you open a page, your browser sends a request, and the provider processes it to deliver the page and to keep the service safe from abuse.</p>
<dl class="facts">
<dt>Data</dt><dd>IP address, the address you requested, date and time, browser and system details (user agent), and the referring page, if your browser sends one.</dd>
<dt>Purpose and basis</dt><dd>Delivering the website reliably and securely, Article 6(1)(f) GDPR. The legitimate interest is a working, protected website.</dd>
<dt>Recipient</dt><dd>The hosting provider, acting as a processor.</dd>
<dt>Retention</dt><dd><span class="fx">Request logs are kept by the provider for up to 7 days</span>, longer only when needed to investigate a specific attack.</dd>
<dt>Do you have to?</dt><dd>Without this data, a page can’t be delivered to you.</dd>
</dl>
<h3>Outside the EU</h3>
<p>The provider may process this data in the United States. <span class="fx">The transfer relies on the EU–US Data Privacy Framework and the provider’s standard contractual clauses</span>, which you can request through the privacy contact above.</p>

<h2 id="storage"><span class="n">03</span>Your browser and this site</h2>
<p>This site doesn’t set cookies or store anything in your browser for its own purposes. Where you are in the Pile lives in the page address (the part after the <code>#</code>), which your browser keeps and never sends to the server.</p>
<p>Today’s pile is worked out in your browser from the date. Nothing about what you looked at leaves your device.</p>
<h3>Why your pile might look different</h3>
<p>Today’s pile is shuffled a little per browser, so not everyone sees exactly the same one. The shuffle mixes in your browser’s name, version and language, which your browser sends with every request anyway. That mix is used once, to deal the pile, and isn’t stored, logged or sent anywhere else. Anyone with the same browser and language gets the same pile. It’s just for fun.</p>
<p><span class="fx">The hosting provider’s security layer may set a short-lived cookie to tell people from bots. It’s strictly necessary to keep the site reachable (§ 25(2) TDDDG) and isn’t used to identify you.</span></p>

<h2 id="contact"><span class="n">04</span>When you write to me</h2>
<p>You can reach me by email, through the contact form, or on Discord. When you do, I process what you send so I can answer.</p>
<dl class="facts">
<dt>Data</dt><dd>Your message, your email address or handle, and anything else you choose to include.</dd>
<dt>Purpose and basis</dt><dd>Answering you, Article 6(1)(f) GDPR. If it’s about an agreement between us, Article 6(1)(b).</dd>
<dt>Retention</dt><dd>As long as it’s useful for our conversation and whatever follows from it. I archive mail rather than deleting it on a schedule. If you want yours deleted, tell me, and it will be, unless a legal duty requires keeping it.</dd>
<dt>Do you have to?</dt><dd>No. I just can’t answer without a way to reach you.</dd>
</dl>
<h3>The contact form</h3>
<p>The form sends what you enter (topic, optional project, optional name, email, subject and message) to my inbox as one email, and a plain-text copy to the address you gave. There’s no database behind it: the message only exists as those two emails.</p>
<p>To keep bots out, the form uses <span class="fx">Cloudflare Turnstile</span>, which checks technical signals from your browser and connection, not what you wrote. The service records technical events about each attempt, like the time and the outcome, without your name, email, subject or message. <span class="fx">Those records are kept for up to 30 days.</span></p>
<p>If you message me on Discord, Discord’s own privacy policy covers what you send there.</p>

<h2 id="links"><span class="n">05</span>Links to other places</h2>
<p>Links to GitHub, Discord, Bluesky or wolfsblvt.com are plain links. Nothing from those services loads on this site, and nothing is sent to them until you click.</p>

<h2 id="rights"><span class="n">06</span>Your rights</h2>
<p>Subject to the legal conditions, you have the right to access your data, to have it corrected or deleted, to restrict its processing, and to data portability. Write to <a href="mailto:legal@wolfsblvt.works">legal@wolfsblvt.works</a>.</p>
<p>You can also complain to a data protection supervisory authority, in particular in the EU country where you live, work, or where you think something went wrong. You don’t have to ask me first.</p>

<h2 id="object"><span class="n">07</span>Your right to object</h2>
<p>Where processing is based on Article 6(1)(f) GDPR, you can object to it for reasons that come from your particular situation. I then stop, unless I can show compelling legitimate grounds that override your interests, rights and freedoms, or I need the data to establish, exercise or defend legal claims. Write to <a href="mailto:legal@wolfsblvt.works">legal@wolfsblvt.works</a>.</p>

<h2 id="mine"><span class="n">08</span>My rights</h2>
<p>To not provide you this site in anything but dark mode.</p>
<p class="aside-scribble">this one isn’t legally binding. just firmly held.</p>

<h2 id="changes"><span class="n">09</span>When this changes</h2>
<p>If what this site does with data changes, this page changes first, and the date at the top moves with it.</p>

<div class="next">
<p class="next-h">done with the boring part?</p>
<a class="lk" href="/" data-route="/">Back to the walk</a>
<a class="lk" href="/impressum/" data-route="/impressum/">Impressum</a>
<a class="lk" href="https://contact.wolfsblvt.works" data-route="contact.wolfsblvt.works">Ask me something</a>
</div>
</article>
${TOC}
</div>
</main>`;

const IMPRESSUM_BODY = `
<main class="frame lift lg {{fxCls}}" id="top">
<div class="lg-head">
<div>
<h1 class="lg-h">Impressum</h1>
<p class="lg-sub">Information pursuant to § 5 DDG</p>
${FX_KEY}
</div>
${NAP('yes, a real person<br>is behind this.')}
</div>
<div class="lg-grid" style="grid-template-columns:minmax(0,1fr)">
<article class="prose">
<h2 id="provider" style="margin-top:8px"><span class="n">01</span>Provider</h2>
<div class="card {{cardCls}}"><span class="tape" aria-hidden="true"></span><span class="tape b" aria-hidden="true"></span><div class="card-in">
<address><span class="who fx">Max Mustermann</span><br><span class="fx">Musterstraße 1</span><br><span class="fx">12345 Musterstadt</span><br><span class="fx">Germany</span></address>
</div></div>
<p>Wolfsblvt Works is the name I make and publish things under. It isn’t a company or a separate legal person.</p>

<h2 id="contact"><span class="n">02</span>Contact</h2>
<dl class="facts">
<dt>Email</dt><dd><a href="mailto:impressum@wolfsblvt.works">impressum@wolfsblvt.works</a></dd>
<dt>Direct contact</dt><dd><a href="https://contact.wolfsblvt.works" data-route="contact.wolfsblvt.works" class="fx">Contact form at contact.wolfsblvt.works</a></dd>
</dl>
<p>For privacy questions, see <a href="/privacy/" data-route="/privacy/">Privacy and data</a>.</p>

<div class="next">
<p class="next-h">that’s all of it.</p>
<a class="lk" href="/" data-route="/">Back to the walk</a>
<a class="lk" href="/privacy/" data-route="/privacy/">Privacy and data</a>
</div>
</article>
</div>
</main>`;

const STRIKE = `<svg class="strike" aria-hidden="true" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="M4 22 C 80 12, 160 30, 240 17 S 360 15, 396 21"></path></svg>`;

const NOTFOUND_BODY = `
<main class="frame lift er">
<div>
<p class="kicker er-code">404 · not found</p>
<h1 class="er-h">{{headline}}</h1>
<p class="er-path"><span class="er-url"><span class="sr">The address you tried: </span>{{path}}${STRIKE}</span><span class="er-ins" aria-hidden="true">{{pathNote}}</span></p>
<p class="er-lead">Maybe it moved, maybe it never existed, maybe it’s still an idea somewhere on the pile.</p>
<div class="er-acts">
<a class="btn btn-solid" href="/" data-route="/">Back to the start</a>
<a class="btn btn-line" href="/#whoa" data-route="/#whoa">Look at today’s pile</a>
<a class="er-quiet" href="https://contact.wolfsblvt.works" data-route="contact.wolfsblvt.works">Tell me what should have been here →</a>
</div>
</div>
<div class="er-yoru">
<sc-if value="{{yoruHome}}" hint-placeholder-val="{{ true }}"><div class="er-cap" aria-hidden="true"><span>Yoru gets lost here too.</span><svg width="30" height="26" viewBox="0 0 30 26" fill="none" stroke="#ef8ea1" stroke-width="1.6" stroke-linecap="round"><path d="M3 5c8 1 15 6 22 16"></path><path d="M18 20l7 1.5-1-7"></path></svg></div></sc-if>
<button class="yoru-btn {{yoruCls}}" onClick="{{yoruClick}}" aria-label="Yoru, the resident. Click him and he runs off." title="Yoru"><div class="sprite {{yoruAnim}}"></div></button>
<div class="er-ground"></div>
</div>
</main>`;

const ERROR_BODY = `
<main class="frame lift er">
<div>
<p class="kicker er-code">503 · temporarily unavailable</p>
<h1 class="er-h er-h-sm">Something broke. On our side.</h1>
<p class="er-path"><span class="er-ins" style="animation-delay:.9s">it’s not you. probably something I did.</span></p>
<p class="er-lead" style="animation-delay:1.6s">The site should be back shortly. Try again in a minute. If it stays like this, I’d like to know.</p>
<div class="er-acts" style="animation-delay:2s">
<button class="btn btn-solid" onClick="{{reload}}">Try again</button>
<a class="btn btn-line" href="https://wolfsblvt.com" data-route="wolfsblvt.com">Find me on wolfsblvt.com</a>
<a class="er-quiet" href="mailto:contact@wolfsblvt.works">contact@wolfsblvt.works</a>
</div>
</div>
<div class="er-yoru">
<div class="er-cap" aria-hidden="true" style="animation-delay:2.4s"><span>Yoru is looking into it.</span><svg width="30" height="26" viewBox="0 0 30 26" fill="none" stroke="#ef8ea1" stroke-width="1.6" stroke-linecap="round"><path d="M3 5c8 1 15 6 22 16"></path><path d="M18 20l7 1.5-1-7"></path></svg></div>
<div class="sprite s-doze" role="img" aria-label="Yoru, asleep"></div>
<div class="er-ground"></div>
</div>
</main>
<div class="frame lift"><div class="er-mini"><span style="color:#d1c0b8;font-weight:600">Wolfsblvt Works</span><span>·</span><a href="/impressum/" data-route="/impressum/">Impressum</a><a href="/privacy/" data-route="/privacy/">Privacy and data</a></div></div>`;

// ---------- the component, shared by every room ----------
const SCRIPT = String.raw`
const NAV = [
  { id:'hi', word:'Hi', plain:'Start' },
  { id:'what', word:'What', plain:'Projects' },
  { id:'why', word:'Why', plain:'About Works' },
  { id:'who', word:'Who', plain:'Wolf & agents' },
  { id:'help', word:'Help', plain:'Support the work' },
  { id:'whoa', word:'Whoa', plain:'The Pile' },
  { id:'hello', word:'Hello?', plain:'Contact' },
];
const HEADLINES = {
  path: { h: 'Off the path.', note: 'not here. moved, maybe? or never was.' },
  yet: { h: 'Nothing here. Yet?', note: 'or not anymore. hard to say.' },
  wander: { h: 'This page wandered off.', note: 'it does that. sorry.' },
};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function r1(n) { return Math.round(n * 10) / 10; }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function smooth(pts) {
  if (pts.length < 2) return '';
  let d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ' C' + r1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + r1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + r1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + r1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + r1(p2[0]) + ' ' + r1(p2[1]);
  }
  return d;
}
const easeQuint = (t) => t * t * t * (10 + t * (-15 + 6 * t));
${MARK_JS}

class Component extends DCLogic {
  state = { W: typeof window !== 'undefined' ? window.innerWidth : 1440, contentH: 0, walkReady: false, headT: 0, prog: 0, navFx: {}, menuOpen: false, socialOpen: false, toc: (PAGE.toc[0] || {}).id || '', yoru: 'idle', look: false, toast: '' };
  rootRef = React.createRef(); contentRef = React.createRef();

  componentDidMount() {
    this._reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._t = []; this._navT = {};
    this._ro = new ResizeObserver(() => this.measure());
    if (this.contentRef.current) this._ro.observe(this.contentRef.current);
    this.measure();
    this._io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.setAttribute('data-on', '1'); this._io.unobserve(e.target); } }), { threshold: 0.3, rootMargin: '0px 0px -18% 0px' });
    document.querySelectorAll('[data-reveal]').forEach((el) => this._io.observe(el));
    this._onScroll = () => { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = 0; this.spy(); }); };
    addEventListener('scroll', this._onScroll, { passive: true });
    this._onManual = (e) => { if (e.type === 'keydown' && ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].indexOf(e.key) < 0) return; if (this._travel) this._travel.cancel(); };
    addEventListener('wheel', this._onManual, { passive: true }); addEventListener('touchstart', this._onManual, { passive: true }); addEventListener('keydown', this._onManual);
    if (PAGE.kind === 'notfound') this._lookT = setInterval(() => { if (this.state.yoru === 'idle' && !this._reduce) { this.setState({ look: true }); this._t.push(setTimeout(() => this.setState({ look: false }), 1700)); } }, 6500);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.measure());
    this.spy();
    if (this.pageMount) this.pageMount();
  }
  componentDidUpdate(prevProps) { if (this.pageUpdate) this.pageUpdate(prevProps || {}); }
  componentWillUnmount() {
    if (this._ro) this._ro.disconnect(); if (this._io) this._io.disconnect();
    removeEventListener('scroll', this._onScroll); removeEventListener('wheel', this._onManual); removeEventListener('touchstart', this._onManual); removeEventListener('keydown', this._onManual);
    (this._t || []).forEach(clearTimeout); Object.values(this._navT || {}).forEach(clearTimeout); clearInterval(this._lookT); clearTimeout(this._toastT); clearTimeout(this._yt);
    if (this._travel) this._travel.cancel();
  }
  measure() {
    const root = this.rootRef.current, content = this.contentRef.current; if (!root || !content) return;
    const W = root.clientWidth, H = Math.max(content.offsetHeight, root.clientHeight); const s = {};
    if (Math.abs(W - this.state.W) > 1) s.W = W;
    if (Math.abs(H - this.state.contentH) > 24) s.contentH = H;
    if (!this.state.walkReady) s.walkReady = true;
    if (Object.keys(s).length) this.setState(s);
  }
  // no hero here: the header settles over the first 220px, the path line is plain reading progress
  spy() {
    const maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const headT = clamp(scrollY / 220, 0, 1), prog = clamp(scrollY / maxY, 0, 1);
    let toc = this.state.toc; const line = scrollY + innerHeight * 0.3;
    PAGE.toc.forEach((t) => { const el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top + scrollY <= line) toc = t.id; });
    if (scrollY >= maxY - 4 && PAGE.toc.length) toc = PAGE.toc[PAGE.toc.length - 1].id;
    const s = {};
    if (Math.abs(headT - this.state.headT) > 0.01 || (headT === 1 && this.state.headT !== 1) || (headT === 0 && this.state.headT !== 0)) s.headT = headT;
    if (Math.abs(prog - this.state.prog) > 0.002) s.prog = prog;
    if (toc !== this.state.toc) s.toc = toc;
    if (Object.keys(s).length) this.setState(s);
  }
  travelTo(targetY) {
    if (this._travel) this._travel.cancel();
    const startY = scrollY; const maxY = document.documentElement.scrollHeight - innerHeight;
    const to = clamp(targetY, 0, Math.max(0, maxY));
    if (this._reduce || Math.abs(to - startY) < 4) { scrollTo(0, to); return Promise.resolve('arrived'); }
    const dist = Math.abs(to - startY) / Math.max(1, innerHeight);
    const dur = Math.min(1600, Math.max(600, 500 + 240 * Math.sqrt(dist)));
    let cancelled = false, raf = 0; const t0 = performance.now();
    return new Promise((resolve) => {
      this._travel = { cancel: () => { if (!cancelled) { cancelled = true; cancelAnimationFrame(raf); this._travel = null; resolve('cancelled'); } } };
      const step = (now) => { if (cancelled) return; const k = clamp((now - t0) / dur, 0, 1); scrollTo(0, startY + (to - startY) * easeQuint(k)); if (k < 1) raf = requestAnimationFrame(step); else { this._travel = null; resolve('arrived'); } };
      raf = requestAnimationFrame(step);
    });
  }
  tocGo(id, e) {
    if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1)) return;
    if (e && e.preventDefault) e.preventDefault();
    const el = document.getElementById(id); if (!el) return;
    this.travelTo(el.getBoundingClientRect().top + scrollY - (62 + (innerWidth >= 720 ? 44 : 18)));
    try { history.replaceState(null, '', '#' + id); } catch (err) {}
  }
  // links that leave this room: on the canvas they say where they go instead of navigating the artboard away
  rootClick = (e) => {
    const a = e.target && e.target.closest ? e.target.closest('a[data-route]') : null; if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault(); this.setState({ menuOpen: false, socialOpen: false });
    const r = a.getAttribute('data-route'); this.showToast(r.indexOf('.') > 0 && r.charAt(0) !== '/' ? 'Opens ' + r : 'Goes to wolfsblvt.works' + r);
  };
  showToast(text) { clearTimeout(this._toastT); this.setState({ toast: text }); this._toastT = setTimeout(() => this.setState({ toast: '' }), 2000); }
  navEnter(id) {
    if (id === 'hello') return;
    clearTimeout(this._navT[id]); const fx = this.state.navFx[id]; if (fx === 'name' || fx === 'dots') return;
    const set = (v) => this.setState((s) => ({ navFx: Object.assign({}, s.navFx, { [id]: v }) }));
    if (this._reduce) { set('name'); return; }
    this._navT[id] = setTimeout(() => { set('dots'); this._navT[id] = setTimeout(() => set('name'), 650); }, 260);
  }
  navLeave(id) {
    if (id === 'hello') return;
    clearTimeout(this._navT[id]); if (!this.state.navFx[id]) return;
    const set = (v) => this.setState((s) => ({ navFx: Object.assign({}, s.navFx, { [id]: v }) }));
    this._navT[id] = setTimeout(() => { set('wipe'); this._navT[id] = setTimeout(() => set(null), 650); }, 1300);
  }
  toggleMenu = () => this.setState((s) => ({ menuOpen: !s.menuOpen, socialOpen: false }));
  toggleSocial = () => this.setState((s) => ({ socialOpen: !s.socialOpen, menuOpen: false }));
  escClose = (e) => { if (e.key === 'Escape') this.setState({ menuOpen: false, socialOpen: false }); };
  // Yoru on the 404: click and he runs off the path, then wanders back from the other side
  yoruClick = () => {
    if (this.state.yoru !== 'idle') return;
    if (this._reduce) return;
    this.setState({ yoru: 'flee' });
    this._yt = setTimeout(() => { this.setState({ yoru: 'away' }); this._yt = setTimeout(() => { this.setState({ yoru: 'back' }); this._yt = setTimeout(() => this.setState({ yoru: 'idle' }), 1650); }, 2600); }, 1650);
  };
  reload = () => { this.showToast('The real page reloads itself here.'); };

  buildWalk(W, H) {
    const g = clamp(W * 0.025, 16, 32);
    const fw = Math.min(80 * 16, W - 2 * g); const fx = (W - fw) / 2;
    const narrow = W < 720; const ends = PAGE.kind === 'notfound' && (this.props.pathEnd || 'fray') === 'fray';
    const rnd = mulberry32(PAGE.seed);
    // the 404 is short, so it gets a finer step (same meander, scaled) to let the frame hold before it frays
    const step = ends ? 360 : narrow ? 620 : 980; const k = ends ? step / (narrow ? 620 : 980) : 1;
    const n = Math.ceil((H + 1600) / step) + 2;
    const A = narrow ? 0.028 : 0.04, B = narrow ? 0.016 : 0.035;
    const centre0 = narrow ? 0.5 : 0.475, half0 = narrow ? 0.49 : 0.485;
    const ph = rnd() * 6.28, ph2 = rnd() * 6.28, f1 = 1.25 + rnd() * 0.2, f2 = 0.62 + rnd() * 0.15;
    const L = [], R = [], GL = [], GR = [], FL = [], FR = [], SL1 = [], SL2 = [], SR1 = [], SR2 = [];
    const jit = (a) => (rnd() - 0.5) * 2 * fw * a;
    for (let i = 0; i < n; i++) {
      const y = -step + i * step + (rnd() - 0.5) * step * 0.18;
      // on the 404 the two lines lose each other: past the middle they drift apart and the strands loosen
      const lost = ends ? Math.pow(clamp((y / Math.max(1, H) - 0.4) / 0.4, 0, 1), 1.6) : 0;
      const c = centre0 + A * Math.sin(i * f1 * k + ph) + (rnd() - 0.5) * 0.008 + lost * 0.05;
      const hw = half0 + B * Math.sin(i * f2 * k + ph2) + (rnd() - 0.5) * 0.006 + lost * 0.12;
      const lx = fx + (c - hw) * fw + jit(0.004) - lost * 40, rx = fx + (c + hw) * fw + jit(0.004);
      L.push([lx, y]); R.push([rx, y]);
      GL.push([lx + jit(0.012), y]); GR.push([rx + jit(0.014), y]);
      const big = rnd() < 0.28 ? 2.4 : 1;
      FL.push([lx + jit((narrow ? 0.012 : 0.022) * big), y + (rnd() - 0.5) * step * 0.3 * k]); FR.push([rx + jit((narrow ? 0.014 : 0.026) * big), y + (rnd() - 0.5) * step * 0.3]);
      SL1.push([lx + jit(0.003 + lost * 0.03), y + (rnd() - 0.5) * 40]); SL2.push([lx + jit(0.005 + lost * 0.05), y]);
      SR1.push([rx + jit(0.003 + lost * 0.03), y + (rnd() - 0.5) * 40]); SR2.push([rx + jit(0.005 + lost * 0.05), y]);
    }
    FL.sort((a, b) => a[1] - b[1]); FR.sort((a, b) => a[1] - b[1]);
    const y0 = FL[0][1], yN = FL[FL.length - 1][1];
    const edgeL = smooth(FL), edgeR = smooth(FR);
    const inten = { quiet: 0.11, standard: 0.16 }[this.props.walkIntensity || 'quiet'] * (narrow ? 0.9 : 1);
    return {
      readyCls: this.state.walkReady ? 'ready' : '', endsCls: ends ? 'ends' : '',
      h: H, vb: '0 0 ' + W + ' ' + H, fW: W + 800, fH: H + 1600, fillBlur: narrow ? 12 : 30,
      fillL: edgeL + ' L-160 ' + r1(yN) + ' L-160 ' + r1(y0) + ' Z',
      fillR: edgeR + ' L' + (W + 160) + ' ' + r1(yN) + ' L' + (W + 160) + ' ' + r1(y0) + ' Z',
      edgeL, edgeR, fillOp: inten, fillOpR: r1(inten * 1.12 * 100) / 100,
      lineL: smooth(L), lineR: smooth(R), glowL: smooth(GL), glowR: smooth(GR),
      strL1: smooth(SL1), strL2: smooth(SL2), strR1: smooth(SR1), strR2: smooth(SR2),
    };
  }

  renderVals() {
    const W = this.state.W; const y = this.state.yoru;
    const nav = NAV.map((n) => {
      const fx = this.state.navFx[n.id]; const isHello = n.id === 'hello';
      return {
        id: n.id, word: n.word, plain: n.plain, href: '/#' + n.id, aria: n.word + ', ' + n.plain,
        wordCls: isHello ? 'nav-hello' : '', isHello, cls: PAGE.navOn === n.id ? 'on' : '',
        enter: () => this.navEnter(n.id), leave: () => this.navLeave(n.id),
        showDots: !isHello && (fx === 'dots' || fx === 'name'), dotsCls: fx === 'name' ? 'gone' : 'writing',
        showName: !isHello && (fx === 'name' || fx === 'wipe'), nameCls: fx === 'wipe' ? 'wiping' : 'writing-slow',
      };
    });
    const hl = HEADLINES[this.props.headline || 'path'] || HEADLINES.path;
    const t = this.state.headT; const b = r1(2 + 8 * t);
    return {
      rootRef: this.rootRef, contentRef: this.contentRef, rootClick: this.rootClick,
      walk: this.buildWalk(W, Math.max(this.state.contentH, 600)),
      mark: markVals(this.state.headT, this.props.markTop || 60, W < 640, true),
      headStyle: 'background:rgb(16 11 17 / ' + r1((0.24 + 0.58 * t) * 100) / 100 + ');backdrop-filter:blur(' + b + 'px);-webkit-backdrop-filter:blur(' + b + 'px);border-bottom-color:rgb(243 232 220 / ' + r1((0.025 + 0.045 * t) * 1000) / 1000 + ')',
      hasLoc: !!PAGE.loc, loc: PAGE.loc || '',
      nav, progOffset: r1(100 - this.state.prog * 100), progPct: r1(this.state.prog * 100),
      menuOpen: this.state.menuOpen, socialOpen: this.state.socialOpen, toggleMenu: this.toggleMenu, toggleSocial: this.toggleSocial, escClose: this.escClose,
      curPrivacy: PAGE.kind === 'privacy' ? 'page' : 'false', curImpressum: PAGE.kind === 'impressum' ? 'page' : 'false', curContact: PAGE.kind === 'contact' ? 'page' : 'false',
      fixtures: this.props.fixtures !== false, fxCls: this.props.fixtures !== false ? 'fixtures' : '',
      cardCls: (this.props.addressCard || 'paper') === 'plain' ? 'plain' : '',
      toc: PAGE.toc.map((x) => ({ title: x.title, href: '#' + x.id, cls: this.state.toc === x.id ? 'on' : '', go: (e) => this.tocGo(x.id, e) })),
      headline: hl.h, pathNote: hl.note, path: this.props.path || '/pile/a-thing-that-moved',
      yoruCls: y === 'flee' ? 'out' : y === 'away' ? 'away' : '', yoruAnim: y === 'flee' ? 's-runR' : y === 'back' ? 's-runL' : this.state.look ? 's-look' : 's-idle', yoruHome: y === 'idle',
      yoruClick: this.yoruClick, reload: this.reload,
      toast: this.state.toast, toastCls: this.state.toast ? 'on' : '',
      ...(this.pageVals ? this.pageVals() : {}),
    };
  }
/*PAGE_METHODS*/
}`;

// ---------- the contact room ----------
// Fields, values, limits, ids and data-* hooks follow wolfsblvt.com shared/contact-contract.ts and
// src/scripts/contact-form.ts, so the production page can carry the accepted browser integration unchanged
// apart from the presentation points listed in the handoff.
const CSS_CONTACT = `
/* contact room */
.ct{padding:clamp(56px,10vh,110px) 0 0}
/* desktop: heading and fine print on the left, the form on the right; phones: heading, form, then the fine print */
.ct-grid{display:grid;grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr);grid-template-areas:"head card" "info card";grid-template-rows:auto 1fr;column-gap:clamp(40px,6vw,96px);align-items:start}
.ct-head{grid-area:head}.ct-info{grid-area:info}.ct-card-wrap{grid-area:card}
@media (max-width:980px){.ct-grid{grid-template-columns:1fr;grid-template-areas:"head" "card" "info";grid-template-rows:auto}}
.ct-h{margin:0;font-weight:300;font-size:clamp(44px,5.2vw,78px);line-height:1;letter-spacing:-.03em;font-variation-settings:'opsz' 72;text-wrap:balance}
.ct-lead{margin:22px 0 0;font-size:clamp(19px,1.6vw,22px);line-height:1.5;color:#d1c0b8;max-width:32ch}
.ct-scr{margin:14px 0 0 26px;font:500 19px/1.25 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-3deg);width:max-content;max-width:100%}
.ct-block{margin-top:46px;padding-top:22px;border-top:1px solid rgb(243 232 220 / 10%);font-family:'Albert Sans',sans-serif}
.ct-block-h{margin:0 0 12px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#9c8c93}
.ct-facts{margin:0 0 0 25px;padding:0;list-style:none;display:grid;gap:9px;font-size:15px;line-height:1.5;color:#d1c0b8;max-width:44ch}
.ct-facts li{position:relative;padding-left:22px}
.ct-facts li::before{content:'';position:absolute;left:2px;top:.68em;width:10px;height:2px;border-radius:2px;background:#eca557}
.ct-more{margin:12px 0 0;font-size:14px;color:#9c8c93}
.ct-more a{color:#f3e8dc;text-decoration-color:rgb(115 202 227 / 55%);text-underline-offset:3px}
.ct-more a:hover{color:#73cae3}
.ct-other{display:flex;flex-wrap:wrap;gap:10px}
.lk-discord{border-color:rgb(88 101 242 / 55%)}.lk-discord:hover{border-color:#5865F2;color:#aab2ff}
.ct-card-wrap{position:relative;margin-top:46px}
@media (max-width:980px){.ct-card-wrap{margin-top:110px}}
.ct-card{position:relative;border:1px solid rgb(243 232 220 / 12%);border-radius:18px;background:linear-gradient(180deg,rgb(30 21 30 / 92%),rgb(20 14 21 / 92%));box-shadow:0 30px 70px -40px rgb(0 0 0 / 90%);padding:clamp(24px,3vw,40px)}
.ct-yoru{position:absolute;right:34px;top:-98px;z-index:2;transition:transform 1.6s linear}
.ct-yoru.out{transform:translateX(70vw)}
.ct-yoru.away{transform:translateX(70vw);transition:none;visibility:hidden}
.ct-from{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 26px;padding:12px 14px;border-radius:12px;border:1px dashed rgb(115 202 227 / 35%);background:rgb(115 202 227 / 6%);font:14.5px/1.4 'Albert Sans',sans-serif;color:#d1c0b8}
.ct-from strong{color:#f3e8dc}
.ct-form{display:grid;gap:26px}
.ct-form.is-hidden,.outcome.is-hidden,.err-sum.is-hidden{display:none}
.field{min-width:0;margin:0;padding:0;border:0}
.lbl{display:flex;align-items:baseline;gap:8px;margin:0 0 8px;padding:0;font:600 15px 'Albert Sans',sans-serif;color:#f3e8dc}
.opt{font:500 12px 'Albert Sans',sans-serif;color:#9c8c93;letter-spacing:.02em}
.hint{margin:-2px 0 10px;font:13.5px/1.45 'Albert Sans',sans-serif;color:#9c8c93}
.lbl-row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.count{font:12.5px 'Albert Sans',sans-serif;color:#9c8c93;font-variant-numeric:tabular-nums}
.count.over{color:#ef8ea1}
.inp{box-sizing:border-box;width:100%;min-height:46px;padding:11px 14px;border-radius:11px;border:1px solid rgb(243 232 220 / 16%);background:#120c13;color:#f3e8dc;font:16px/1.4 'Albert Sans',sans-serif;transition:border-color .2s,box-shadow .2s}
.inp::placeholder{color:#7d6e77}
.inp:hover{border-color:rgb(243 232 220 / 26%)}
.inp:focus{outline:none;border-color:#73cae3;box-shadow:0 0 0 3px rgb(115 202 227 / 18%)}
textarea.inp{min-height:190px;resize:vertical;font:17px/1.6 'Literata',Georgia,serif}
.field-invalid .inp,.field-invalid .combo{border-color:#ef8ea1}
.field-error{margin:8px 0 0;display:flex;gap:7px;align-items:baseline;font:600 13.5px/1.4 'Albert Sans',sans-serif;color:#ef8ea1}
.field-error::before{content:'';flex:none;width:6px;height:6px;border-radius:50%;background:#ef8ea1;transform:translateY(-1px)}
.foot-row{display:flex;justify-content:space-between;gap:12px;margin-top:7px;font:12.5px 'Albert Sans',sans-serif;color:#9c8c93}
.pills{display:flex;flex-wrap:wrap;gap:8px}
.pill{position:relative;cursor:pointer}
.pill input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.pill-t{display:inline-flex;align-items:center;min-height:38px;padding:0 15px;border-radius:999px;border:1px solid rgb(243 232 220 / 18%);font:14.5px 'Albert Sans',sans-serif;color:#d1c0b8;transition:border-color .2s,background .2s,color .2s}
.pill:hover .pill-t{border-color:rgb(243 232 220 / 34%);color:#f3e8dc}
.pill input:checked+.pill-t{background:#f3e8dc;border-color:#f3e8dc;color:#100b11;font-weight:600}
.pill input:focus-visible+.pill-t{outline:2px solid #73cae3;outline-offset:3px}
.field-invalid .pill-t{border-color:rgb(239 142 161 / 55%)}
.combo{position:relative;display:flex;align-items:center;border-radius:11px;border:1px solid rgb(243 232 220 / 16%);background:#120c13;transition:border-color .2s,box-shadow .2s}
.combo:hover{border-color:rgb(243 232 220 / 26%)}
.combo:focus-within{border-color:#73cae3;box-shadow:0 0 0 3px rgb(115 202 227 / 18%)}
.combo-ico{flex:none;display:grid;place-items:center;width:44px;color:#c0b0b1}
.combo-inp{border:0;background:transparent;padding-left:0;min-height:44px}
.combo-inp:focus{box-shadow:none}
.combo-clear{appearance:none;border:0;background:transparent;color:#9c8c93;width:40px;height:40px;border-radius:8px;cursor:pointer;font:20px/1 'Albert Sans',sans-serif}
.combo-clear:hover{color:#f3e8dc;background:rgb(243 232 220 / 6%)}
.combo-list{position:absolute;left:-1px;right:-1px;top:calc(100% + 6px);z-index:30;margin:0;padding:6px;list-style:none;max-height:300px;overflow:auto;border-radius:12px;border:1px solid rgb(243 232 220 / 14%);background:#1d141e;box-shadow:0 18px 40px rgb(0 0 0 / 45%)}
.combo-opt{display:flex;align-items:center;gap:12px;min-height:42px;padding:6px 10px;border-radius:8px;cursor:pointer;font:15px 'Albert Sans',sans-serif;color:#f3e8dc}
.combo-opt:hover{background:rgb(243 232 220 / 6%)}
.combo-opt.active{background:rgb(115 202 227 / 12%)}
.combo-opt.sel .o-l{font-weight:700}
.combo-opt .o-l{flex:1;min-width:0}
.combo-opt .check{color:#73cae3}
.combo-opt .ill{flex:none;min-width:64px;text-align:right}
.combo-empty{padding:12px 10px;font:14px/1.4 'Albert Sans',sans-serif;color:#9c8c93}
.combo-group{padding:8px 10px 4px;font:600 10.5px 'Albert Sans',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#7d6e77}
.pico{flex:none;display:inline-grid;place-items:center;width:24px;height:24px;color:#f3e8dc}
.pico svg{width:20px;height:20px}
.pico.ph{box-sizing:border-box;width:22px;height:22px;border:1.5px dashed rgb(243 232 220 / 34%);border-radius:7px;font:700 10.5px 'Albert Sans',sans-serif;color:#c0b0b1}
.hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}
.ct-send{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding-top:6px}
.ct-send .btn{gap:9px;min-width:140px}
.ct-send .btn[disabled]{opacity:.7;cursor:progress;transform:none}
.note{margin:0;font:14px 'Albert Sans',sans-serif;color:#9c8c93}
.err-sum{padding:16px 18px;border-radius:12px;border:1px solid rgb(239 142 161 / 45%);background:rgb(239 142 161 / 8%);font-family:'Albert Sans',sans-serif}
.err-sum:focus{outline:2px solid #ef8ea1;outline-offset:3px}
.err-t{margin:0 0 8px;font-weight:700;font-size:15px;color:#f3e8dc}
.err-sum ul{margin:0;padding-left:18px;display:grid;gap:4px;font-size:14px}
.err-sum a{color:#ef8ea1}
.outcome{padding:8px 0 4px}
.outcome:focus{outline:none}
.out-k{margin:0 0 14px;font:600 12px 'Albert Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#73cae3}
.out-k.bad{color:#ef8ea1}
.out-h{margin:0;font-weight:300;font-size:clamp(32px,3.2vw,46px);line-height:1.08;letter-spacing:-.02em;font-variation-settings:'opsz' 60;text-wrap:balance}
.out-t{margin:18px 0 0;font-size:18px;line-height:1.6;color:#d1c0b8;max-width:52ch}
.out-ref{margin:18px 0 0;font:14px 'Albert Sans',sans-serif;color:#9c8c93}
.out-ref code{margin-left:8px;padding:4px 9px;border-radius:7px;background:#120c13;border:1px solid rgb(243 232 220 / 12%);font:500 14px 'IBM Plex Mono',monospace;color:#f3e8dc;letter-spacing:.03em}
.out-scr{margin:22px 0 0 14px;font:500 19px/1.3 'Shantell Sans',cursive;color:#ef8ea1;transform:rotate(-2.5deg);width:max-content;max-width:100%}
.out-acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:28px}
.btn-quiet{appearance:none;border:0;background:none;padding:6px 4px;font:14.5px 'Albert Sans',sans-serif;color:#d1c0b8;text-decoration:underline;text-underline-offset:4px;text-decoration-color:rgb(243 232 220 / 30%);cursor:pointer}
.btn-quiet:hover{color:#73cae3}
`;

const DIFFDEVIL_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l3 2.25V9h10V6.25L20 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"></path><path d="M12 9v11"></path><path d="M6.5 13h3"></path><path d="M14.5 13h3"></path><path d="M16 11.5v3"></path></svg>`;
const SEARCH_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`;
// the Works icon-slot glyph from the marks return (svg/glyph/works-glyph-24.svg), a candidate for @wolfsblvt/icons
const WORKS_GLYPH_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 15.5V10a6 6 0 0 1 6-6h4"></path><path d="M20.5 7v4.6a8.9 8.9 0 0 1-8.9 8.9H7.5"></path><circle cx="12.8" cy="13" r="1"></circle></svg>`;
const PICON = (v) => `<sc-if value="{{${v}.dd}}" hint-placeholder-val="{{ false }}"><span class="pico">${DIFFDEVIL_SVG}</span></sc-if><sc-if value="{{${v}.wk}}" hint-placeholder-val="{{ false }}"><span class="pico">${WORKS_GLYPH_SVG}</span></sc-if><sc-if value="{{${v}.ph}}" hint-placeholder-val="{{ true }}"><span class="pico ph" aria-hidden="true">{{${v}.initial}}</span></sc-if>`;
// the native select the contract script drives; the HTML parser drops template tags inside <select>, so it is static here
const SELECT_OPTIONS = [['wolfsblvt-works', 'Wolfsblvt Works website'], ['diffdevil', 'diffdevil'], ['smolpng', 'smolpng'], ['shikkuri', 'Shikkuri'], ['lunescence', 'Lunescence'], ['xkcd-tracker', 'xkcd tracker'], ['openai-tunnel', 'OpenAI Tunnel auto-updater'], ['baumhaus', 'Baumhaus'], ['rpgm-export', 'RPG Maker script export'], ['wolfsblvt-com', 'wolfsblvt.com website'], ['agents', 'Wolf’s Agents']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
const FIELD_ERR = (k) => `<sc-if value="{{err.${k}}}" hint-placeholder-val="{{ false }}"><p class="field-error" id="${k}-error">{{err.${k}}}</p></sc-if>`;

const CONTACT_BODY = `
<main class="frame lift ct" id="top">
<div class="ct-grid">
<div class="ct-head">
<h1 class="ct-h">Arriving with a thought</h1>
<p class="ct-lead">Whatever’s on your mind, I’d like to hear it.</p>
<p class="ct-scr">half a thought counts too.</p>
</div>
<div class="ct-info">
<div class="ct-block">
<p class="ct-block-h">When you send it</p>
<ul class="ct-facts">
<li>It comes to me, and a plain-text copy goes to you.</li>
<li>No mailing list, no ticket system, no database. Just those two emails.</li>
<li>A Cloudflare check runs in the background to keep bots out.</li>
<li>Please don’t send passwords, keys or anything secret. For a security issue, pick “Security” and we’ll find a safer way to talk.</li>
</ul>
<p class="ct-more">The details are in <a href="/privacy/#contact" data-route="/privacy/#contact">Privacy and data</a>.</p>
</div>
<div class="ct-block">
<p class="ct-block-h">Or, if a form isn’t your thing</p>
<div class="ct-other">
<a class="lk" href="mailto:contact@wolfsblvt.works">contact@wolfsblvt.works</a>
<a class="lk lk-discord" href="https://discord.com/users/207895909734940674" data-route="discord.com/users/207895909734940674">@wolfsblvt on Discord</a>
</div>
</div>
</div>

<div class="ct-card-wrap">
<div class="ct-yoru {{yoru2Cls}}" aria-hidden="true"><div class="sprite {{yoru2Anim}}"></div></div>
<div class="ct-card">
<sc-if value="{{from.show}}" hint-placeholder-val="{{ false }}"><p class="ct-from" data-product-context>${PICON('from')}<span>You came from <strong data-product-label>{{from.label}}</strong>, so it’s picked below. Change it if you like.</span></p></sc-if>

<form class="ct-form {{formCls}}" data-contact-form data-subject-max="120" data-products="{{productsJson}}" novalidate onSubmit="{{submit}}" ref="{{formRef}}" aria-labelledby="ct-form-t">
<h2 id="ct-form-t" class="sr">Write to me</h2>
<div class="err-sum {{sumCls}}" data-error-summary tabindex="-1" role="alert" ref="{{sumRef}}">
<p class="err-t" data-error-summary-title>{{sumTitle}}</p>
<ul data-error-summary-list><sc-for list="{{errList}}" as="er" hint-placeholder-count="2"><li><a href="{{er.href}}" onClick="{{er.go}}">{{er.msg}}</a></li></sc-for></ul>
</div>

<fieldset class="field {{inv.category}}" aria-describedby="category-hint">
<legend class="lbl">Roughly what’s it about?</legend>
<p class="hint" id="category-hint">So it lands on the right pile. “Something else” is always fine.</p>
<div class="pills" role="radiogroup">
<sc-for list="{{cats}}" as="c" hint-placeholder-count="6"><label class="pill"><input type="radio" name="category" value="{{c.value}}" id="{{c.id}}" onChange="{{clearCategory}}"><span class="pill-t">{{c.label}}</span></label></sc-for>
</div>
${FIELD_ERR('category')}
</fieldset>

<div class="field">
<label class="lbl" for="product-search">About one of the projects? <span class="opt">optional</span></label>
<div class="combo">
<span class="combo-ico"><sc-if value="{{combo.hasValue}}" hint-placeholder-val="{{ false }}">${PICON('combo.cur')}</sc-if><sc-if value="{{combo.noValue}}" hint-placeholder-val="{{ true }}">${SEARCH_SVG}</sc-if></span>
<input id="product-search" class="inp combo-inp" type="text" role="combobox" aria-expanded="{{combo.expanded}}" aria-controls="product-list" aria-autocomplete="list" aria-activedescendant="{{combo.active}}" autocomplete="off" spellcheck="false" placeholder="Search the projects…" value="{{combo.text}}" onChange="{{combo.input}}" onFocus="{{combo.focus}}" onBlur="{{combo.blur}}" onKeyDown="{{combo.key}}">
<sc-if value="{{combo.hasValue}}" hint-placeholder-val="{{ false }}"><button type="button" class="combo-clear" aria-label="Clear the project" onClick="{{combo.clear}}">×</button></sc-if>
<sc-if value="{{combo.open}}" hint-placeholder-val="{{ false }}"><ul id="product-list" role="listbox" class="combo-list" aria-label="Projects">
<sc-for list="{{combo.opts}}" as="o" hint-placeholder-count="5"><li id="{{o.id}}" role="option" aria-selected="{{o.sel}}" class="combo-opt {{o.cls}}" onMouseDown="{{o.pick}}">${PICON('o')}<span class="o-l">{{o.label}}</span><span class="ill">{{o.type}}</span><sc-if value="{{o.isSel}}" hint-placeholder-val="{{ false }}"><span class="check" aria-hidden="true">✓</span></sc-if></li></sc-for>
<sc-if value="{{combo.none}}" hint-placeholder-val="{{ false }}"><li class="combo-empty" role="presentation">Nothing by that name. Leave it empty and just tell me.</li></sc-if>
</ul></sc-if>
</div>
<select id="product" name="product" class="sr" tabindex="-1" aria-hidden="true" value="{{combo.slug}}" onChange="{{noop}}"><option value=""></option>${SELECT_OPTIONS}</select>
</div>

<div class="field {{inv.name}}">
<label class="lbl" for="name">Your name <span class="opt">optional</span></label>
<input id="name" name="name" class="inp" type="text" autocomplete="name" aria-invalid="{{aria.name}}">
${FIELD_ERR('name')}
</div>

<div class="field {{inv.email}}">
<label class="lbl" for="email">Your email</label>
<p class="hint" id="email-hint">So I can write back. Your copy of the message goes here too.</p>
<input id="email" name="email" class="inp" type="email" autocomplete="email" inputmode="email" aria-describedby="email-hint" aria-invalid="{{aria.email}}" onInput="{{clearField}}">
${FIELD_ERR('email')}
</div>

<div class="field {{inv.subject}}">
<div class="lbl-row"><label class="lbl" for="subject">Subject</label><span class="count {{subjectOverCls}}" data-subject-count>{{subjectCount}}</span></div>
<input id="subject" name="subject" class="inp" type="text" aria-invalid="{{aria.subject}}" onInput="{{countSubject}}">
${FIELD_ERR('subject')}
</div>

<div class="field {{inv.message}}">
<label class="lbl" for="message">Your message</label>
<textarea id="message" name="message" class="inp" rows="8" aria-describedby="message-hint" aria-invalid="{{aria.message}}" onInput="{{countMessage}}"></textarea>
<div class="foot-row"><span id="message-hint">Plain text. Links are fine.</span><span data-message-count>{{messageCount}}</span></div>
${FIELD_ERR('message')}
</div>

<div class="hp" aria-hidden="true"><label>Leave this empty <input name="website" type="text" tabindex="-1" autocomplete="off"></label></div>
<input type="hidden" name="form-token" data-form-token value="">
<input type="hidden" name="submission" data-submission-id value="">
<input type="hidden" name="attempt" data-attempt value="0">
<div data-turnstile></div>

<div class="ct-send">
<button class="btn btn-solid" type="submit" data-submit disabled="{{sending}}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 21.7a.5.5 0 0 0 .94-.03L21.96 2.6a.5.5 0 0 0-.64-.64L2.33 8.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11z"></path><path d="m21.85 2.15-10.94 10.94"></path></svg>{{sendLabel}}</button>
<p class="note" data-submit-note aria-live="polite">{{note}}</p>
</div>
</form>

<div class="outcome {{outCls}}" data-outcome tabindex="-1" ref="{{outRef}}" aria-live="polite">
<p class="out-k {{out.kCls}}">{{out.kicker}}</p>
<h2 class="out-h" data-outcome-title>{{out.title}}</h2>
<p class="out-t" data-outcome-text>{{out.text}}</p>
<sc-if value="{{out.hasRef}}" hint-placeholder-val="{{ true }}"><p class="out-ref" data-outcome-reference>Reference<code data-outcome-reference-value>{{out.ref}}</code></p></sc-if>
<sc-if value="{{out.hasScr}}" hint-placeholder-val="{{ true }}"><p class="out-scr">{{out.scr}}</p></sc-if>
<div class="out-acts">
<sc-if value="{{out.retry}}" hint-placeholder-val="{{ false }}"><button class="btn btn-solid" type="button" data-retry onClick="{{retry}}">Try again</button></sc-if>
<sc-if value="{{out.fallback}}" hint-placeholder-val="{{ false }}"><a class="btn btn-line" data-fallback-email href="mailto:contact@wolfsblvt.works">Email contact@wolfsblvt.works</a></sc-if>
<sc-if value="{{out.home}}" hint-placeholder-val="{{ true }}"><a class="btn btn-line" data-outcome-home href="/" data-route="/">Back to the walk</a></sc-if>
<sc-if value="{{out.another}}" hint-placeholder-val="{{ true }}"><button class="btn-quiet" type="button" onClick="{{another}}">Write another</button></sc-if>
</div>
</div>
</div>
</div>
</div>
</main>`;

const CONTACT_CONSTS = String.raw`
const CATEGORIES = [
  { value: 'project', label: 'A project' }, { value: 'collaboration', label: 'Working together' }, { value: 'privacy', label: 'Privacy' },
  { value: 'legal', label: 'Legal information' }, { value: 'security', label: 'Security' }, { value: 'other', label: 'Something else' },
];
// The list is hand-ordered, so it can change by moving a line: the Works site first, then the projects in the order
// the walk shows them, then the pile's named pieces in Endless order, and the other sites last.
// reg: in the contract's PRODUCTS today. The others show how the list grows; they are not registered slugs yet.
const PRODUCTS = [
  { slug: 'wolfsblvt-works', label: 'Wolfsblvt Works website', type: 'Website', icon: 'works', reg: true },
  { slug: 'diffdevil', label: 'diffdevil', type: 'Tool', icon: 'diffdevil' },
  { slug: 'smolpng', label: 'smolpng', type: 'Tool' },
  { slug: 'shikkuri', label: 'Shikkuri', type: 'Project' },
  { slug: 'lunescence', label: 'Lunescence', type: 'Project' },
  { slug: 'xkcd-tracker', label: 'xkcd tracker', type: 'Extension' },
  { slug: 'openai-tunnel', label: 'OpenAI Tunnel auto-updater', type: 'Tool' },
  { slug: 'baumhaus', label: 'Baumhaus', type: 'Project' },
  { slug: 'rpgm-export', label: 'RPG Maker script export', type: 'Tool' },
  { slug: 'wolfsblvt-com', label: 'wolfsblvt.com website', type: 'Website', reg: true },
  { slug: 'agents', label: "Wolf's Agents", type: 'Website', reg: true },
];
const SUBJECT_MAX = 120;
const SAMPLE = { category: 'project', product: 'diffdevil', name: 'Ada', email: 'ada@example.com', subject: 'diffdevil counted my rename as 400 changed lines', message: 'Hi Wolf,\n\nI moved a folder in a PR and diffdevil labelled it XL. Is that on purpose? I kind of like that it noticed, but my reviewer panicked.\n\nAlso: the pile is great. I got the shortcut one today.' };
const fmt = new Intl.NumberFormat('en');
function makeRef() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return 'WW-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + s; }
`;

const CONTACT_METHODS = String.raw`
  formRef = React.createRef(); outRef = React.createRef(); sumRef = React.createRef();
  pageMount() { this.applyPreview(); }
  pageUpdate(prev) { if (prev.preview !== this.props.preview || prev.arrivedFrom !== this.props.arrivedFrom || prev.productList !== this.props.productList) this.applyPreview(); }
  productsShown() { return PRODUCTS.filter((p) => p.reg || (this.props.productList || 'everything') !== 'registered'); }
  findProduct(slug) { return this.productsShown().find((p) => p.slug === slug) || null; }
  // the canvas can show every state of the journey without typing
  applyPreview() {
    const mode = this.props.preview || 'live'; const f = this.formRef.current;
    const from = this.props.arrivedFrom || 'none';
    const s = { errors: {}, showSummary: false, outcome: null, sending: false, product: from !== 'none' && this.findProduct(from) ? from : '', comboOpen: false, comboText: '', yoru2: 'sit', ref: '' };
    if (f) {
      f.reset();
      if (mode !== 'live') {
        const set = (n, v) => { const el = f.elements.namedItem(n); if (el) el.value = v; };
        const r = f.querySelector('input[name=category][value=' + SAMPLE.category + ']'); if (r) r.checked = true;
        ['name', 'email', 'subject', 'message'].forEach((k) => set(k, SAMPLE[k]));
        if (!s.product && this.findProduct(SAMPLE.product)) s.product = SAMPLE.product;
      }
      if (mode === 'errors') {
        const r = f.querySelector('input[name=category]:checked'); if (r) r.checked = false;
        f.elements.namedItem('email').value = 'ada@example'; f.elements.namedItem('subject').value = '';
        s.errors = this.validate(); s.showSummary = true;
      }
    }
    if (mode === 'sent' || mode === 'copy-failed' || mode === 'failed') { s.outcome = mode === 'copy-failed' ? 'sent-copy-failed' : mode; s.ref = makeRef(); s.yoru2 = mode === 'failed' ? 'sit' : 'away'; }
    s.subjectLen = f ? [...f.elements.namedItem('subject').value].length : 0;
    s.messageLen = f ? [...f.elements.namedItem('message').value].length : 0;
    this.setState(s);
  }
  validate() {
    const f = this.formRef.current; const e = {}; if (!f) return e;
    const v = (n) => { const el = f.elements.namedItem(n); return el && el.value ? String(el.value).trim() : ''; };
    if (!v('category')) e.category = 'Choose what the message is about.';
    const email = v('email');
    if (!email) e.email = 'Enter the email address replies should go to.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    const subject = v('subject');
    if (!subject) e.subject = 'Enter a subject.';
    else if ([...subject].length > SUBJECT_MAX) e.subject = 'Keep the subject to ' + SUBJECT_MAX + ' characters.';
    if (!v('message')) e.message = 'Write a message.';
    return e;
  }
  submit = (ev) => {
    ev.preventDefault(); if (this.state.sending) return;
    const errors = this.validate();
    if (Object.keys(errors).length) { this.setState({ errors, showSummary: true }); this._t.push(setTimeout(() => { if (this.sumRef.current) this.sumRef.current.focus(); }, 30)); return; }
    this.setState({ errors: {}, showSummary: false, sending: true });
    this._t.push(setTimeout(() => {
      const outcome = this.props.outcome || 'sent'; const ok = outcome !== 'failed';
      this.setState({ sending: false, outcome, ref: makeRef(), yoru2: ok && !this._reduce ? 'flee' : 'sit' });
      if (ok) this._t.push(setTimeout(() => this.setState({ yoru2: 'away' }), 1650));
      this._t.push(setTimeout(() => { if (this.outRef.current) this.outRef.current.focus(); }, 40));
    }, 1300));
  };
  retry = () => { this.setState({ outcome: null, yoru2: 'sit' }); this._t.push(setTimeout(() => { const m = document.getElementById('message'); if (m) m.focus(); }, 30)); };
  another = () => { const f = this.formRef.current; if (f) f.reset(); this.setState({ outcome: null, product: '', subjectLen: 0, messageLen: 0, yoru2: 'sit', errors: {} }); };
  clearField = (e) => { const k = e.target.name; if (this.state.errors[k]) this.setState((s) => { const n = Object.assign({}, s.errors); delete n[k]; return { errors: n }; }); };
  clearCategory = () => { if (this.state.errors.category) this.setState((s) => { const n = Object.assign({}, s.errors); delete n.category; return { errors: n }; }); };
  countSubject = (e) => { this.setState({ subjectLen: [...e.target.value].length }); this.clearField(e); };
  countMessage = (e) => { this.setState({ messageLen: [...e.target.value].length }); this.clearField(e); };
  noop = () => {};
  // the project picker: a searchable listbox in front of the contract's native select
  comboOpts() {
    const q = (this.state.comboText || '').trim().toLowerCase();
    return this.productsShown().filter((p) => !q || p.label.toLowerCase().indexOf(q) >= 0 || p.slug.indexOf(q) >= 0);
  }
  pickProduct(slug) { this.setState({ product: slug, comboOpen: false, comboText: '', comboActive: 0 }); }
  comboInput = (e) => this.setState({ comboText: e.target.value, comboOpen: true, comboActive: 0 });
  comboFocus = () => this.setState({ comboOpen: true, comboText: '', comboActive: Math.max(0, this.comboOpts().findIndex((p) => p.slug === this.state.product)) });
  comboBlur = () => { this._t.push(setTimeout(() => this.setState({ comboOpen: false, comboText: '' }), 120)); };
  comboKey = (e) => {
    const opts = this.comboOpts(); const a = this.state.comboActive || 0;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.setState({ comboOpen: true, comboActive: Math.min(opts.length - 1, a + 1) }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.setState({ comboActive: Math.max(0, a - 1) }); }
    else if (e.key === 'Enter') { if (this.state.comboOpen && opts[a]) { e.preventDefault(); this.pickProduct(opts[a].slug); } }
    else if (e.key === 'Escape') { this.setState({ comboOpen: false, comboText: '' }); }
  };
  comboClear = () => this.setState({ product: '', comboText: '' });
  iconOf(p) { return p ? { dd: p.icon === 'diffdevil', wk: p.icon === 'works', ph: !p.icon, initial: p.label.replace(/^Wolf's /, '').charAt(0).toUpperCase() } : { dd: false, wk: false, ph: false, initial: '' }; }

  pageVals() {
    const err = this.state.errors || {}; const shown = this.state.showSummary && Object.keys(err).length > 0;
    const order = ['category', 'name', 'email', 'subject', 'message'];
    const errList = order.filter((k) => err[k]).map((k) => ({ msg: err[k], href: '#' + k, go: (e) => { e.preventDefault(); const el = document.getElementById(k); if (el) el.focus(); } }));
    const inv = {}, aria = {}; order.forEach((k) => { inv[k] = err[k] ? 'field-invalid' : ''; aria[k] = err[k] ? 'true' : 'false'; });
    const cur = this.findProduct(this.state.product); const opts = this.comboOpts(); const a = this.state.comboActive || 0;
    const from = this.findProduct(this.props.arrivedFrom || 'none');
    const o = this.state.outcome; const email = (() => { const f = this.formRef.current; const el = f && f.elements.namedItem('email'); return (el && el.value) || 'you@example.com'; })();
    const OUT = {
      sent: { kicker: 'Sent', title: 'Thanks. Your message is on its way.', text: 'Your message reached the inbox and a copy was emailed to ' + email + '. Nobody has necessarily read it yet, and there is no promised response time.', scr: 'Yoru’s delivering it. mostly reliable.', home: true, another: true },
      'sent-copy-failed': { kicker: 'Sent, mostly', title: 'It reached me. Your copy didn’t.', text: 'Your message reached the inbox, but the copy to ' + email + ' could not be emailed. Keep the reference ' + this.state.ref + ' for your records.', scr: 'the part that matters made it.', home: true, another: true },
      failed: { kicker: 'Not sent', kCls: 'bad', title: 'Your message was not sent.', text: 'The message was not sent; nothing reached the inbox. Your text is kept in the form. Retry, or email contact@wolfsblvt.works directly and mention ' + this.state.ref + '.', retry: true, fallback: true },
    }[o] || {};
    const y2 = this.state.yoru2 || 'sit';
    return {
      formRef: this.formRef, outRef: this.outRef, sumRef: this.sumRef, submit: this.submit, retry: this.retry, another: this.another,
      clearField: this.clearField, clearCategory: this.clearCategory, countSubject: this.countSubject, countMessage: this.countMessage, noop: this.noop,
      productsJson: JSON.stringify(Object.fromEntries(PRODUCTS.filter((p) => p.reg).map((p) => [p.slug, p.label]))),
      cats: CATEGORIES.map((c, i) => ({ value: c.value, label: c.label, id: i === 0 ? 'category' : 'category-' + c.value })),
      err, inv, aria, errList, sumCls: shown ? '' : 'is-hidden', sumTitle: errList.length === 1 ? 'Please check one field.' : 'Please check ' + errList.length + ' fields.',
      subjectCount: fmt.format(this.state.subjectLen || 0) + ' / ' + SUBJECT_MAX, subjectOverCls: (this.state.subjectLen || 0) > SUBJECT_MAX ? 'over' : '',
      messageCount: fmt.format(this.state.messageLen || 0) + ' ' + ((this.state.messageLen || 0) === 1 ? 'character' : 'characters'),
      sending: !!this.state.sending, sendLabel: this.state.sending ? 'Sending…' : 'Send it', note: this.state.sending ? 'Sending…' : '',
      formCls: o ? 'is-hidden' : '', outCls: o ? '' : 'is-hidden',
      out: { kicker: OUT.kicker || '', kCls: OUT.kCls || '', title: OUT.title || '', text: OUT.text || '', ref: this.state.ref, hasRef: !!this.state.ref, scr: OUT.scr || '', hasScr: !!OUT.scr, retry: !!OUT.retry, fallback: !!OUT.fallback, home: !!OUT.home, another: !!OUT.another },
      from: Object.assign({ show: !!from && !o, label: from ? from.label : '' }, this.iconOf(from)),
      combo: {
        open: !!this.state.comboOpen, expanded: this.state.comboOpen ? 'true' : 'false', text: this.state.comboOpen ? this.state.comboText : (cur ? cur.label : ''),
        hasValue: !!cur && !this.state.comboOpen, noValue: !cur || !!this.state.comboOpen, cur: this.iconOf(cur), slug: this.state.product || '',
        active: this.state.comboOpen && opts[a] ? 'opt-' + opts[a].slug : '', none: opts.length === 0,
        input: this.comboInput, focus: this.comboFocus, blur: this.comboBlur, key: this.comboKey, clear: this.comboClear,
        all: this.productsShown().map((p) => ({ slug: p.slug, label: p.label })),
        opts: opts.map((p, i) => Object.assign({ id: 'opt-' + p.slug, label: p.label, type: p.type, isSel: p.slug === this.state.product, sel: p.slug === this.state.product ? 'true' : 'false', cls: (i === a ? 'active ' : '') + (p.slug === this.state.product ? 'sel' : ''), pick: (e) => { e.preventDefault(); this.pickProduct(p.slug); } }, this.iconOf(p))),
      },
      yoru2Cls: y2 === 'flee' ? 'out' : y2 === 'away' ? 'away' : '', yoru2Anim: y2 === 'flee' ? 's-runR' : 's-idle',
    };
  }
`;

// ---------- the rooms ----------
const TWEAK_WALK = { walkIntensity: { editor: 'enum', default: 'quiet', options: ['quiet', 'standard'], section: 'The Walk' }, markTop: { editor: 'range', default: 60, min: 44, max: 80, step: 2, unit: 'px', section: 'Marks' } };
const PAGES = [
  {
    file: 'Privacy.dc.html', title: 'Privacy and data · Wolfsblvt Works', noindex: true,
    page: { kind: 'privacy', loc: 'Privacy and data', seed: 0x57414C4B, toc: [
      { id: 'controller', title: 'Who is responsible' }, { id: 'hosting', title: 'Hosting and delivery' }, { id: 'storage', title: 'Your browser and this site' },
      { id: 'contact', title: 'When you write to me' }, { id: 'links', title: 'Links to other places' }, { id: 'rights', title: 'Your rights' },
      { id: 'object', title: 'Your right to object' }, { id: 'mine', title: 'My rights' }, { id: 'changes', title: 'When this changes' } ] },
    header: HEADER_FULL, body: PRIVACY_BODY, footer: FOOTER_FULL,
    props: { fixtures: { editor: 'boolean', default: true, section: 'Fixtures' }, ...TWEAK_WALK, $preview: { width: 1440, height: 3600 } },
  },
  {
    file: 'Impressum.dc.html', title: 'Impressum · Wolfsblvt Works', noindex: true,
    page: { kind: 'impressum', loc: 'Impressum', seed: 0x57414C4B, toc: [] },
    header: HEADER_FULL, body: IMPRESSUM_BODY, footer: FOOTER_FULL,
    props: { fixtures: { editor: 'boolean', default: true, section: 'Fixtures' }, addressCard: { editor: 'enum', default: 'paper', options: ['paper', 'plain'], section: 'Provider' }, ...TWEAK_WALK, $preview: { width: 1440, height: 1700 } },
  },
  {
    file: 'Contact.dc.html', title: 'Contact · Wolfsblvt Works', noindex: false,
    page: { kind: 'contact', loc: 'Contact', navOn: 'hello', seed: 0x57414C4B, toc: [] },
    header: HEADER_FULL, body: CONTACT_BODY, footer: FOOTER_FULL, css: CSS_CONTACT, consts: CONTACT_CONSTS, methods: CONTACT_METHODS,
    props: {
      preview: { editor: 'enum', default: 'live', options: ['live', 'filled', 'errors', 'sent', 'copy-failed', 'failed'], section: 'State' },
      outcome: { editor: 'enum', default: 'sent', options: ['sent', 'sent-copy-failed', 'failed'], section: 'State' },
      arrivedFrom: { editor: 'enum', default: 'none', options: ['none', 'diffdevil', 'agents', 'smolpng'], section: 'State' },
      productList: { editor: 'enum', default: 'everything', options: ['everything', 'registered'], section: 'Projects' },
      ...TWEAK_WALK, $preview: { width: 1440, height: 1700 },
    },
  },
  {
    file: 'NotFound.dc.html', title: 'Not found · Wolfsblvt Works', noindex: true,
    page: { kind: 'notfound', loc: '', seed: 0x57414C4B, toc: [] },
    header: HEADER_FULL, body: NOTFOUND_BODY, footer: FOOTER_FULL,
    props: {
      headline: { editor: 'enum', default: 'path', options: ['path', 'yet', 'wander'], section: 'Copy' },
      path: { editor: 'enum', default: '/pile/a-thing-that-moved', options: ['/pile/a-thing-that-moved', '/blog/2019/hello-world', '/smolpng/docs/old-page'], section: 'Copy' },
      pathEnd: { editor: 'enum', default: 'fray', options: ['fray', 'continue'], section: 'The Walk' }, ...TWEAK_WALK, $preview: { width: 1440, height: 1320 },
    },
  },
  {
    file: 'ServerError.dc.html', title: 'Temporarily unavailable · Wolfsblvt Works', noindex: true,
    page: { kind: 'error', loc: '', seed: 0x57414C4B, toc: [] },
    header: HEADER_BARE, body: ERROR_BODY, footer: '',
    props: { ...TWEAK_WALK, $preview: { width: 1440, height: 900 } },
  },
];

for (const p of PAGES) {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="color-scheme" content="dark">
<meta name="darkreader-lock">
<title>${p.title}</title>
${p.noindex ? '<meta name="robots" content="noindex, nosnippet">\n' : ''}<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
${FONTS}
<style>
${CSS_BASE}${CSS_SPRITES}${CSS_BTN}${CSS_FOOT}${CSS_SUB}${p.css || ''}
</style>
</helmet>

<div class="root" ref="{{rootRef}}" onClick="{{rootClick}}">
${WALK}
<div ref="{{contentRef}}">
${p.header}
${p.body}
${p.footer}
${TOAST}
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='${JSON.stringify(p.props)}'>
const PAGE = ${JSON.stringify(p.page)};
${(p.consts || '') + SCRIPT.replace('/*PAGE_METHODS*/', p.methods || '')}
</script>
</body>
</html>
`;
  writeFileSync(join(ROOT, 'project', p.file), html.replace(/\/_blob\/a9e26be4b3cd29986bf387744e64c0e8/g, SPRITE));
  console.log('wrote', p.file, html.length);
}
