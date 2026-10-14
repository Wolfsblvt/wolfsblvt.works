import { describe, expect, it } from 'vitest';
import { LOCKUP, markFrame } from '../../src/lib/mark-ease';
import { buildWalk } from '../../src/lib/walk';

describe('the Walk', () => {
  it('draws the same Walk for the same size', () => {
    expect(buildWalk({ width: 1440, height: 6000 })).toEqual(buildWalk({ width: 1440, height: 6000 }));
  });

  it('is sized from the content, never smaller than a screen', () => {
    expect(buildWalk({ width: 1440, height: 6000 }).height).toBe(6000);
    expect(buildWalk({ width: 1440, height: 120 }).height).toBe(600);
  });

  it('uses its own gentler meander on phones', () => {
    expect(buildWalk({ width: 390, height: 3000 }).lineLeft).not.toEqual(buildWalk({ width: 1440, height: 3000 }).lineLeft);
    expect(buildWalk({ width: 390, height: 3000 }).fillBlur).toBe(12);
  });
});

describe('the header lockup ease', () => {
  it('starts as the full drawing and settles on the compact 32px drawing', () => {
    expect(markFrame(0, 60, false, false).viewBox).toBe(LOCKUP.full.vb.join(' '));
    expect(markFrame(0, 60, false, false).height).toBe(60);
    expect(markFrame(1, 60, false, false).viewBox).toBe(LOCKUP.compact.vb.join(' '));
    expect(markFrame(1, 60, false, false).height).toBe(32);
  });

  it('caps the top size on phones', () => {
    expect(markFrame(0, 60, true, false).height).toBe(42);
  });
});
