// Checks the built site in artifacts/site for the identity and discovery contract that every build must keep,
// fixture or not: titles and canonicals, legal pages out of the index and the sitemap, social cards only where they
// belong, a self-contained 503, the generated identity assets and headers, and operator data only on the two legal
// pages. Run after `npm run build`; `npm run check` does both.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { loadLegalOperator } from '../src/lib/legal-operator.mjs';

const out = fileURLToPath(new URL('../artifacts/site/', import.meta.url));
const failures = [];
const fail = (message) => failures.push(message);

if (!existsSync(join(out, 'index.html'))) {
  console.error('artifacts/site has no build. Run `npm run build` first.');
  process.exit(1);
}

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const read = (path) => readFileSync(join(out, path), 'utf8');
const pages = files(out)
  .map((file) => relative(out, file).replaceAll('\\', '/'))
  .filter((path) => path.endsWith('.html'));

const metaRobots = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? null;
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
const ogImage = (html) => html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? null;

const EXPECTED = {
  'index.html': { robots: null, canonical: `${site.url}/`, card: `${site.url}/social/home.png` },
  'contact/index.html': { robots: null, canonical: site.contactUrl, card: `${site.url}/social/contact.png` },
  'impressum/index.html': { robots: 'noindex, nosnippet', canonical: `${site.url}/impressum/`, card: null },
  'privacy/index.html': { robots: 'noindex, nosnippet', canonical: `${site.url}/privacy/`, card: null },
  '404.html': { robots: 'noindex', canonical: null, card: null },
};

for (const [path, expected] of Object.entries(EXPECTED)) {
  if (!pages.includes(path)) {
    fail(`${path} is missing from the build.`);
    continue;
  }
  const html = read(path);
  if (!/<title>[^<]+<\/title>/.test(html)) fail(`${path} has no <title>.`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) fail(`${path} has no description.`);
  if (!html.includes('<meta name="darkreader-lock"')) fail(`${path} does not declare darkreader-lock.`);
  if (metaRobots(html) !== expected.robots) fail(`${path} robots is ${metaRobots(html)}, expected ${expected.robots}.`);
  if (canonical(html) !== expected.canonical) fail(`${path} canonical is ${canonical(html)}, expected ${expected.canonical}.`);
  if (ogImage(html) !== expected.card) fail(`${path} social card is ${ogImage(html)}, expected ${expected.card}.`);
  if (expected.card && !existsSync(join(out, new URL(expected.card).pathname))) fail(`${path} points at a missing card ${expected.card}.`);
}

for (const path of pages.filter((p) => !(p in EXPECTED) && p !== '503.html')) {
  fail(`${path} is a page this check does not know; add its expected identity to scripts/check-output.mjs.`);
}

// The sitemap lists the walk and nothing that is noindex or lives on another host.
const sitemap = existsSync(join(out, 'sitemap-0.xml')) ? read('sitemap-0.xml') : '';
if (!existsSync(join(out, 'sitemap-index.xml')) || !sitemap) fail('The sitemap is missing.');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!locs.includes(`${site.url}/`)) fail('The sitemap does not list the home page.');
for (const loc of locs) {
  if (/\/(impressum|privacy|contact|404)\//.test(loc)) fail(`The sitemap lists ${loc}.`);
}

const robots = existsSync(join(out, 'robots.txt')) ? read('robots.txt') : '';
if (!robots.includes(`Sitemap: ${site.url}/sitemap-index.xml`)) fail('robots.txt does not point at the sitemap.');
if (/Disallow:\s*\/(impressum|privacy)/.test(robots)) fail('robots.txt blocks a legal page; crawlers must be able to read its noindex.');

// The 503 is Cloudflare's custom error page: it must work while the site itself is down.
const unavailable = existsSync(join(out, '503.html')) ? read('503.html') : '';
if (!unavailable) fail('503.html is missing.');
if (/<script/i.test(unavailable)) fail('503.html contains a script.');
if (/<link[^>]+rel="(stylesheet|preload)"/i.test(unavailable) || /@font-face|\/_astro\/|\/fonts\//.test(unavailable)) {
  fail('503.html depends on site assets or web fonts.');
}
if (/(href|src)="\/(?!\/)/.test(unavailable)) fail('503.html uses a site-relative link; links there must be absolute.');

for (const asset of ['favicon.svg', 'favicon-192.png', 'apple-touch-icon.png', 'yoru/sheet-1x.webp', 'yoru/sheet-2x.webp']) {
  if (!existsSync(join(out, asset))) fail(`${asset} is missing.`);
}

const headers = existsSync(join(out, '_headers')) ? read('_headers') : '';
if (!headers.includes('Content-Security-Policy:')) fail('_headers has no Content-Security-Policy.');
for (const route of ['/impressum/*', '/privacy/*']) {
  if (!new RegExp(`^${route.replace('*', '\\*')}\\n  X-Robots-Tag: noindex, nosnippet`, 'm').test(headers)) fail(`_headers does not mark ${route} noindex, nosnippet.`);
}

// Operator data appears on the two legal pages and nowhere else in the output.
const operator = loadLegalOperator();
const operatorValues = [operator.legalName, operator.postalAddress.streetAddress].filter(Boolean);
const LEGAL = new Set(['impressum/index.html', 'privacy/index.html']);
for (const file of files(out)) {
  const path = relative(out, file).replaceAll('\\', '/');
  if (LEGAL.has(path) || !/\.(html|xml|txt|json|js|css|webmanifest)$/.test(path) || path === '_headers') continue;
  const text = readFileSync(file, 'utf8');
  for (const value of operatorValues) {
    if (text.includes(value)) fail(`${path} contains legal-operator data; it belongs only on the legal pages.`);
  }
}

if (failures.length) {
  console.error(`Output check failed:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`Output check passed: ${pages.length} pages, ${locs.length} sitemap entr${locs.length === 1 ? 'y' : 'ies'}.`);
