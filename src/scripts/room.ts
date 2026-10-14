/**
 * Rooms: the contents column follows your reading with the cyan dot and travels with the site's eased curve; on the
 * 404, Yoru runs off the path when clicked and wanders back from the other side.
 */
import { documentTop, isPlainClick, reducedMotion, travelTo } from './runtime';

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

function mountLostYoru(): void {
  const button = document.querySelector<HTMLButtonElement>('[data-yoru-lost]');
  const sprite = button?.querySelector<HTMLElement>('.sprite');
  const cap = document.querySelector<HTMLElement>('[data-yoru-lost-cap]');
  if (!button || !sprite) return;
  let busy = false;
  if (!reducedMotion()) {
    setInterval(() => {
      if (busy) return;
      sprite.className = 'sprite s-look';
      setTimeout(() => { if (!busy) sprite.className = 'sprite s-idle'; }, 1700);
    }, 6500);
  }
  button.addEventListener('click', () => {
    if (busy || reducedMotion()) return;
    busy = true;
    if (cap) cap.hidden = true;
    sprite.className = 'sprite s-runR';
    button.classList.add('out');
    setTimeout(() => {
      button.classList.remove('out');
      button.classList.add('away');
      setTimeout(() => {
        // Back from the other side.
        button.style.transition = 'none';
        button.style.transform = 'translateX(-70vw)';
        button.classList.remove('away');
        sprite.className = 'sprite s-runL';
        void button.offsetWidth;
        button.style.transition = '';
        button.style.transform = '';
        setTimeout(() => {
          sprite.className = 'sprite s-idle';
          if (cap) cap.hidden = false;
          busy = false;
        }, 1650);
      }, 2600);
    }, 1650);
  });
}

mountToc();
mountLostYoru();
