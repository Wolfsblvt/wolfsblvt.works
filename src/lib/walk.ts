/**
 * The Walk: two frayed lines, orange on the left and magenta on the right, framing the content frame. One shared
 * meander keeps them from becoming parallel rails while the gap between them breathes. Colour fills from each line
 * outwards. Everything is sized from the content, so the Walk frames the page and never grows it.
 */
import { clamp, mulberry32, round1, smoothPath } from './shape';

export type WalkIntensity = 'quiet' | 'standard' | 'bold';

export interface WalkOptions {
  /** Viewport (root) width in CSS pixels. */
  width: number;
  /** Height of the content the Walk frames. */
  height: number;
  /** The content frame's maximum width in rem. */
  frameRem?: number;
  intensity?: WalkIntensity;
  /** The same seed draws the same Walk on every page and every visit. */
  seed?: number;
  /** The 404 version: past the middle the two lines lose each other and the strands loosen. */
  frayEnds?: boolean;
}

export interface WalkPaths {
  width: number;
  height: number;
  fillBlur: number;
  fillLeft: string;
  fillRight: string;
  edgeLeft: string;
  edgeRight: string;
  fillOpacity: number;
  fillOpacityRight: number;
  lineLeft: string;
  lineRight: string;
  glowLeft: string;
  glowRight: string;
  strandsLeft: [string, string];
  strandsRight: [string, string];
}

export const WALK_SEED = 0x57414c4b; // "WALK"

const INTENSITY: Record<WalkIntensity, number> = { quiet: 0.11, standard: 0.16, bold: 0.25 };

type Point = [number, number];

export function buildWalk(options: WalkOptions): WalkPaths {
  const W = options.width;
  const H = Math.max(options.height, 600);
  const gutter = clamp(W * 0.025, 16, 32);
  const frameWidth = Math.min((options.frameRem ?? 80) * 16, W - 2 * gutter);
  const frameX = (W - frameWidth) / 2;
  const narrow = W < 720;
  const ends = options.frayEnds === true;
  const rnd = mulberry32(options.seed ?? WALK_SEED);

  // Phones get their own narrower, gentler meander rather than a scaled copy. The short 404 gets a finer step with
  // the same meander scaled, so the frame holds before it frays.
  const baseStep = narrow ? 620 : 980;
  const step = ends ? 360 : baseStep;
  const k = step / baseStep;
  const n = Math.ceil((H + 1600) / step) + 2;
  const amplitude = narrow ? 0.028 : 0.04;
  const breath = narrow ? 0.016 : 0.035;
  const centre0 = narrow ? 0.5 : 0.475;
  const half0 = narrow ? 0.49 : 0.485;
  const phase = rnd() * 6.28;
  const phase2 = rnd() * 6.28;
  const f1 = 1.25 + rnd() * 0.2;
  const f2 = 0.62 + rnd() * 0.15;

  const L: Point[] = [], R: Point[] = [], GL: Point[] = [], GR: Point[] = [], FL: Point[] = [], FR: Point[] = [];
  const SL1: Point[] = [], SL2: Point[] = [], SR1: Point[] = [], SR2: Point[] = [];
  const jitter = (a: number) => (rnd() - 0.5) * 2 * frameWidth * a;

  for (let i = 0; i < n; i++) {
    const y = -step + i * step + (rnd() - 0.5) * step * 0.18;
    const lost = ends ? Math.pow(clamp((y / Math.max(1, H) - 0.4) / 0.4, 0, 1), 1.6) : 0;
    const centre = centre0 + amplitude * Math.sin(i * f1 * k + phase) + (rnd() - 0.5) * 0.008 + lost * 0.05;
    const half = half0 + breath * Math.sin(i * f2 * k + phase2) + (rnd() - 0.5) * 0.006 + lost * 0.12;
    const lx = frameX + (centre - half) * frameWidth + jitter(0.004) - lost * 40;
    const rx = frameX + (centre + half) * frameWidth + jitter(0.004);
    L.push([lx, y]);
    R.push([rx, y]);
    GL.push([lx + jitter(0.012), y]);
    GR.push([rx + jitter(0.014), y]);
    const big = rnd() < 0.28 ? 2.4 : 1;
    FL.push([lx + jitter((narrow ? 0.012 : 0.022) * big), y + (rnd() - 0.5) * step * 0.3 * k]);
    FR.push([rx + jitter((narrow ? 0.014 : 0.026) * big), y + (rnd() - 0.5) * step * 0.3]);
    SL1.push([lx + jitter(0.003 + lost * 0.03), y + (rnd() - 0.5) * 40]);
    SL2.push([lx + jitter(0.005 + lost * 0.05), y]);
    SR1.push([rx + jitter(0.003 + lost * 0.03), y + (rnd() - 0.5) * 40]);
    SR2.push([rx + jitter(0.005 + lost * 0.05), y]);
  }

  FL.sort((a, b) => a[1] - b[1]);
  FR.sort((a, b) => a[1] - b[1]);
  const y0 = FL[0]![1];
  const yN = FL[FL.length - 1]![1];
  const edgeLeft = smoothPath(FL);
  const edgeRight = smoothPath(FR);
  const fillOpacity = INTENSITY[options.intensity ?? 'standard'] * (narrow ? 0.9 : 1);

  return {
    width: W,
    height: H,
    fillBlur: narrow ? 12 : 30,
    fillLeft: `${edgeLeft} L-160 ${round1(yN)} L-160 ${round1(y0)} Z`,
    fillRight: `${edgeRight} L${W + 160} ${round1(yN)} L${W + 160} ${round1(y0)} Z`,
    edgeLeft,
    edgeRight,
    fillOpacity,
    fillOpacityRight: round1(fillOpacity * 1.12 * 100) / 100,
    lineLeft: smoothPath(L),
    lineRight: smoothPath(R),
    glowLeft: smoothPath(GL),
    glowRight: smoothPath(GR),
    strandsLeft: [smoothPath(SL1), smoothPath(SL2)],
    strandsRight: [smoothPath(SR1), smoothPath(SR2)],
  };
}
