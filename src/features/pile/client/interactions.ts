/**
 * Entries with their own behaviour, as one explicit table of bundled lazy imports. An ordinary entry needs no line
 * here; a scripted one adds one. Interactions mount once, when Endless is open and the entry approaches the viewport,
 * and own only their root. A failed import leaves the entry's static content usable.
 */
export interface InteractionContext {
  signal: AbortSignal;
  navigateToEntry(id: string): Promise<'arrived' | 'cancelled'>;
}

export interface InteractionModule {
  mount(root: HTMLElement, context: InteractionContext): void;
}

const LOADERS: Record<string, () => Promise<InteractionModule>> = {
  'ex-dice': () => import('../entries/ex-dice/interaction'),
};

export function mountInteractions(section: HTMLElement, host: Pick<InteractionContext, 'navigateToEntry'>): { activate(): void } {
  const controller = new AbortController();
  const mounted = new Set<string>();
  let observer: IntersectionObserver | null = null;

  const mountOne = (root: HTMLElement) => {
    const id = root.dataset.interaction!;
    const load = LOADERS[id];
    if (!load || mounted.has(id)) return;
    mounted.add(id);
    load()
      .then((module) => module.mount(root, { signal: controller.signal, navigateToEntry: host.navigateToEntry }))
      .catch((error) => console.warn(`Interaction for ${id} could not load; its static content stays.`, error));
  };

  return {
    activate() {
      if (observer) return;
      const roots = [...section.querySelectorAll<HTMLElement>('[data-interaction]')];
      if (!('IntersectionObserver' in window)) {
        roots.forEach(mountOne);
        return;
      }
      observer = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        observer?.unobserve(e.target);
        mountOne(e.target as HTMLElement);
      }), { rootMargin: '0px 0px 300px 0px' });
      roots.forEach((root) => observer!.observe(root));
    },
  };
}
