/**
 * The 503, served as Cloudflare's custom error page when the site itself is down. It must work without the site:
 * inline CSS, no web fonts, no scripts, Yoru inlined, and links only to places that still work. Built to
 * /503.html; it is never part of the sitemap and is not indexed.
 */
import type { APIRoute } from 'astro';
import site from '../../site.config.mjs';
import { YORU_DOZE } from '../generated/yoru-doze';
import { footerLockup } from '../lib/marks';

const lockup = footerLockup('ek-').replace('class="mark-foot"', 'class="mark" style="height:44px;width:auto;display:block"');

const css = `
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;background:#100b11;color:#f3e8dc}
body{min-height:100vh;font:18px/1.55 Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;background:linear-gradient(160deg,#100b11 0%,#181018 52%,#0c1217 100%);display:flex;flex-direction:column}
a{color:#f3e8dc}a:hover{color:#73cae3}
:focus-visible{outline:2px solid #73cae3;outline-offset:3px;border-radius:3px}
.frame{width:min(100% - 2*clamp(1rem,2.5vw,2rem),80rem);margin-inline:auto}
header{border-bottom:1px solid rgb(243 232 220 / 7%)}
header .frame{height:62px;display:flex;align-items:center}
.walk{position:fixed;inset:0;pointer-events:none;z-index:0;background:radial-gradient(60% 120% at 0% 40%,rgb(236 165 87 / 14%),transparent 60%),radial-gradient(60% 120% at 100% 60%,rgb(219 97 170 / 15%),transparent 60%)}
main{position:relative;z-index:1;flex:1;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:40px;align-items:start;padding:clamp(64px,12vh,140px) 0 40px}
@media (max-width:820px){main{grid-template-columns:1fr}}
.kicker{margin:0 0 22px;font:12.5px system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#c0b0b1}
h1{margin:0;font-weight:300;font-size:clamp(46px,6.2vw,96px);line-height:.95;letter-spacing:-.035em;max-width:15ch}
.note{margin:34px 0 0;font:500 clamp(18px,1.8vw,24px)/1.15 'Segoe Print','Bradley Hand','Comic Sans MS',cursive;color:#ef8ea1;transform:rotate(-3deg);transform-origin:0 50%}
.lead{margin:30px 0 0;max-width:44ch;font-size:clamp(19px,1.6vw,23px);line-height:1.5;color:#d1c0b8}
.acts{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:34px}
.btn{display:inline-flex;align-items:center;min-height:44px;padding:0 20px;border-radius:999px;font:600 15px system-ui,sans-serif;text-decoration:none}
.solid{background:#f3e8dc;color:#100b11}.solid:hover{color:#100b11}
.line{border:1px solid rgb(243 232 220 / 24%);color:#f3e8dc}.line:hover{border-color:#73cae3;color:#73cae3}
.quiet{font:14.5px system-ui,sans-serif;color:#d1c0b8;margin-left:6px}
.yoru{position:relative;align-self:end;margin:0 clamp(0px,5vw,80px) 30px 0;display:flex;flex-direction:column;align-items:center}
@media (max-width:820px){.yoru{justify-self:end;margin-right:24px}}
.yoru img{display:block;width:96px;height:104px}
.ground{width:150px;border-top:1px solid rgb(243 232 220 / 16%)}
.cap{position:absolute;right:calc(100% - 20px);bottom:58px;font:500 16px/1.25 'Segoe Print','Bradley Hand','Comic Sans MS',cursive;color:#ef8ea1;white-space:nowrap;transform:rotate(-4deg)}
@media (max-width:640px){.cap{right:-10px;bottom:118px}}
.mini{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center;padding:28px 0 34px;border-top:1px solid rgb(243 232 220 / 10%);font:13.5px system-ui,sans-serif;color:#9c8c93}
.mini a{color:#d1c0b8;text-decoration:none}.mini a:hover{color:#73cae3}
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="darkreader-lock">
<meta name="robots" content="noindex">
<meta name="theme-color" content="${site.themeColor}">
<title>Something broke · ${site.title}</title>
<style>${css}</style>
</head>
<body>
<div class="walk" aria-hidden="true"></div>
<header><div class="frame"><a href="${site.url}/" aria-label="Wolfsblvt Works, home">${lockup}</a></div></header>
<main class="frame">
<div>
<p class="kicker">503 · temporarily unavailable</p>
<h1>Something broke. On our side.</h1>
<p class="note">it’s not you. probably something I did.</p>
<p class="lead">The site should be back shortly. Try again in a minute. If it stays like this, I’d like to know.</p>
<div class="acts">
<a class="btn solid" href="">Try again</a>
<a class="btn line" href="${site.links.maker}">Find me on wolfsblvt.com</a>
<a class="quiet" href="mailto:${site.contact.inbox}">${site.contact.inbox}</a>
</div>
</div>
<div class="yoru">
<span class="cap" aria-hidden="true">Yoru is looking into it.</span>
<img src="${YORU_DOZE}" alt="Yoru, asleep" width="96" height="104">
<div class="ground"></div>
</div>
</main>
<div class="frame"><div class="mini"><span style="color:#d1c0b8;font-weight:600">${site.title}</span><span>·</span><a href="${site.url}/impressum/">Impressum</a><a href="${site.url}/privacy/">Privacy and data</a></div></div>
</body>
</html>
`;

export const GET: APIRoute = () => new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
