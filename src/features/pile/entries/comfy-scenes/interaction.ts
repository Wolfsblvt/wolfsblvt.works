/**
 * Small hours, in three beats: any beat is directly selectable; Play runs the three once and can pause; under
 * reduced motion the same control steps to the next beat instead. Playback stops when the document is hidden and
 * when the interaction is torn down. Every beat is a complete composed state, so nothing waits on a timer to be readable.
 */
import type { InteractionModule } from '../../client/interactions';

const CAPTIONS = ['The last light.', 'A small visitor.', 'Something to take home.'] as const;
const DESCRIPTIONS = [
  'Shot one: a pale moth approaches a single glowing streetlamp in a violet night.',
  'Shot two: the moth reaches the warm light at the top of the streetlamp.',
  'Shot three: the lamp dims while the little moth leaves, carrying a warm glow into the night.',
] as const;
const LAST = CAPTIONS.length - 1;
const BEAT_MS = 1700;

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const view = root.querySelector<HTMLElement>('[data-view]');
  const num = root.querySelector<HTMLElement>('[data-num]');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  const play = root.querySelector<HTMLButtonElement>('[data-play]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  const beats = [...root.querySelectorAll<HTMLButtonElement>('button[data-shot]')];
  if (!view || !num || !caption || !play || !status || beats.length === 0) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let shot = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const setShot = (n: number) => {
    shot = n;
    view.dataset.shot = String(n);
    num.textContent = `0${n + 1} / SMALL HOURS`;
    caption.textContent = CAPTIONS[n] ?? '';
    view.setAttribute('aria-label', DESCRIPTIONS[n] ?? '');
    for (const beat of beats) beat.setAttribute('aria-pressed', String(Number(beat.dataset.shot) === n));
    status.textContent = CAPTIONS[n] ?? '';
  };

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    play.textContent = reduced.matches ? 'Next beat' : shot === LAST ? 'Replay the three beats' : 'Play the three beats';
  };

  for (const beat of beats) {
    beat.disabled = false;
    beat.addEventListener('click', () => {
      stop();
      setShot(Number(beat.dataset.shot));
      stop();
    }, { signal });
  }

  play.addEventListener('click', () => {
    if (reduced.matches) {
      setShot((shot + 1) % CAPTIONS.length);
      return;
    }
    if (timer !== null) {
      stop();
      return;
    }
    setShot(0);
    play.textContent = 'Pause the scene';
    timer = setInterval(() => {
      if (shot === LAST) {
        stop();
        return;
      }
      setShot(shot + 1);
    }, BEAT_MS);
  }, { signal });

  reduced.addEventListener('change', stop, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  }, { signal });
  signal.addEventListener('abort', () => {
    if (timer !== null) clearInterval(timer);
    timer = null;
  });

  play.hidden = false;
  stop();
};
