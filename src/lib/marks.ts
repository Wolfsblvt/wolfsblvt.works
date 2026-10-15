/** Build-time rendering of approved Works assets, not internal design specimens. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCKUP, markFrame } from './mark-ease';

const ASSET_DIR = join(process.cwd(), 'brand', 'bundle', 'works');

const read = (path: string) => readFileSync(join(ASSET_DIR, path), 'utf8').replace(/<\?xml[^>]*\?>\s*/, '');

function replaceExactly(source: string, from: string, to: string, count = 1): string {
  const found = source.split(from).length - 1;
  if (found !== count) throw new Error(`marks: expected ${count}× "${from.slice(0, 60)}", found ${found}`);
  return source.split(from).join(to);
}

/** The motion rules of the animated lockup, plus the finished state the rooms show. */
export function markMotionCss(): string {
  const svg = read('assets/lockup-default/on-dark-animated.svg');
  const css = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1];
  if (!css) throw new Error('marks: animated lockup has no style block');
  return `${css}\n.wk.mark-still *{animation:none!important}.wk.mark-still .dr,.wk.mark-still .hw,.wk.mark-still .ul{stroke-dashoffset:0}\n`;
}

/**
 * The header lockup: the animated full drawing whose differing transforms carry `data-mark-*` hooks, so the header
 * script can ease it into the compact drawing as the page scrolls. Rendered in its top-of-page state.
 */
export function headerLockup(options: { still: boolean; topPx?: number }): string {
  const frame = markFrame(0, options.topPx ?? 60, false, options.still);
  let s = read('assets/lockup-default/on-dark-animated.svg');
  s = s.replace(/<style>[\s\S]*?<\/style>\s*/, '');
  s = replaceExactly(
    s,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works" class="wk">',
    `<svg class="wk mark-head${frame.still ? ' mark-still' : ''}" viewBox="${frame.viewBox}" style="${frame.style}" aria-hidden="true" focusable="false" data-mark>`,
  );
  s = s.split('wk-full-dark-').join('hk-');
  // A generous fixed knockout region so the mask survives the viewBox ease.
  s = replaceExactly(s, 'x="-48.16" y="-99.96" width="725.72" height="157.73"', 'x="-80" y="-130" width="800" height="230"', 2);
  s = replaceExactly(s, 'transform="translate(502.8 -16.33) scale(1.17) skewX(-7)"', `transform="${frame.works}" data-mark-works`, 2);
  s = replaceExactly(s, 'stroke="#000" stroke-width="8.8"', `stroke="#000" stroke-width="${frame.knockoutStroke}" data-mark-knockout`);
  s = replaceExactly(s, 'stroke="#ef8ea1" stroke-width="3.3"', `stroke="#ef8ea1" stroke-width="${frame.worksStroke}" data-mark-hand`);
  s = replaceExactly(s, 'transform="translate(-64.92 -119.14) scale(6.05)"', `transform="${frame.orange}" data-mark-orange`);
  s = replaceExactly(s, 'transform="translate(500.65 -119.14) scale(6.05)"', `transform="${frame.magenta}" data-mark-magenta`);
  return s;
}

/** The static full lockup for the footer, re-id'd so it can share a page with the header copy. */
export function footerLockup(idPrefix = 'fk-'): string {
  let s = read('assets/lockup-default/on-dark.svg');
  s = replaceExactly(
    s,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works">',
    '<svg class="mark-foot" viewBox="-48.16 -99.96 725.72 157.73" role="img" aria-label="Wolfsblvt Works" focusable="false">',
  );
  return s.split('wk-full-dark-').join(idPrefix);
}

/** The approved adaptive favicon, unchanged. */
export function faviconSvg(): string {
  return read('assets/icon-favicon/on-light-adaptive.svg');
}

export { LOCKUP };
