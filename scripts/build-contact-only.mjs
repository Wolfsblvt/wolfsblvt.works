// The contact-first launch build. The first publication step routes only contact.wolfsblvt.works, before the legal
// operator's additional-direct-contact pointer can truthfully say "provisioned" (that pointer is the live form). A
// build from this source carries the whole site, fixture legal pages included, so this step must not deploy it.
// This script runs the ordinary build, then keeps only what the contact page needs and checks that nothing else is
// left: no home, no legal pages, no sitemap, no operator data. Wolf Ops deploys the result with the contact host
// routed and nothing else; the publication build (`npm run build:production`) follows once the form is read back.
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLegalOperator } from '../src/lib/legal-operator.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'artifacts/site');

try {
  execSync('npm run build', { stdio: 'inherit', cwd: root, windowsHide: true });
} catch (error) {
  process.exit(error.status ?? 1);
}

/** What the contact page, the 404 and the 503 need; everything else goes. */
const KEEP = [
  /^contact\/index\.html$/,
  /^404\.html$/,
  /^503\.html$/,
  /^_headers$/,
  /^robots\.txt$/,
  /^_astro\//,
  /^fonts\//,
  /^yoru\//,
  /^favicon(-192)?\.(svg|png)$/,
  /^apple-touch-icon\.png$/,
  /^social\/contact\.png$/,
];

const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? files(path) : [path];
});
const keep = (path) => KEEP.some((pattern) => pattern.test(path));

let removed = 0;
for (const file of files(out)) {
  const path = relative(out, file).replaceAll('\\', '/');
  if (keep(path)) continue;
  rmSync(file);
  removed++;
}
// Empty folders left behind
for (const name of readdirSync(out)) {
  const path = join(out, name);
  if (statSync(path).isDirectory() && files(path).length === 0) rmSync(path, { recursive: true });
}
// The home page is not here: say so to crawlers instead of pointing them at a sitemap that is gone.
writeFileSync(join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const failures = [];
if (!existsSync(join(out, 'contact/index.html'))) failures.push('contact/index.html is missing.');
for (const gone of ['index.html', 'impressum/index.html', 'privacy/index.html', 'sitemap-index.xml', 'sitemap-0.xml', 'brand']) {
  if (existsSync(join(out, gone))) failures.push(`${gone} is still in the contact-only build.`);
}
const operator = loadLegalOperator();
const values = [operator.legalName, operator.postalAddress.streetAddress].filter(Boolean);
for (const file of files(out)) {
  if (!/\.(html|xml|txt|json|js|css)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  for (const value of values) if (text.includes(value)) failures.push(`${relative(out, file)} contains legal-operator data.`);
}
if (failures.length) {
  console.error(`Contact-only build refused:\n${failures.map((f) => `  - ${f}`).join('\n')}`);
  process.exit(1);
}
console.log(`Contact-only build: ${removed} files removed; artifacts/site holds the contact page, its assets, the 404 and the 503.`);
