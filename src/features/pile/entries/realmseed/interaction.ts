/**
 * Realmseed: one button brings the new path forward across the country and lets it settle back. The path is a class
 * on the scene; the button's label and the live caption follow it.
 */
import type { InteractionModule } from '../../client/interactions';

const LABEL = { off: 'Follow the new path', on: 'Return to the country' };
const CAPTION = { off: 'A garden. A hearth. A way between them.', on: 'Other people’s plans have become a way through the world.' };

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const button = root.querySelector<HTMLButtonElement>('[data-path]');
  if (!scene || !caption || !controls || !button) return;

  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? LABEL.on : LABEL.off;
    scene.classList.toggle('path-on', on);
    caption.textContent = on ? CAPTION.on : CAPTION.off;
  }, { signal });
  controls.hidden = false;
};
