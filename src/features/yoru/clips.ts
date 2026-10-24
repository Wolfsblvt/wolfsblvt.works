/**
 * Yoru's animation clips, as packed by the sprite studio: one sheet and manifest per family
 * (design/yoru/sheets/<family>.{webp,json}). A clip is addressed as "family/name", e.g. "sleep/settle".
 */

export interface PropPlacement {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
}

/** A family manifest as `npm run yoru -- pack` writes it. */
export interface SheetManifest {
  family: string;
  title: string;
  sheet: string;
  cell: { width: number; height: number };
  pivot: { x: number; y: number };
  displayScale: number;
  clips: Record<string, {
    row: number;
    frames: number;
    durations: number[];
    loop: boolean;
    from?: string;
    to?: string;
    prop?: string;
    props?: Array<PropPlacement | null>;
  }>;
}

export interface Clip {
  id: string;
  sheetUrl: string;
  /** Cell and pivot in master pixels; multiply by displayScale for CSS pixels. */
  cell: { width: number; height: number };
  pivot: { x: number; y: number };
  displayScale: number;
  sheetColumns: number;
  sheetRows: number;
  row: number;
  durations: number[];
  loop: boolean;
  prop?: string;
  props?: Array<PropPlacement | null>;
}

export class ClipLibrary {
  readonly #clips = new Map<string, Clip>();

  /** @param families each manifest with the URL its sheet is served from */
  constructor(families: ReadonlyArray<{ manifest: SheetManifest; sheetUrl: string }>) {
    for (const { manifest, sheetUrl } of families) {
      const entries = Object.entries(manifest.clips);
      const sheetColumns = Math.max(...entries.map(([, c]) => c.frames));
      for (const [name, c] of entries) {
        this.#clips.set(`${manifest.family}/${name}`, {
          id: `${manifest.family}/${name}`,
          sheetUrl,
          cell: manifest.cell,
          pivot: manifest.pivot,
          displayScale: manifest.displayScale,
          sheetColumns,
          sheetRows: entries.length,
          row: c.row,
          durations: c.durations,
          loop: c.loop,
          ...(c.prop && { prop: c.prop }),
          ...(c.props && { props: c.props }),
        });
      }
    }
  }

  has(id: string): boolean {
    return this.#clips.has(id);
  }

  get(id: string): Clip {
    const clip = this.#clips.get(id);
    if (!clip) throw new Error(`Unknown Yoru clip "${id}"`);
    return clip;
  }

  /** Total running time of one pass through a clip, in milliseconds. */
  length(id: string): number {
    return this.get(id).durations.reduce((a, b) => a + b, 0);
  }
}
