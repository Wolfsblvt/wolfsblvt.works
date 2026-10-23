/**
 * Shikkuri, alternative scene: the visitor chooses the feeling of the evening. Quiet, Curious or One more round swaps
 * the sleeve's art, its label and the line beneath it; the choice settles at once. Nothing is scanned, scored or
 * remembered. Not discovered by the Pile (files under alt/ are outside its glob); a comparison page imports and mounts
 * it on the element marked data-interaction="shikkuri-alt".
 */
import type { InteractionModule } from '../../../client/interactions';

const MOODS = {
  quiet: { label: 'somewhere quiet', copy: 'A little room to wander.', alt: 'A game sleeve: a warm moon above a quiet green landscape.' },
  curious: { label: 'a little mystery', copy: 'Something to pull on a loose thread.', alt: 'A game sleeve: a pale moon glimpsed through tall violet shapes.' },
  again: { label: 'one more round', copy: 'Enough time to get carried away.', alt: 'A game sleeve: bright diagonal tracks around a small golden sun.' },
} as const;
type Mood = keyof typeof MOODS;
const isMood = (value: string | undefined): value is Mood => value !== undefined && value in MOODS;

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const art = root.querySelector<HTMLElement>('[data-art]');
  const copy = root.querySelector<HTMLElement>('[data-mood-copy]');
  const group = root.querySelector<HTMLElement>('[data-moods]');
  if (!art || !copy || !group) return;
  const buttons = [...group.querySelectorAll<HTMLButtonElement>('button[data-mood]')];
  group.hidden = false;
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const mood = button.dataset.mood;
      if (!isMood(mood)) return;
      const state = MOODS[mood];
      art.dataset.mood = mood;
      art.dataset.label = state.label;
      art.setAttribute('aria-label', state.alt);
      copy.textContent = state.copy;
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
    }, { signal });
  }
};
