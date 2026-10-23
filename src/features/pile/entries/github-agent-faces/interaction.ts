/**
 * GitHub Agent Faces: one button swaps the three header rows between the individual voices (name, initial, "via
 * Wolfsblvt") and the raw view (the shared account name with its "[Name]:" marker), and back. Text and classes change
 * in place; nothing is created, timed or stored. The button is hidden in the markup and shown here, so without this
 * script the rows stand as a complete still.
 */
import type { InteractionModule } from '../../client/interactions';

const SHARED_ACCOUNT = 'Wolfsblvt';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const button = root.querySelector<HTMLButtonElement>('[data-faces-toggle]');
  const conversation = root.querySelector<HTMLElement>('[data-conversation]');
  const live = root.querySelector<HTMLElement>('[data-live]');
  const rows = [...root.querySelectorAll<HTMLElement>('[data-name]')];
  if (!button || !conversation || !live || rows.length === 0) return;

  let individual = true;

  const render = () => {
    conversation.classList.toggle('raw', !individual);
    for (const row of rows) {
      const name = row.dataset.name ?? '';
      const voiceName = row.querySelector<HTMLElement>('[data-voice-name]');
      const origin = row.querySelector<HTMLElement>('[data-voice-origin]');
      const initial = row.querySelector<HTMLElement>('[data-initial]');
      if (voiceName) voiceName.textContent = individual ? name : SHARED_ACCOUNT;
      if (origin) origin.textContent = individual ? `via ${SHARED_ACCOUNT}` : `[${name}]:`;
      if (initial) initial.textContent = individual ? name.charAt(0) : SHARED_ACCOUNT.charAt(0);
    }
    button.textContent = individual ? 'Show raw markers' : 'Show individual voices';
    live.textContent = individual
      ? `Individual names shown. The ${SHARED_ACCOUNT} account remains visible.`
      : 'The shared account and original name markers are shown.';
  };

  button.addEventListener('click', () => {
    individual = !individual;
    render();
  }, { signal });

  button.hidden = false;
};
