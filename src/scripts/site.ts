/**
 * Entry for every page. Draws the Walk, mounts the header and reveals. On rooms the header settles over the first
 * 220px and its path is plain reading progress; the home page drives both from its own section spy (home.ts).
 */
import { clamp } from '../lib/shape';
import { mountHeader } from './header';
import { observeReveals } from './runtime';
import { mountWalk } from './walk';

export const header = mountHeader();
const isHome = document.querySelector('[data-header][data-home]') !== null;

mountWalk();
observeReveals();

if (header && !isHome) {
  let raf = 0;
  const update = () => {
    raf = 0;
    const maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    header.setSettle(clamp(scrollY / 220, 0, 1));
    header.setProgress(clamp(scrollY / maxY, 0, 1));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); });
  update();
}
