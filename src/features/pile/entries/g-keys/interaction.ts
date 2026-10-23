/**
 * The key strip's behaviour: press a key to inspect its meaning in the chosen foreground app. The meanings of both
 * contexts are already in the markup; this only chooses which one is visible and which key reads as pressed.
 */
import type { InteractionModule } from '../../client/interactions';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const keys = [...root.querySelectorAll<HTMLButtonElement>('button[data-key]')];
  const meanings = [...root.querySelectorAll<HTMLElement>('[data-context][data-key]')];
  const select = root.querySelector<HTMLSelectElement>('[data-switch]');
  const number = root.querySelector<HTMLElement>('[data-key-number]');
  if (!select || !number || keys.length === 0) return;
  const contextLabel = select.closest('label');
  let selected = Number(keys.find((key) => key.getAttribute('aria-pressed') === 'true')?.dataset.key ?? 5);

  const render = () => {
    for (const key of keys) key.setAttribute('aria-pressed', String(Number(key.dataset.key) === selected));
    number.textContent = `G${selected} · a familiar way in`;
    for (const meaning of meanings) {
      meaning.hidden = !(meaning.dataset.context === select.value && Number(meaning.dataset.key) === selected);
    }
  };

  for (const key of keys) {
    key.disabled = false;
    key.addEventListener('click', () => {
      selected = Number(key.dataset.key);
      render();
    }, { signal });
  }
  select.addEventListener('change', render, { signal });
  if (contextLabel) contextLabel.hidden = false;
  render();
};
