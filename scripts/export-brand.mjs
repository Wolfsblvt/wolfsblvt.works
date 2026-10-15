/** Deterministic Works export from committed, approved artwork and bounded foundation masters. */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { canonicalAssetPath, bundleSha256, validateBrandBundle } from '../tools/brand-bundle/scripts/validate-brand-bundle.mjs';
import { glowTile } from '../brand/source/works/glow-tile.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const sourceCommit = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(sourceCommit ?? '')) throw new Error('Usage: node scripts/export-brand.mjs <immutable-pre-export-input-commit>');
const source = 'brand/source/works';
const bundle = 'brand/bundle/works';
// Do not seal a manifest against a commit whose inputs differ from the files the exporter will read.
const inputs = [source, 'scripts/export-brand.mjs', 'tools/brand-bundle', 'package-lock.json', 'docs/brand-qualification.md'];
const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '--', ...inputs], { windowsHide: true, encoding: 'utf8' }).trim();
if (untracked) throw new Error(`Commit the export inputs before sealing the bundle:\n${untracked}`);
execFileSync('git', ['diff', '--exit-code', sourceCommit, '--', ...inputs], { windowsHide: true });
rmSync(bundle, { recursive: true, force: true });
mkdirSync(bundle, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function put(path, bytes) {
  const target = join(bundle, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, bytes);
  return { path, byteCount: bytes.length, sha256: hash(bytes) };
}
const copy = (from, to) => put(to, readFileSync(join(source, from)));
const manifest = {
  schemaVersion: 1,
  brand: { id: 'works', displayName: 'Wolfsblvt Works' },
  source: { repository: 'Wolfsblvt/wolfsblvt.works', commit: sourceCommit, exporter: 'scripts/export-brand.mjs' },
  tokens: {}, styles: {}, fonts: [], licences: [], assets: [],
};
for (const key of ['reference', 'semantic']) manifest.tokens[key] = copy(`tokens/${key}.json`, `tokens/${key}.json`);
manifest.tokens.css = copy('css/tokens.css', 'css/tokens.css');
for (const key of ['foundation', 'fonts']) manifest.styles[key] = copy(`css/${key}.css`, `css/${key}.css`);
const fontSources = JSON.parse(readFileSync(join(source, 'fonts.json'), 'utf8'));
for (const font of fontSources.fonts) manifest.fonts.push({ ...font, file: copy(font.file, font.file) });
for (const licence of fontSources.licences) manifest.licences.push({ ...licence, file: copy(licence.file, licence.file) });
manifest.components = { worksSponsor: {
  template: copy('components/works-sponsor.html', 'components/works-sponsor.html'),
  stylesheet: copy('css/works-sponsor.css', 'css/works-sponsor.css'),
  behavior: copy('components/works-sponsor.mjs', 'components/works-sponsor.mjs'),
} };

async function rendition(role, appearance, filename, { animated = false, adaptive = false } = {}) {
  const bytes = readFileSync(join(source, 'artwork', filename));
  const format = filename.split('.').at(-1);
  const rep = { format, motion: animated ? 'animated' : 'static' };
  if (format !== 'svg') {
    const info = await sharp(bytes, { animated }).metadata();
    Object.assign(rep, { width: info.width, height: info.pageHeight ?? info.height, pixelDensity: 1 });
  }
  if (animated) Object.assign(rep, { durationMs: 4000, loop: 'finite', playCount: 1 });
  if (adaptive) rep.adaptive = true;
  rep.file = put(canonicalAssetPath(role, { appearance, colorMode: 'full-color' }, rep), bytes);
  return rep;
}

for (const [role, folder, basename, pngPattern, motion] of [
  ['mark.primary', 'icon', 'works-icon', /^works-icon-(dark|light)-\d+\.png$/, true],
  ['lockup.default', 'lockup', 'works-lockup', /^works-lockup-(dark|light)-\d+w\.png$/, true],
  ['lockup.compact', 'lockup', 'works-lockup-compact', /^works-lockup-compact-(dark|light)-\d+h\.png$/, false],
  ['sponsor.banner', 'sponsor', 'works-sponsor-banner', /^works-sponsor-banner-(dark|light)(@2x)?\.png$/, true],
  ['icon.favicon', 'icon', 'works-icon', /^works-icon-(dark|light)-(16|32|48|64)\.png$/, false],
]) {
  const asset = { role, ...(role.startsWith('lockup') ? { titleCompatible: true } : {}), variants: [] };
  for (const [theme, appearance] of [['light', 'on-light'], ['dark', 'on-dark']]) {
    const reps = [await rendition(role, appearance, `svg/${folder}/${basename}-${theme}.svg`)];
    for (const name of readdirSync(join(source, 'artwork/png', folder)).sort()) {
      if (pngPattern.test(name) && name.includes(`-${theme}`)) reps.push(await rendition(role, appearance, `png/${folder}/${name}`));
    }
    const adaptiveFile = role === 'icon.favicon' ? 'svg/icon/favicon.svg' : `svg/${folder}/${basename}.svg`;
    reps.push(await rendition(role, appearance, adaptiveFile, { adaptive: true }));
    if (motion) {
      const files = readdirSync(join(source, 'artwork/animated/gif'));
      const gif = files.find(name => name.startsWith(`${basename}-${theme}`));
      const info = await sharp(join(source, 'artwork/animated/gif', gif), { animated: true }).metadata();
      const durationMs = info.delay.reduce((a, b) => a + b, 0);
      const svg = await rendition(role, appearance, `svg/${folder}/${basename}-animated-${theme}.svg`, { animated: true });
      const raster = await rendition(role, appearance, `animated/gif/${gif}`, { animated: true });
      svg.durationMs = raster.durationMs = durationMs;
      reps.push(svg, raster);
      const apng = gif.replace(/\.gif$/, '.apng');
      const extra = await rendition(role, appearance, `animated/apng/${apng}`, { animated: true });
      extra.durationMs = durationMs;
      reps.push(extra);
    }
    asset.variants.push({ appearance, colorMode: 'full-color', qualifiedBackgrounds: ['light', 'dark'],
      qualificationEvidence: { sourcePath: 'docs/brand-qualification.md' },
      minimumWidthPx: role.includes('lockup') ? (role.endsWith('compact') ? 110 : 184) : role === 'sponsor.banner' ? 800 : 16,
      representations: reps });
  }
  manifest.assets.push(asset);
}

// Preserve the approved monochrome drawings as additional explicit appearances, never as palette substitutes.
for (const [role, folder, basename, width] of [
  ['mark.primary', 'icon', 'works-icon', 512],
  ['lockup.default', 'lockup', 'works-lockup', 1200],
  ['lockup.compact', 'lockup', 'works-lockup-compact', 600],
]) {
  const asset = manifest.assets.find(asset => asset.role === role);
  for (const [appearance, color, name] of [['on-light', '#000', 'black'], ['on-dark', '#fff', 'white']]) {
    const svg = readFileSync(join(source, `artwork/svg/${folder}/${basename}-mono.svg`), 'utf8').replaceAll('currentColor', color);
    const vector = { format: 'svg', motion: 'static' };
    const variant = { appearance, colorMode: 'monochrome', qualifiedBackgrounds: [appearance === 'on-light' ? 'light' : 'dark'],
      qualificationEvidence: { sourcePath: 'docs/brand-qualification.md' }, minimumWidthPx: role === 'mark.primary' ? 16 : role === 'lockup.default' ? 184 : 110,
      representations: [] };
    vector.file = put(canonicalAssetPath(role, variant, vector), Buffer.from(svg));
    variant.representations.push(vector);
    const bytes = role === 'lockup.compact' ? await sharp(Buffer.from(svg)).resize({ width }).png().toBuffer()
      : readFileSync(join(source, `artwork/png/${folder}/${basename}-${name}-${width}${folder === 'lockup' ? 'w' : ''}.png`));
    const info = await sharp(bytes).metadata();
    const raster = { format: 'png', motion: 'static', width: info.width, height: info.height, pixelDensity: 1 };
    raster.file = put(canonicalAssetPath(role, variant, raster), bytes);
    variant.representations.push(raster);
    asset.variants.push(variant);
  }
}

// The existing site's glow tile is the application/touch composition. Maskable keeps the approved safe-zone drawing.
for (const [role, sizes] of [['icon.application', [192, 512]], ['icon.touch', [180]], ['icon.maskable', [512]]]) {
  const reps = [];
  let svg;
  if (role === 'icon.maskable') {
    svg = readFileSync(join(source, 'artwork/svg/icon/works-icon-dark.svg'), 'utf8')
      .replace(/<svg[^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">')
      .replace(/<\/svg>\s*$/, '</g></svg>')
      .replace(/(<svg[^>]*>)/, '$1<rect width="512" height="512" fill="#100b11"/><g transform="translate(106 106) scale(9.375)">');
  } else svg = glowTile(1024);
  const vector = { format: 'svg', motion: 'static' };
  vector.file = put(canonicalAssetPath(role, { appearance: 'universal', colorMode: 'full-color' }, vector), Buffer.from(svg));
  reps.push(vector);
  for (const size of sizes) {
    const bytes = role === 'icon.maskable' ? readFileSync(join(source, 'artwork/png/icon/works-icon-maskable-512.png'))
      : await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
    const rep = { format: 'png', motion: 'static', width: size, height: size, pixelDensity: 1 };
    rep.file = put(canonicalAssetPath(role, { appearance: 'universal', colorMode: 'full-color' }, rep), bytes);
    reps.push(rep);
  }
  manifest.assets.push({ role, variants: [{ appearance: 'universal', colorMode: 'full-color',
    qualifiedBackgrounds: ['light', 'dark'], qualificationEvidence: { sourcePath: 'docs/brand-qualification.md' }, minimumWidthPx: 32,
    representations: reps }] });
}
manifest.bundleSha256 = bundleSha256(manifest);
writeFileSync(join(bundle, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await validateBrandBundle(bundle);
const sections = manifest.assets.map(asset => `<section><h2>${asset.role}</h2>${asset.variants.map(variant => {
  const preview = variant.representations.find(rep => rep.format === 'svg' && rep.motion === 'static' && !rep.adaptive);
  return `<article class="${variant.appearance}"><h3>${variant.appearance}</h3><img src="../${bundle}/${preview.file.path}" alt="${asset.role}, ${variant.appearance}"><ul>${variant.representations.map(rep => `<li><a href="../${bundle}/${rep.file.path}">${rep.file.path}</a></li>`).join('')}</ul></article>`;
}).join('')}</section>`).join('\n');
writeFileSync('assets/works-gallery.html', `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Works identity bundle</title><style>body{margin:32px;font:16px/1.5 system-ui;background:#eee;color:#22171c}section{margin:32px 0}article{padding:24px;margin:12px 0;border:1px solid #bbb;overflow-wrap:anywhere}article img{max-width:100%;width:500px;max-height:180px;object-fit:contain;object-position:left}article.on-dark{background:#100b11;color:#f3e8dc}article.on-light{background:#fff}a{color:inherit}li{margin:5px 0}</style><h1>Wolfsblvt Works identity</h1><p>Generated canonical file gallery. <a href="README.md">Usage, rights and pinning</a> · <a href="../${bundle}/manifest.json">Manifest</a></p>${sections}</html>\n`);
console.log(`Works bundle exported and validated: ${manifest.bundleSha256}`);
