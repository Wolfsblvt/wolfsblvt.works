/**
 * Entries with their own behaviour: an `interaction.ts` under entries/<id>/, discovered by file and bundled as a lazy
 * import. An ordinary entry needs no script; a scripted one adds the file and marks its root `data-interaction=<id>`.
 * Interactions mount once, when Endless is open and the entry approaches the viewport, and own only their root. A
 * failed import leaves the entry's static content usable.
 */
export interface InteractionContext {
  signal: AbortSignal;
  navigateToEntry(id: string): Promise<'arrived' | 'cancelled'>;
}

export interface InteractionModule {
  mount(root: HTMLElement, context: InteractionContext): void;
}

const modules = import.meta.glob<InteractionModule>('../entries/*/interaction.ts');
const LOADERS = new Map(Object.entries(modules).map(([path, load]) => [path.split('/').at(-2)!, load]));

export function mountInteractions(section: HTMLElement, host: Pick<InteractionContext, 'navigateToEntry'>): { activate(): void } {
  const controller = new AbortController();
  const mounted = new Set<string>();
  let observer: IntersectionObserver | null = null;

  const mountOne = (root: HTMLElement) => {
    const id = root.dataset.interaction!;
    const load = LOADERS.get(id);
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
