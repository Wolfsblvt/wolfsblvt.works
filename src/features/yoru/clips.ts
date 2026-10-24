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
    /** Where the scenery channel (a ledge, the ground) was painted in each frame. */
    scenery?: Array<PropPlacement | null>;
    feet?: number[];
    /** For a walk or run: how far one full cycle carries him, in CSS pixels, so his feet stay planted at any tempo. */
    stride?: number;
  }>;
}

export interface Clip {
  id: string;
  sheetUrl: string;
  /** The same sheet at twice the resolution, for high-density screens. */
  sheetUrl2x?: string;
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
  /** Feet below the pivot in each frame, in master pixels (negative when he is above it). */
  feet: number[];
  /** For a walk or run: CSS pixels one full cycle carries him. */
  stride?: number;
}

export class ClipLibrary {
  readonly #clips = new Map<string, Clip>();

  /** @param families each manifest with the URL its sheet is served from, and optionally a 2x sheet */
  constructor(families: ReadonlyArray<{ manifest: SheetManifest; sheetUrl: string; sheetUrl2x?: string }>) {
    for (const { manifest, sheetUrl, sheetUrl2x } of families) {
      const entries = Object.entries(manifest.clips);
      const sheetColumns = Math.max(...entries.map(([, c]) => c.frames));
      for (const [name, c] of entries) {
        this.#clips.set(`${manifest.family}/${name}`, {
          id: `${manifest.family}/${name}`,
          sheetUrl,
          ...(sheetUrl2x && { sheetUrl2x }),
          cell: manifest.cell,
          pivot: manifest.pivot,
          displayScale: manifest.displayScale,
          sheetColumns,
          sheetRows: entries.length,
          row: c.row,
          durations: c.durations,
          loop: c.loop,
          feet: c.feet ?? c.durations.map(() => 0),
          ...(c.prop && { prop: c.prop }),
          ...(c.props && { props: c.props }),
          ...(c.stride && { stride: c.stride }),
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
