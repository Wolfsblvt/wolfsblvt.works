/**
 * The Streets We Owe: one button lays the other past's tracing over the survey and lifts it again. The tracing is a
 * class on the scene; the button's label and the live caption follow it.
 */
import type { InteractionModule } from '../../client/interactions';

const LABEL = { off: 'Lay over the other past', on: 'Lift the tracing' };
const CAPTION = { off: 'The city as it stands.', on: 'Another past occupies the same ground.' };

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const scene = root.querySelector<HTMLElement>('[data-scene]');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const button = root.querySelector<HTMLButtonElement>('[data-trace]');
  if (!scene || !caption || !controls || !button) return;

  button.addEventListener('click', () => {
    const on = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? LABEL.on : LABEL.off;
    scene.classList.toggle('trace-on', on);
    caption.textContent = on ? CAPTION.on : CAPTION.off;
  }, { signal });
  controls.hidden = false;
};
