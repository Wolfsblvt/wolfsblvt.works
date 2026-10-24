// Checks the built site in artifacts/site for the identity and discovery contract that every build must keep,
// fixture or not: titles and canonicals, legal pages out of the index and the sitemap, social cards only where they
// belong, a self-contained 503, the generated identity assets and headers, and operator data only on the two legal
// pages. Run after `npm run build`; `npm run check` does both.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { loadLegalOperator } from '../src/lib/legal-operator.mjs';
import { validateBrandBundle } from '../tools/brand-bundle/scripts/validate-brand-bundle.mjs';

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
  // This exact HTML file is downloadable template source, not a visitor page. It remains in the data-leak scan below.
  .filter((path) => path.endsWith('.html') && path !== 'brand/works/components/works-sponsor.html');

const mirror = await validateBrandBundle(join(out, 'brand', 'works'));
const sourceBundle = JSON.parse(readFileSync(new URL('../brand/bundle/works/manifest.json', import.meta.url), 'utf8'));
if (mirror.manifest.bundleSha256 !== sourceBundle.bundleSha256) fail('Served Works mirror differs from the committed bundle.');

const metaRobots = (html) => html.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? null;
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
const ogImage = (html) => html.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? null;

const EXPECTED = {
  'index.html': {
    title: site.title,
    description: site.description,
    socialTitle: site.title,
    robots: null, canonical: `${site.url}/`, card: `${site.url}/social/home.png`, sitemap: true,
  },
  'contact/index.html': {
    title: `Contact · ${site.title}`,
    description: 'Arriving with a thought? Whatever’s on your mind, I’d like to hear it. Write to Wolf at Wolfsblvt Works.',
    socialTitle: 'Contact',
    robots: null, canonical: site.contactUrl, card: `${site.url}/social/contact.png`, sitemap: false,
  },
  'impressum/index.html': {
    title: `Impressum · ${site.title}`,
    description: 'Provider and contact information for wolfsblvt.works.',
    socialTitle: null,
    robots: 'noindex, nosnippet', canonical: `${site.url}/impressum/`, card: null, sitemap: false,
  },
  'privacy/index.html': {
    title: `Privacy and data · ${site.title}`,
    description: 'What happens to your data when you visit wolfsblvt.works, and how to reach me about it.',
    socialTitle: null,
    robots: 'noindex, nosnippet', canonical: `${site.url}/privacy/`, card: null, sitemap: false,
  },
  '404.html': {
    title: `Off the path · ${site.title}`,
    description: 'This address doesn’t lead anywhere on wolfsblvt.works.',
    socialTitle: null,
    robots: 'noindex', canonical: null, card: null, sitemap: false,
  },
  '503.html': {
    title: `Something broke · ${site.title}`,
    description: 'The site should be back shortly. Try again in a minute.',
    socialTitle: null,
    robots: 'noindex', canonical: null, card: null, sitemap: false,
  },
};

// Exact values and cardinality catch a wrong page identity as well as a missing or duplicate tag.
function checkValues(path, label, actual, expected) {
  const values = expected === null ? [] : [expected];
  if (JSON.stringify(actual) !== JSON.stringify(values)) {
    fail(`${path} ${label} is ${JSON.stringify(actual)}, expected ${JSON.stringify(values)}.`);
  }
}

for (const [path, expected] of Object.entries(EXPECTED)) {
  if (!pages.includes(path)) {
    fail(`${path} is missing from the build.`);
    continue;
  }
  const html = read(path);
  checkValues(path, 'title', [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]), expected.title);
  const meta = (attribute, name) => [...html.matchAll(new RegExp(`<meta ${attribute}="${name}" content="([^"]*)"`, 'g'))].map((m) => m[1]);
  checkValues(path, 'description', meta('name', 'description'), expected.description);
  checkValues(path, 'og:title', meta('property', 'og:title'), expected.socialTitle);
  checkValues(path, 'og:description', meta('property', 'og:description'), expected.socialTitle ? expected.description : null);
  checkValues(path, 'twitter:title', meta('name', 'twitter:title'), expected.socialTitle);
  checkValues(path, 'twitter:description', meta('name', 'twitter:description'), expected.socialTitle ? expected.description : null);
  checkValues(path, 'twitter:image', meta('name', 'twitter:image'), expected.card);
  if (!html.includes('<meta name="darkreader-lock"')) fail(`${path} does not declare darkreader-lock.`);
  if (metaRobots(html) !== expected.robots) fail(`${path} robots is ${metaRobots(html)}, expected ${expected.robots}.`);
  if (canonical(html) !== expected.canonical) fail(`${path} canonical is ${canonical(html)}, expected ${expected.canonical}.`);
  if (ogImage(html) !== expected.card) fail(`${path} social card is ${ogImage(html)}, expected ${expected.card}.`);
  if (expected.card && !existsSync(join(out, new URL(expected.card).pathname))) fail(`${path} points at a missing card ${expected.card}.`);
}

for (const path of pages.filter((p) => !(p in EXPECTED))) {
  fail(`${path} is a page this check does not know; add its expected identity to scripts/check-output.mjs.`);
}

// The production sponsor section must have real markup and configured destinations.
const home = read('index.html');
if (!home.includes('data-sponsor') || !home.includes('class="works-sponsor host-works"')) fail('Home is missing its production sponsor component.');
for (const [name, url] of Object.entries(site.sponsors)) {
  if (!home.includes(`href="${url}"`)) fail(`Home is missing the configured ${name} sponsor destination.`);
}
if (/href="#(?:github-sponsors|ko-fi)"/.test(home)) fail('Home contains demonstration sponsor links.');

// The sitemap lists only the walk: Contact, both legal pages, 404.html and 503.html are explicitly excluded above.
const sitemap = existsSync(join(out, 'sitemap-0.xml')) ? read('sitemap-0.xml') : '';
if (!existsSync(join(out, 'sitemap-index.xml')) || !sitemap) fail('The sitemap is missing.');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapPages = Object.values(EXPECTED).filter((page) => page.sitemap).map((page) => page.canonical);
for (const loc of sitemapPages) {
  if (!locs.includes(loc)) fail(`The sitemap does not list ${loc}.`);
}
for (const loc of locs) {
  if (!sitemapPages.includes(loc)) fail(`The sitemap lists excluded or unknown page ${loc}.`);
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

for (const asset of ['favicon.svg', 'favicon-192.png', 'apple-touch-icon.png', 'yoru/resident/presence-1x.webp', 'yoru/resident/sleep-2x.webp']) {
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
