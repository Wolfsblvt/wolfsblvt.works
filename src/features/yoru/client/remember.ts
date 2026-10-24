/** Home owns acquaintance growth and the nook choice. Utility rooms may read; Contact never opens this store. */
import { browserMemory, MEMORY_KEY, newAcquaintance, settleAcquaintance, welcomeBack, type Acquaintance, type MemoryStore } from '../memory';
import type { Resident } from '../resident';
import { reducedMotion } from '../../../scripts/runtime';

let store: MemoryStore | undefined;
/** Open storage only on a host whose memory mode permits it. Importing the module does not touch localStorage. */
export function memory(): MemoryStore {
  return store ??= browserMemory((() => { try { return window.localStorage; } catch { return null; } })());
}

/** The visitor's local calendar day, never a timestamp. */
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** All cooperating tabs serialize read/merge/write and deletion; storage events are notifications, not transactions. */
async function changeMemory<T>(change: () => T, unavailable: T): Promise<T> {
  try {
    if (!navigator.locks) return unavailable;
    return await navigator.locks.request(MEMORY_KEY, change);
  } catch { return unavailable; }
}

/** Only Home settles and saves an encounter; smaller rooms cannot consume its new-day greeting. */
export async function recall(): Promise<{ record: Acquaintance | null; returning: boolean }> {
  return changeMemory(() => {
    const stored = memory().load();
    if (!stored) return { record: null, returning: false };
    const record = welcomeBack(stored, today());
    if (!memory().save(record)) return { record: null, returning: false };
    return { record, returning: stored.lastSeen !== record.lastSeen };
  }, { record: null, returning: false });
}

/** One deletion route for the nook and Privacy, also clearing the current page's remembered behaviour. */
export async function forgetAcquaintance(): Promise<boolean> {
  return changeMemory(() => {
    if (!memory().forget()) return false;
    dispatchEvent(new Event('yoru-forgotten'));
    return true;
  }, false);
}

/** Synchronize same-origin memory without writing back, growing history or replaying Home's greeting. */
export function observeAcquaintance(resident: Resident, after: (record: Acquaintance | null) => void = () => {}, mode: 'read' | 'write' = 'write'): void {
  const forgotten = () => { resident.setAcquaintance(null); after(null); };
  addEventListener('yoru-forgotten', forgotten);
  addEventListener('storage', (event) => {
    if (event.key === null || (event.key === MEMORY_KEY && event.newValue === null)) {
      dispatchEvent(new Event('yoru-forgotten'));
    } else if (event.key === MEMORY_KEY) {
      // An older queued event must not roll the resident back after a more recent write.
      const record = memory().load();
      if (!record) { dispatchEvent(new Event('yoru-forgotten')); return; }
      const current = mode === 'read' ? settleAcquaintance(record, today()) : record;
      let updated = current;
      if (mode === 'read') resident.setAcquaintance(current);
      else updated = resident.synchronizeAcquaintance(current)!;
      after(updated);
      dispatchEvent(new Event('yoru-memory-updated'));
    }
  });
}

/** Home saves only an acquaintance that still exists, never recreating a deleted record on pagehide. */
export function keepWhileVisiting(resident: Resident): void {
  const keep = () => {
    // Check the live record inside the lock, even when a storage event hasn't reached this tab yet.
    void changeMemory(() => {
      if (!resident.remember()) return;
      const record = resident.synchronizeAcquaintance(memory().load());
      if (!record || !memory().save(record)) resident.setAcquaintance(null);
      else resident.setAcquaintance(record);
    }, undefined);
  };
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keep(); });
}

let offered = false;

/** Show the Home nook's choice or its stable remembered-state / one-action forget control, once per page. */
export function offerToRemember(o: {
  layer: HTMLElement;
  /** A phone's footer gives the note its own flow space under the maker's words (footer.css) instead of covering them. */
  inline: HTMLElement;
  place(size: { width: number; height: number }): { left: number; top: number };
  resident: Resident;
}): void {
  if (offered) return;
  offered = true;
  const note = document.createElement('div');
  note.className = 'yoru-note';
  note.setAttribute('role', 'group');
  note.setAttribute('aria-label', 'Yoru’s memory');
  note.innerHTML = '<p class="yoru-note-text"></p><div class="yoru-note-text" role="status" aria-live="polite" aria-atomic="true" tabindex="-1"></div><div class="yoru-note-acts"></div>';
  o.layer.append(note);
  const text = note.querySelector<HTMLElement>('.yoru-note-text')!;
  const acts = note.querySelector<HTMLElement>('.yoru-note-acts')!;
  const status = note.querySelector<HTMLElement>('[role="status"]')!;
  const place = () => {
    if (innerWidth < 720) {
      if (note.parentElement !== o.inline) {
        const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
        o.inline.append(note);
        note.classList.add('in-flow');
        note.style.removeProperty('left');
        note.style.removeProperty('top');
        if (atEnd) scrollTo(0, document.documentElement.scrollHeight);
      }
      return;
    }
    if (note.parentElement !== o.layer) o.layer.append(note);
    note.classList.remove('in-flow');
    const { left, top } = o.place({ width: note.offsetWidth, height: note.offsetHeight });
    note.style.left = `${left}px`;
    note.style.top = `${top}px`;
  };
  const outcome = (message: string, clear = false) => {
    const moveFocus = clear && acts.contains(document.activeElement);
    text.hidden = true;
    status.textContent = message;
    if (clear) acts.replaceChildren();
    if (moveFocus) status.focus({ preventScroll: true });
    place();
  };
  const remembered = () => {
    const moveFocus = acts.contains(document.activeElement);
    outcome('Yoru remembers you. only in this browser.');
    if (!acts.querySelector('[data-forget]')) {
      acts.innerHTML = '<button type="button" data-forget>Forget me</button>';
      acts.querySelector('button')!.addEventListener('click', async () => {
        if (!await forgetAcquaintance()) outcome('This browser wouldn’t remove the memory. You can try again.');
      });
    }
    if (moveFocus) acts.querySelector<HTMLButtonElement>('button')!.focus({ preventScroll: true });
    place();
  };
  if (memory().load()) remembered();
  else {
    text.innerHTML = 'want me to remember you?<br>only in this browser.<br>next time I’ll know you.<br><a class="yoru-note-details" href="/privacy/#storage">what gets kept?</a>';
    acts.innerHTML = '<button type="button" data-yes>remember me</button><button type="button" data-no>not now</button>';
    acts.querySelector('[data-yes]')!.addEventListener('click', async () => {
      const record = await changeMemory(() => {
        const current = memory().load() ?? newAcquaintance(today());
        return memory().save(current) ? current : null;
      }, null);
      if (record) {
        o.resident.setAcquaintance(record);
        remembered();
      } else {
        o.resident.setAcquaintance(null);
        outcome('I couldn’t keep that in this browser. Remembering is off.', true);
      }
    });
    acts.querySelector('[data-no]')!.addEventListener('click', () => {
      if (note.contains(document.activeElement)) document.querySelector<HTMLElement>('.yoru-resident')?.focus({ preventScroll: true });
      note.classList.remove('shown');
      removeEventListener('resize', place);
      removeEventListener('scroll', place);
      setTimeout(() => note.remove(), reducedMotion() ? 0 : 400);
    });
  }
  addEventListener('yoru-forgotten', () => {
    outcome('Forgotten. Next time he’ll meet you fresh.', true);
  });
  addEventListener('yoru-memory-updated', remembered);
  place();
  addEventListener('resize', place);
  addEventListener('scroll', place, { passive: true });
  requestAnimationFrame(() => note.classList.add('shown'));
}
