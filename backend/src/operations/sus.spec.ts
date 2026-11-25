import { isSusResponse, summarizeSus, SUS_BENCHMARK, susScore } from './sus';

// Answer sets with scores worked out by hand from Brooke's rule.
const best = [5, 1, 5, 1, 5, 1, 5, 1, 5, 1]; // 4 × 10 = 40 → 100
const worst = [1, 5, 1, 5, 1, 5, 1, 5, 1, 5]; // 0 → 0
const neutral = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3]; // 2 × 10 = 20 → 50
const good = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2]; // 3 × 10 = 30 → 75

describe('SUS: one person’s score', () => {
  it('scores the ends of the scale 0 and 100, and the middle 50', () => {
    expect(susScore(best)).toBe(100);
    expect(susScore(worst)).toBe(0);
    expect(susScore(neutral)).toBe(50);
  });

  it('counts agreeing with an odd statement up and with an even one down', () => {
    // S1 "I would like to use it frequently" agreed with: + (5 − 1).
    // S2 "unnecessarily complex" agreed with: + (5 − 5), nothing.
    expect(susScore([5, 5, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(50 + 2.5 * 2 - 2.5 * 2);
    expect(susScore(good)).toBe(75);
  });

  it('moves in steps of 2.5', () => {
    expect(susScore([4, 3, 3, 3, 3, 3, 3, 3, 3, 3])).toBe(52.5);
  });

  it.each([
    ['nine answers', [3, 3, 3, 3, 3, 3, 3, 3, 3]],
    ['eleven answers', [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
    ['a 0', [0, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
    ['a 6', [6, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
    ['a half', [2.5, 3, 3, 3, 3, 3, 3, 3, 3, 3]],
  ])('refuses %s rather than scoring something that is not a response', (_label, answers) => {
    expect(isSusResponse(answers)).toBe(false);
    expect(() => susScore(answers as number[])).toThrow(RangeError);
  });
});

describe('SUS: a round summed up', () => {
  it('says how many answered out of how many could', () => {
    const summary = summarizeSus([best, good, neutral], 10);

    expect(summary.respondents).toBe(3);
    expect(summary.members).toBe(10);
    expect(summary.responseRate).toBe(30);
    expect(summary.benchmark).toBe(SUS_BENCHMARK);
  });

  it('keeps the figures back until three have answered, so nobody’s own score is shown', () => {
    const summary = summarizeSus([best, good], 10);

    expect(summary.respondents).toBe(2);
    expect(summary.figures).toBeNull();
  });

  it('gives the average, the spread and the share at or above 68', () => {
    // Scores 100, 75 and 50.
    const { figures } = summarizeSus([best, good, neutral], 3);

    expect(figures).toMatchObject({
      mean: 75,
      median: 75,
      // √(((100 − 75)² + 0² + (50 − 75)²) / (3 − 1)) = √625
      standardDeviation: 25,
      min: 50,
      max: 100,
      atOrAboveBenchmark: 2,
      atOrAboveBenchmarkShare: 66.7,
    });
  });

  it('counts scores in bands of ten, with 100 in the top band', () => {
    const { figures } = summarizeSus([best, good, neutral, worst], 4);

    expect(figures?.distribution).toEqual([1, 0, 0, 0, 0, 1, 0, 1, 0, 1]);
  });

  it('averages each statement as answered, not as scored', () => {
    const { figures } = summarizeSus([best, good, neutral], 3);

    // S1: (5 + 4 + 3) / 3; S2: (1 + 2 + 3) / 3.
    expect(figures?.itemMeans.slice(0, 2)).toEqual([4, 2]);
  });

  it('leaves out a response that is not complete instead of scoring it', () => {
    const summary = summarizeSus([best, good, neutral, [3, 3, 3]], 4);

    expect(summary.respondents).toBe(3);
  });

  it('has no response rate for an organization with nobody in it', () => {
    expect(summarizeSus([], 0).responseRate).toBeNull();
  });
});
