/**
 * The camera roll's one small trip: Play the trip places the scene into the fourth photo space, Back to the post
 * resets it. A class on the stage and a few words change; nothing loops.
 */
import type { InteractionModule } from '../../client/interactions';

const READY = 'A moonlit scene in a phone share sheet, beside a small camera-roll photo stack. The chosen scene is ready to travel into the roll.';
const SAVED = 'The moonlit scene now sits in the camera-roll photo stack beside the phone.';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const choice = root.querySelector<HTMLElement>('[data-choice]');
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const reset = root.querySelector<HTMLButtonElement>('[data-reset]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  if (!stage || !choice || !play || !reset || !status) return;

  play.addEventListener('click', () => {
    stage.classList.add('saved');
    stage.setAttribute('aria-label', SAVED);
    choice.textContent = 'In the roll.';
    play.textContent = 'Kept.';
    status.textContent = 'The scene has reached the camera roll.';
  }, { signal });

  reset.addEventListener('click', () => {
    stage.classList.remove('saved');
    stage.setAttribute('aria-label', READY);
    choice.textContent = 'Save to Photos';
    play.textContent = 'Play the trip';
    status.textContent = 'Back at the post.';
  }, { signal });

  play.hidden = false;
  reset.hidden = false;
};
