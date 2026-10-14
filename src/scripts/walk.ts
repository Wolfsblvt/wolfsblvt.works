/**
 * Draws the Walk from the content's real size and redraws it when that size changes meaningfully. The lines scroll
 * with the content: you walk along a path, you don't scroll past a backdrop.
 */
import { buildWalk, type WalkIntensity, type WalkPaths } from '../lib/walk';

export function mountWalk(): void {
  const walk = document.querySelector<HTMLElement>('[data-walk]');
  const root = document.querySelector<HTMLElement>('[data-root]');
  const content = document.querySelector<HTMLElement>('[data-walk-content]');
  if (!walk || !root || !content) return;
  const svg = walk.querySelector('svg');
  if (!svg) return;

  const intensity = (walk.dataset.intensity ?? 'standard') as WalkIntensity;
  const frayEnds = walk.hasAttribute('data-fray');
  let lastW = -1;
  let lastH = -1;

  const draw = () => {
    const W = root.clientWidth;
    const H = Math.max(content.offsetHeight, root.clientHeight);
    if (Math.abs(W - lastW) <= 1 && Math.abs(H - lastH) <= 24) return;
    lastW = W;
    lastH = H;
    const p = buildWalk({ width: W, height: H, intensity, frayEnds });
    apply(p);
    walk.classList.add('ready');
  };

  const apply = (p: WalkPaths) => {
    walk.style.height = `${p.height}px`;
    svg.setAttribute('height', String(p.height));
    svg.setAttribute('viewBox', `0 0 ${p.width} ${p.height}`);
    svg.querySelectorAll('[data-walk-filter]').forEach((f) => {
      f.setAttribute('width', String(p.width + 800));
      f.setAttribute('height', String(p.height + 1600));
    });
    svg.querySelector('[data-walk-blur]')?.setAttribute('stdDeviation', String(p.fillBlur));
    const d: Record<string, string> = {
      fillLeft: p.fillLeft,
      fillRight: p.fillRight,
      edgeLeft: p.edgeLeft,
      edgeRight: p.edgeRight,
      glowLeft: p.glowLeft,
      glowRight: p.glowRight,
      lineLeft: p.lineLeft,
      lineRight: p.lineRight,
      strandLeft0: p.strandsLeft[0],
      strandLeft1: p.strandsLeft[1],
      strandRight0: p.strandsRight[0],
      strandRight1: p.strandsRight[1],
    };
    svg.querySelectorAll<SVGPathElement>('[data-w]').forEach((path) => {
      const key = path.dataset.w!;
      path.setAttribute('d', d[key] ?? '');
      if (key === 'fillLeft') path.setAttribute('fill-opacity', String(p.fillOpacity));
      if (key === 'fillRight') path.setAttribute('fill-opacity', String(p.fillOpacityRight));
    });
  };

  let pending = 0;
  const schedule = () => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      draw();
    });
  };
  new ResizeObserver(schedule).observe(content);
  new ResizeObserver(schedule).observe(root);
  document.fonts?.ready.then(schedule);
  draw();
}
