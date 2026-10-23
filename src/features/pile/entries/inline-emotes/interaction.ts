/**
 * The two reactions' behaviour: Emotes on / Show emotes swaps the inline faces for their tokens and back; A little
 * celebration adds a class for one brief reaction and removes it again. Under reduced motion the class is a plain
 * pose, applied at once and released after the same short moment.
 */
import type { InteractionModule } from '../../client/interactions';

const REACTION_MS = 700;

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const chat = root.querySelector<HTMLElement>('[data-chat]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-toggle]');
  const react = root.querySelector<HTMLButtonElement>('[data-react]');
  if (!chat || !toggle || !react) return;
  const emotes = [...chat.querySelectorAll<HTMLElement>('.emote')];
  const tokens = [...chat.querySelectorAll<HTMLElement>('.token')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let emotesOn = true;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const settle = () => {
    chat.classList.remove('reacting');
    timer = undefined;
  };
  const begin = () => {
    chat.classList.add('reacting');
    timer = setTimeout(settle, REACTION_MS);
  };

  toggle.addEventListener('click', () => {
    emotesOn = !emotesOn;
    for (const emote of emotes) emote.hidden = !emotesOn;
    for (const token of tokens) token.hidden = emotesOn;
    toggle.setAttribute('aria-pressed', String(emotesOn));
    toggle.textContent = emotesOn ? 'Emotes on' : 'Show emotes';
    react.hidden = !emotesOn;
  }, { signal });

  react.addEventListener('click', () => {
    clearTimeout(timer);
    chat.classList.remove('reacting');
    if (reduced.matches) {
      begin();
      return;
    }
    // A frame without the class lets the keyframes restart when the celebration is asked for twice in a row.
    requestAnimationFrame(begin);
  }, { signal });

  signal.addEventListener('abort', () => {
    clearTimeout(timer);
    chat.classList.remove('reacting');
  });

  toggle.hidden = false;
  react.hidden = false;
};
