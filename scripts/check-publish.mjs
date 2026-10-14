// The publication gate. A public build must carry the real legal operator, real Pile pieces and project windows, and
// confirmed privacy facts; this refuses while any fixture, illustrative or pending material remains, and lists the
// manual publication steps it cannot verify from here. `npm run build:production` runs it after a build with
// WORKS_PUBLICATION=1; run it on its own to see what still stands between the source and publication.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../site.config.mjs';
import { loadLegalOperator } from '../src/lib/legal-operator.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'artifacts/site');
const refusals = [];
const refuse = (message) => refusals.push(message);

// Legal operator: the private projection must be present, well-formed and publishable.
try {
  loadLegalOperator({ requireProduction: true });
} catch (error) {
  refuse(`Legal operator: ${error.message}`);
}

// Privacy and data: every hosting fact has to be confirmed against the deployed setup before it is stated as true.
for (const [key, entry] of Object.entries(site.legal.privacy)) {
  if (entry.pending) refuse(`Privacy fact "${key}" is still pending (site.config.mjs legal.privacy.${key}).`);
}

// Pile: no illustrative pieces and no example links.
const pileDir = join(root, 'src/content/pile');
for (const name of readdirSync(pileDir).filter((n) => n.endsWith('.md'))) {
  const source = readFileSync(join(pileDir, name), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  if (/^illustrative:\s*true\s*$/m.test(frontmatter)) refuse(`Pile piece ${name} is illustrative.`);
  if (/https?:\/\/(www\.)?example\.(com|org|net|invalid)/.test(source)) refuse(`Pile piece ${name} links to an example address.`);
}

// Edge configuration: the production contact service needs its real Turnstile widget.
const wrangler = readFileSync(join(root, 'wrangler.jsonc'), 'utf8');
if (wrangler.includes('REPLACE_WITH_')) refuse('wrangler.jsonc still carries a REPLACE_WITH_ placeholder (production Turnstile site key).');

// Dependencies: every package, the icons above all, resolves from the registry, never a local path.
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
for (const [name, spec] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
  if (/^(file|link|git|github):|^[./]|^[A-Za-z]:/.test(spec)) refuse(`Dependency ${name} resolves from ${spec}, not the registry.`);
}

// Built output: no placeholder windows, fixture highlights or illustrative markers reach the public pages.
if (!existsSync(join(out, 'index.html'))) {
  refuse('artifacts/site has no build to inspect. Run this through `npm run build:production`.');
} else {
  const html = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? html(path) : name.endsWith('.html') ? [path] : [];
    });
  for (const file of html(out)) {
    const path = relative(out, file).replaceAll('\\', '/');
    const text = readFileSync(file, 'utf8');
    if (text.includes('data-placeholder=')) refuse(`${path} still shows a placeholder project window.`);
    if (/class="[^"]*\bfx(-key)?\b/.test(text)) refuse(`${path} still highlights fixture values.`);
    if (/class="[^"]*\bill\b[^"]*"[^>]*>\s*illustrative/.test(text)) refuse(`${path} still shows an illustrative marker.`);
  }
}

const manual = [
  `GitHub Sponsors is live at ${site.sponsors.github} (the Help section links it).`,
  site.links.bluesky ? null : 'Bluesky: set site.links.bluesky when the profile exists, or keep the slot visibly unavailable.',
  'Wolf Ops: routes for wolfsblvt.works and contact.wolfsblvt.works, secrets, Turnstile widget, Email Service senders, the 503 custom error page; see docs/DEVELOPMENT.md, "Publication".',
].filter(Boolean);

if (refusals.length) {
  console.error(`Publication check refused:\n${refusals.map((r) => `  - ${r}`).join('\n')}`);
}
console.log(`\nConfirm by hand before publishing:\n${manual.map((m) => `  - ${m}`).join('\n')}`);
if (refusals.length) process.exit(1);
console.log('\nPublication check passed.');
