/** Home owns acquaintance growth and the nook choice. Utility rooms may read; Contact never opens this store. */
import { browserMemory, MEMORY_KEY, newAcquaintance, parseAcquaintance, settleAcquaintance, welcomeBack, type Acquaintance, type MemoryStore } from '../memory';
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

/** Only Home settles and saves a returning encounter, so smaller rooms cannot consume its new-day greeting. */
export function recall(): { record: Acquaintance | null; returning: boolean } {
  const stored = memory().load();
  if (!stored) return { record: null, returning: false };
  const record = welcomeBack(stored, today());
  if (!memory().save(record)) return { record: null, returning: false };
  return { record, returning: stored.lastSeen !== record.lastSeen };
}

/** One deletion route for the nook and Privacy, also clearing the current page's remembered behaviour. */
export function forgetAcquaintance(): boolean {
  if (!memory().forget()) return false;
  dispatchEvent(new Event('yoru-forgotten'));
  return true;
}

/** Synchronize same-origin memory without writing back, growing history or replaying Home's greeting. */
export function observeAcquaintance(resident: Resident, after: (record: Acquaintance | null) => void = () => {}, mode: 'read' | 'write' = 'write'): void {
  const forgotten = () => { resident.setAcquaintance(null); after(null); };
  addEventListener('yoru-forgotten', forgotten);
  addEventListener('storage', (event) => {
    if (event.key === null || (event.key === MEMORY_KEY && event.newValue === null)) {
      dispatchEvent(new Event('yoru-forgotten'));
    } else if (event.key === MEMORY_KEY) {
      const record = parseAcquaintance(event.newValue);
      if (!record) { dispatchEvent(new Event('yoru-forgotten')); return; }
      const current = mode === 'read' ? settleAcquaintance(record, today()) : record;
      resident.setAcquaintance(current);
      after(current);
      dispatchEvent(new Event('yoru-memory-updated'));
    }
  });
}

/** Home saves only an acquaintance that still exists, never recreating a deleted record on pagehide. */
export function keepWhileVisiting(resident: Resident): void {
  const keep = () => {
    const record = resident.remember();
    if (!record) return;
    if (!memory().load() || !memory().save(record)) resident.setAcquaintance(null);
  };
  addEventListener('pagehide', keep);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keep(); });
}

let offered = false;

/** Show the Home nook's choice or its stable remembered-state / one-action forget control, once per page. */
export function offerToRemember(o: {
  layer: HTMLElement;
  /** A phone's footer gives the note its own flow space instead of covering the maker's words. */
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
  note.innerHTML = '<p class="yoru-note-text"></p><div class="yoru-note-acts"></div>';
  o.layer.append(note);
  const text = note.querySelector<HTMLElement>('.yoru-note-text')!;
  const acts = note.querySelector<HTMLElement>('.yoru-note-acts')!;
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
  const remembered = () => {
    text.textContent = 'Yoru remembers you. only in this browser.';
    acts.innerHTML = '<button type="button" data-forget>Forget me</button>';
    acts.querySelector('button')!.addEventListener('click', () => {
      if (!forgetAcquaintance()) text.textContent = 'This browser wouldn’t remove the memory. You can try again.';
      place();
    });
    place();
  };
  if (memory().load()) remembered();
  else {
    text.innerHTML = 'want me to remember you?<br>only in this browser.<br>next time I’ll know you.<br><a class="yoru-note-details" href="/privacy/#storage">what gets kept?</a>';
    acts.innerHTML = '<button type="button" data-yes>remember me</button><button type="button" data-no>not now</button>';
    acts.querySelector('[data-yes]')!.addEventListener('click', () => {
      const record = newAcquaintance(today());
      if (memory().save(record)) {
        o.resident.setAcquaintance(record);
        remembered();
      } else {
        o.resident.setAcquaintance(null);
        text.textContent = 'I couldn’t keep that in this browser. Remembering is off.';
        acts.replaceChildren();
        place();
      }
    });
    acts.querySelector('[data-no]')!.addEventListener('click', () => {
      note.classList.remove('shown');
      removeEventListener('resize', place);
      removeEventListener('scroll', place);
      setTimeout(() => note.remove(), reducedMotion() ? 0 : 400);
    });
  }
  addEventListener('yoru-forgotten', () => {
    text.textContent = 'Forgotten. Next time he’ll meet you fresh.';
    acts.replaceChildren();
    place();
  });
  addEventListener('yoru-memory-updated', remembered);
  place();
  addEventListener('resize', place);
  addEventListener('scroll', place, { passive: true });
  requestAnimationFrame(() => note.classList.add('shown'));
}
