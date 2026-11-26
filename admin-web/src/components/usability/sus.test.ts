import { describe, expect, it } from 'vitest';
import { isSusResponse, summarizeSus, susScore } from './sus';

// The same worked examples as the server's spec (backend/src/operations/sus.spec.ts):
// this copy exists for the demo workspace and must give the server's numbers.
const best = [5, 1, 5, 1, 5, 1, 5, 1, 5, 1]; // 100
const worst = [1, 5, 1, 5, 1, 5, 1, 5, 1, 5]; // 0
const neutral = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]; // 50
const good = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2]; // 75

describe('the SUS arithmetic, mirrored for the demo', () => {
  it('scores as the server does', () => {
    expect([best, worst, neutral, good].map(susScore)).toEqual([100, 0, 50, 75]);
    expect(susScore([4, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(52.5);
  });

  it('refuses anything that is not ten answers of 1-5', () => {
    expect(isSusResponse([3, 3, 3])).toBe(false);
    expect(isSusResponse([6, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(false);
    expect(() => susScore([3, 3, 3])).toThrow(RangeError);
  });

  it('sums a round up as the server does, holding the figures back below three', () => {
    expect(summarizeSus([best, good], 10).figures).toBeNull();

    const summary = summarizeSus([best, good, neutral, worst], 4);
    expect(summary).toMatchObject({ respondents: 4, responseRate: 100 });
    expect(summary.figures).toMatchObject({
      mean: 56.3,
      median: 62.5,
      min: 0,
      max: 100,
      atOrAboveBenchmark: 2,
      atOrAboveBenchmarkShare: 50,
      distribution: [1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
    });
  });
});
