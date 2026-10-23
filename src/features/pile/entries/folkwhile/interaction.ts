/**
 * Folkwhile: Daylight / After dark fades between the two captures already in the markup and shifts the ground behind
 * them. State changes are a class and two attributes; the fade is CSS, which base.css already removes under reduced
 * motion, so nothing here needs a timer.
 */
import type { InteractionModule } from '../../client/interactions';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const views = [...root.querySelectorAll<HTMLImageElement>('[data-view]')];
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-time]')];
  if (!scene || !controls || views.length === 0 || buttons.length === 0) return;

  const show = (time: string) => {
    scene.classList.toggle('night', time === 'night');
    for (const view of views) {
      if (view.dataset.view === time) view.removeAttribute('aria-hidden');
      else view.setAttribute('aria-hidden', 'true');
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.time === time));
  };

  for (const button of buttons) {
    button.addEventListener('click', () => show(button.dataset.time ?? 'day'), { signal });
  }
  controls.hidden = false;
};
