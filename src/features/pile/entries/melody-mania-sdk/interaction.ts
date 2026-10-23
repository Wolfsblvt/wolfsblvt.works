/**
 * Melody Mania SDK: the lighting switch. "Try the midnight lights" changes the stage to blue curtains and mint notes;
 * the same button then reads "Bring back the rose" and restores the first treatment. One class on the stage and its
 * description swapped with it; no audio, no timing, no loop.
 */
import type { InteractionModule } from '../../client/interactions';

const TRY = 'Try the midnight lights';
const BACK = 'Bring back the rose';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const button = root.querySelector<HTMLButtonElement>('[data-lights]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  if (!button || !stage) return;
  const rose = stage.getAttribute('aria-label') ?? '';
  const midnight = stage.dataset.labelMidnight ?? rose;
  button.hidden = false;
  button.addEventListener('click', () => {
    const cool = !stage.classList.contains('cool');
    stage.classList.toggle('cool', cool);
    stage.setAttribute('aria-label', cool ? midnight : rose);
    button.textContent = cool ? BACK : TRY;
  }, { signal });
};
