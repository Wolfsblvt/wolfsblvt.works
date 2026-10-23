/**
 * The cheat sheet's behaviour: a context switch, a search over the visible examples and Pin / Unpin between Keep close
 * and Worth learning. The rows of both contexts already exist in the markup; this only hides, shows and moves them, and
 * keeps keyboard focus on the action that was just moved.
 */
import type { InteractionModule } from '../../client/interactions';

const INITIAL_MESSAGE = 'A familiar action. A small thing to learn.';
const CONTEXT_MESSAGE = 'A different app. The same little place to look.';

export const mount: InteractionModule['mount'] = (root, { signal }) => {
  const select = root.querySelector<HTMLSelectElement>('[data-switch]');
  const search = root.querySelector<HTMLInputElement>('[data-search]');
  const pinnedList = root.querySelector<HTMLUListElement>('[data-group="pinned"] ul');
  const learnList = root.querySelector<HTMLUListElement>('[data-group="learn"] ul');
  const empty = root.querySelector<HTMLElement>('[data-empty]');
  const feedback = root.querySelector<HTMLElement>('[data-feedback]');
  if (!select || !search || !pinnedList || !learnList || !empty || !feedback) return;
  const searchLabel = root.querySelector<HTMLLabelElement>(`label[for="${search.id}"]`);
  const rows = [...root.querySelectorAll<HTMLLIElement>('li[data-id]')];
  const pins = [...root.querySelectorAll<HTMLButtonElement>('li[data-id] button')];

  const render = (message?: string) => {
    const term = search.value.toLowerCase().trim();
    let shown = 0;
    for (const row of rows) {
      const matches = row.dataset.context === select.value && `${row.dataset.name} ${row.dataset.chord}`.toLowerCase().includes(term);
      row.hidden = !matches;
      if (matches) shown += 1;
    }
    for (const list of [pinnedList, learnList]) {
      list.parentElement!.hidden = !list.querySelector('li:not([hidden])');
    }
    empty.hidden = shown > 0;
    feedback.textContent = message ?? `${shown} ${shown === 1 ? 'action' : 'actions'} on this slip.`;
  };

  /** Puts the row into the other group, keeping the context's own order among its siblings. */
  const move = (row: HTMLLIElement, toPinned: boolean) => {
    const target = toPinned ? pinnedList : learnList;
    const order = Number(row.dataset.order);
    const before = [...target.children].find((sibling) => {
      const other = sibling as HTMLElement;
      return other.dataset.context === row.dataset.context && Number(other.dataset.order) > order;
    });
    target.insertBefore(row, before ?? null);
  };

  for (const button of pins) {
    button.addEventListener('click', () => {
      const row = button.closest<HTMLLIElement>('li[data-id]');
      if (!row) return;
      const name = row.dataset.name ?? '';
      const nowPinned = button.getAttribute('aria-pressed') !== 'true';
      move(row, nowPinned);
      button.setAttribute('aria-pressed', String(nowPinned));
      button.setAttribute('aria-label', `${nowPinned ? 'Unpin' : 'Pin'} ${name}`);
      button.textContent = nowPinned ? 'Unpin' : 'Pin';
      render(`${name} ${nowPinned ? 'is pinned under Keep close.' : 'is back under Worth learning.'}`);
      button.focus({ preventScroll: true });
    }, { signal });
  }
  select.addEventListener('change', () => {
    search.value = '';
    render(CONTEXT_MESSAGE);
  }, { signal });
  search.addEventListener('input', () => render(), { signal });

  select.hidden = false;
  search.hidden = false;
  if (searchLabel) searchLabel.hidden = false;
  for (const button of pins) button.hidden = false;
  render(INITIAL_MESSAGE);
};
