/**
 * Loona Engine: one deliberate glance. "Look this way" turns the little device towards the visitor and it says "Hi.";
 * the same button then reads "Settle back" and returns it to rest. No loop, no timer, no device. The pose is a class
 * on the device; under reduced motion its transition is dropped, so the pose changes at once with the same response.
 */
import type { InteractionModule } from '../../client/interactions';

const LOOK = 'Look this way';
const SETTLE = 'Settle back';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const button = root.querySelector<HTMLButtonElement>('[data-look]');
  const device = root.querySelector<HTMLElement>('[data-device]');
  const response = root.querySelector<HTMLElement>('[data-look-response]');
  if (!button || !device || !response) return;
  button.hidden = false;
  button.addEventListener('click', () => {
    const looking = !device.classList.contains('is-looking');
    device.classList.toggle('is-looking', looking);
    response.textContent = looking ? 'Hi.' : '';
    button.textContent = looking ? SETTLE : LOOK;
  }, { signal });
};
