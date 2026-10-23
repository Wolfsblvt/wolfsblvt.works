/**
 * Lighthouse globe: Globe / From the sea switches the two panes; Moonlight and Coastal lights switch independently
 * and the caption names what is left to see. With both lights off the sea goes almost completely dark on purpose.
 * Fades are CSS, already removed under reduced motion; nothing here keeps time.
 */
import type { InteractionModule } from '../../client/interactions';

const CAPTION = { both: 'From the sea', moonOnly: 'Moonlit water', coastOnly: 'One small light', none: 'Dark water' };

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const panes = [...root.querySelectorAll<HTMLElement>('[data-pane]')];
  const sea = root.querySelector<HTMLElement>('[data-sea]');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const lights = root.querySelector<HTMLElement>('[data-lights]');
  const viewButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-view]')];
  const moon = root.querySelector<HTMLInputElement>('[data-light="moon"]');
  const coast = root.querySelector<HTMLInputElement>('[data-light="coast"]');
  if (!sea || !caption || !controls || !lights || !moon || !coast || panes.length === 0 || viewButtons.length === 0) return;

  const showView = (view: string) => {
    for (const pane of panes) pane.hidden = pane.dataset.pane !== view;
    for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    lights.hidden = view !== 'sea';
  };
  const relight = () => {
    sea.classList.toggle('moon-off', !moon.checked);
    sea.classList.toggle('coast-off', !coast.checked);
    caption.textContent = moon.checked
      ? (coast.checked ? CAPTION.both : CAPTION.moonOnly)
      : (coast.checked ? CAPTION.coastOnly : CAPTION.none);
  };

  for (const button of viewButtons) {
    button.addEventListener('click', () => showView(button.dataset.view ?? 'sea'), { signal });
  }
  moon.addEventListener('change', relight, { signal });
  coast.addEventListener('change', relight, { signal });
  // A browser may restore the checkboxes' state on return; the scene follows them from the start.
  relight();
  controls.hidden = false;
};
