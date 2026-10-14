/** "dice for one": the specimen can simply be used in Endless. Go on, roll it. */
import type { InteractionModule } from '../../client/interactions';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const die = root.querySelector<HTMLButtonElement>('[data-die]');
  if (!die) return;
  die.disabled = false;
  die.addEventListener('click', () => {
    const value = 1 + Math.floor(Math.random() * 6);
    die.textContent = String(value);
    die.setAttribute('aria-label', `Roll the die. Current value ${value}`);
    die.classList.remove('rolled');
    void die.offsetWidth;
    die.classList.add('rolled');
  }, { signal });
};
