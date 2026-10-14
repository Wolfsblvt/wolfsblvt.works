/**
 * The header lockup's scroll ease. At the top of a page the full lockup hangs over the header border; scrolling eases
 * it into the compact 32px drawing on the same curve as the header background. The two drawings share the name, so
 * the ease interpolates corner transforms, the position and size of WORKS and the pen weight. It never crossfades.
 *
 * Shared by the build (initial state) and the browser (every scroll frame).
 */

export const LOCKUP = {
  full: { vb: [-48.16, -99.96, 725.72, 157.73], o: [-64.92, -119.14, 6.05], m: [500.65, -119.14, 6.05], w: [502.8, -16.33, 1.17], wsw: 3.3, ksw: 8.8 },
  compact: { vb: [-41.49, -97.49, 691.59, 158.57], o: [-54.25, -112.16, 4.76], m: [508.24, -112.16, 4.76], w: [471.62, -5.6, 1.54], wsw: 3.9, ksw: 9.9 },
} as const;

export interface MarkFrame {
  viewBox: string;
  style: string;
  width: number;
  height: number;
  marginTop: number;
  orange: string;
  magenta: string;
  works: string;
  worksStroke: number;
  knockoutStroke: number;
  still: boolean;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const r10 = (n: number) => Math.round(n * 10) / 10;

/**
 * @param t header progress, 0 at the top of the page and 1 once settled
 * @param topPx the full lockup's drawn height at the top (60 on desktop)
 * @param narrow phones cap the top height at 42
 * @param still render the finished drawing without its draw-in motion
 */
export function markFrame(t: number, topPx: number, narrow: boolean, still: boolean): MarkFrame {
  const k = t * t * (3 - 2 * t);
  const F = LOCKUP.full;
  const C = LOCKUP.compact;
  const mix = (a: readonly number[], b: readonly number[]) => a.map((v, i) => r2(v + (b[i]! - v) * k));
  const vb = mix(F.vb, C.vb);
  const o = mix(F.o, C.o);
  const m = mix(F.m, C.m);
  const w = mix(F.w, C.w);
  const top = narrow ? Math.min(topPx, 42) : topPx;
  const height = top + (32 - top) * k;
  const width = (height * vb[2]!) / vb[3]!;
  const marginTop = (narrow ? 10 : 7) + (15 - (narrow ? 10 : 7)) * k;
  return {
    viewBox: vb.join(' '),
    style: `width:${r10(width)}px;height:${r10(height)}px;margin-top:${r10(marginTop)}px`,
    width: r10(width),
    height: r10(height),
    marginTop: r10(marginTop),
    orange: `translate(${o[0]} ${o[1]}) scale(${o[2]})`,
    magenta: `translate(${m[0]} ${m[1]}) scale(${m[2]})`,
    works: `translate(${w[0]} ${w[1]}) scale(${w[2]}) skewX(-7)`,
    worksStroke: r2(F.wsw + (C.wsw - F.wsw) * k),
    knockoutStroke: r2(F.ksw + (C.ksw - F.ksw) * k),
    still,
  };
}
