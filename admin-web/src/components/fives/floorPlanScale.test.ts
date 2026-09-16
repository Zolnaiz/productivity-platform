import { describe, expect, it } from 'vitest';
import { CANVAS_HEIGHT, CANVAS_WIDTH, GRID_SIZE } from './floorPlanGeometry';
import {
  DEFAULT_METRES_PER_UNIT,
  areaOf,
  calibrate,
  clampScale,
  formatArea,
  formatLength,
  formatSize,
  niceBarLength,
  scaleOf,
  toMetres,
  toUnits,
} from './floorPlanScale';

describe('the default scale', () => {
  it('makes one grid square one metre', () => {
    // What the old free-text scale already claimed, so plans drawn before this
    // arrive at the size their author was picturing.
    expect(toMetres(GRID_SIZE, DEFAULT_METRES_PER_UNIT)).toBeCloseTo(1, 10);
  });

  it('puts the canvas at a plausible size for a floor', () => {
    const width = toMetres(CANVAS_WIDTH, DEFAULT_METRES_PER_UNIT);
    const height = toMetres(CANVAS_HEIGHT, DEFAULT_METRES_PER_UNIT);

    expect(width).toBeCloseTo(37.5, 1);
    expect(height).toBeCloseTo(20.83, 1);
  });

  it('is what a plan with no scale recorded is read at', () => {
    expect(scaleOf(null)).toBe(DEFAULT_METRES_PER_UNIT);
    expect(scaleOf({})).toBe(DEFAULT_METRES_PER_UNIT);
  });

  it('is used rather than a nonsense value somebody stored', () => {
    // A zero would make every length zero and every area zero, silently.
    expect(scaleOf({ metresPerUnit: 0 })).toBe(DEFAULT_METRES_PER_UNIT);
    expect(scaleOf({ metresPerUnit: -1 })).toBe(DEFAULT_METRES_PER_UNIT);
    expect(scaleOf({ metresPerUnit: Number.NaN })).toBe(DEFAULT_METRES_PER_UNIT);
  });

  it('uses a real scale when there is one', () => {
    expect(scaleOf({ metresPerUnit: 0.1 })).toBe(0.1);
  });
});

describe('converting between the canvas and the world', () => {
  const scale = 0.05; // 20 units to the metre

  it('reads a length in metres', () => {
    expect(toMetres(200, scale)).toBe(10);
  });

  it('goes back the other way', () => {
    expect(toUnits(10, scale)).toBe(200);
  });

  it('round-trips', () => {
    expect(toUnits(toMetres(137, scale), scale)).toBeCloseTo(137, 10);
  });

  it('does not divide by a scale of zero', () => {
    expect(toUnits(10, 0)).toBe(0);
  });
});

describe('writing a measurement down', () => {
  it('says centimetres below a metre', () => {
    // "40 cm" is how a person says it; "0.4 m" is how a drawing tool does.
    expect(formatLength(0.4)).toBe('40 cm');
    expect(formatLength(0.04)).toBe('4 cm');
  });

  it('says metres to one decimal above that', () => {
    // A plan drawn by dragging is not accurate to the millimetre, and four
    // digits would claim it was.
    expect(formatLength(6.42)).toBe('6.4 m');
    expect(formatLength(12)).toBe('12.0 m');
  });

  it('writes an area the same way', () => {
    expect(formatArea(26.88)).toBe('26.9 m²');
  });

  it('says nothing rather than NaN', () => {
    expect(formatLength(Number.NaN)).toBe('—');
    expect(formatArea(Number.NaN)).toBe('—');
  });

  it('writes both sides of a box on one line', () => {
    expect(formatSize({ width: 128, height: 84 }, 0.05)).toBe('6.4 × 4.2 m');
  });
});

describe('the area of a zone', () => {
  it('multiplies the two real sides', () => {
    expect(areaOf({ width: 128, height: 84 }, 0.05)).toBeCloseTo(26.88, 6);
  });

  it('follows the scale rather than the pixels', () => {
    // The same rectangle on a plan calibrated twice as coarse covers four
    // times the ground.
    const box = { width: 100, height: 100 };

    expect(areaOf(box, 0.1)).toBeCloseTo(areaOf(box, 0.05) * 4, 6);
  });
});

describe('calibrating from something of known length', () => {
  it('works out the scale from a measured line', () => {
    // A line 200 units long that somebody says is 10 m.
    expect(calibrate(200, 10)).toBeCloseTo(0.05, 10);
  });

  it('makes everything already drawn come out at the right size', () => {
    const scale = calibrate(200, 10) as number;

    expect(toMetres(400, scale)).toBeCloseTo(20, 10);
  });

  it('refuses a measurement that cannot mean anything', () => {
    expect(calibrate(0, 10)).toBeNull();
    expect(calibrate(200, 0)).toBeNull();
    expect(calibrate(-5, 10)).toBeNull();
  });

  it('keeps the result inside believable limits', () => {
    // A line one unit long called a kilometre is a slip, not a plan.
    expect(calibrate(1, 100000)).toBe(clampScale(100000));
    expect(calibrate(100000, 0.001)).toBe(clampScale(0.001 / 100000));
  });
});

describe('the scale bar', () => {
  it('picks a round number a legend would use', () => {
    [1, 2, 5, 10, 20, 50, 100].forEach((expected) => {
      const bar = niceBarLength(expected * 4);
      expect([1, 2, 5, 10, 20, 50, 100, 200, 500]).toContain(bar);
    });
  });

  it('shrinks as the view zooms in', () => {
    expect(niceBarLength(40)).toBeGreaterThan(niceBarLength(4));
  });

  it('never returns zero, whatever it is handed', () => {
    expect(niceBarLength(0)).toBe(1);
    expect(niceBarLength(-10)).toBe(1);
  });

  it('stays under about a quarter of what is on screen', () => {
    [3, 12, 37.5, 120].forEach((visible) => {
      expect(niceBarLength(visible)).toBeLessThanOrEqual(visible / 2);
    });
  });
});
