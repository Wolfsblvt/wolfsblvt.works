/**
 * Rooms: the contents column follows your reading with the cyan dot and travels with the site's eased curve. Yoru
 * lives here too: on the 404 he wanders off the path when clicked and comes back round from the other side; on the
 * legal pages he is asleep on his line.
 */
import { memory } from '../features/yoru/client/remember';
import { mountSpot } from '../features/yoru/client/spot';
import { documentTop, isPlainClick, travelTo } from './runtime';

function mountToc(): void {
  const toc = document.querySelector<HTMLElement>('[data-toc]');
  if (!toc) return;
  const links = [...toc.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')];
  const targets = links.map((a) => document.getElementById(a.dataset.tocLink!)).filter((el): el is HTMLElement => !!el);
  const offset = () => 62 + (innerWidth >= 720 ? 44 : 18);
  let raf = 0;
  const update = () => {
    raf = 0;
    const line = scrollY + innerHeight * 0.3;
    let current = targets[0]?.id ?? '';
    for (const el of targets) if (documentTop(el) <= line) current = el.id;
    if (scrollY >= document.documentElement.scrollHeight - innerHeight - 4 && targets.length) current = targets[targets.length - 1]!.id;
    links.forEach((a) => a.classList.toggle('on', a.dataset.tocLink === current));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
  toc.addEventListener('click', (event) => {
    const a = (event.target as Element).closest<HTMLAnchorElement>('[data-toc-link]');
    if (!a || !isPlainClick(event)) return;
    const el = document.getElementById(a.dataset.tocLink!);
    if (!el) return;
    event.preventDefault();
    void travelTo(() => documentTop(el) - offset());
    try { history.replaceState(history.state, '', `#${el.id}`); } catch { /* keep the journey */ }
  });
}

/** The 404's Yoru, who wanders off when clicked, and the legal pages' Yoru, asleep on his line. */
function mountYoru(): void {
  const groundOf = (line: HTMLElement) => () => {
    const r = line.getBoundingClientRect();
    return { left: r.left + scrollX, right: r.right + scrollX, y: r.top + scrollY };
  };
  const lost = document.querySelector<HTMLElement>('[data-yoru-lost]');
  const path = document.querySelector<HTMLElement>('[data-yoru-lost-ground]');
  if (lost && path) {
    mountSpot({
      spot: lost, ground: groundOf(path), wandersOff: true,
      caption: document.querySelector<HTMLElement>('[data-yoru-lost-cap]'),
      label: 'Yoru, the resident. Click him and he wanders off.',
    });
  }
  // On the privacy page: whether he remembers this visitor, and the way to make him forget.
  const remembered = document.querySelector<HTMLElement>('[data-yoru-memory]');
  if (remembered && memory.load()) {
    remembered.hidden = false;
    remembered.querySelector('[data-yoru-forget]')!.addEventListener('click', (event) => {
      memory.forget();
      remembered.querySelector('[data-yoru-memory-state]')!.textContent = 'Forgotten. Next time he’ll meet you fresh.';
      (event.currentTarget as HTMLElement).remove();
    });
  }
  const nap = document.querySelector<HTMLElement>('[data-yoru-nap]');
  const line = document.querySelector<HTMLElement>('[data-yoru-nap-ground]');
  if (nap && line) mountSpot({ spot: nap, ground: groundOf(line), asleep: true, label: 'Yoru, asleep. Poke him.' });
}

mountToc();
mountYoru();
