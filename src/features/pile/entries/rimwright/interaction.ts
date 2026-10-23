/**
 * Rimwright: Before / After switches the wall's hit points between the two values the project's own example carries.
 * Only the number and the pressed states change; nothing is generated or run.
 */
import type { InteractionModule } from '../../client/interactions';

const VALUE = { before: '350', after: '400' } as const;
type Version = keyof typeof VALUE;

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const value = root.querySelector<HTMLElement>('[data-value]');
  const controls = root.querySelector<HTMLElement>('[data-controls]');
  const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-version]')];
  if (!value || !controls || buttons.length === 0) return;

  const show = (version: Version) => {
    value.textContent = VALUE[version];
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.version === version));
  };

  for (const button of buttons) {
    button.addEventListener('click', () => show(button.dataset.version === 'after' ? 'after' : 'before'), { signal });
  }
  controls.hidden = false;
};
