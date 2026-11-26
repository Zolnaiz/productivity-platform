/**
 * The SUS arithmetic, mirrored from the server (backend/src/operations/sus.ts)
 * for the demo workspace, which has no server to ask - "a demo mirror for every
 * server rule a screen depends on" (docs/DECISIONS.md). The real workspace
 * shows the server's numbers; sus.test.ts holds this copy to the same worked
 * examples as the server's spec, so the two cannot drift unnoticed.
 */

export const SUS_ITEMS = 10;
export const SUS_BENCHMARK = 68;
export const SUS_MIN_RESPONDENTS = 3;

/** The five answers, 1 = strongly disagree … 5 = strongly agree. */
export const SUS_SCALE = [1, 2, 3, 4, 5] as const;

export interface SusFigures {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  atOrAboveBenchmark: number;
  atOrAboveBenchmarkShare: number;
  /** Scores in bands of ten: [0-10) … [90-100]. */
  distribution: number[];
  /** The average answer (1-5) to S1 … S10, as given. */
  itemMeans: number[];
}

export interface SusSummary {
  respondents: number;
  members: number;
  responseRate: number | null;
  benchmark: number;
  minRespondents: number;
  /** Null below `minRespondents`, so nobody's own score is shown. */
  figures: SusFigures | null;
}

export const isSusResponse = (answers: unknown): answers is number[] =>
  Array.isArray(answers) &&
  answers.length === SUS_ITEMS &&
  answers.every((value) => Number.isInteger(value) && value >= 1 && value <= 5);

/** Odd statements count agreement up (answer − 1), even ones down (5 − answer); the sum × 2.5. */
export const susScore = (answers: number[]): number => {
  if (!isSusResponse(answers)) throw new RangeError('A SUS response is ten whole numbers from 1 to 5');
  return answers.reduce((sum, value, index) => sum + (index % 2 === 0 ? value - 1 : 5 - value), 0) * 2.5;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export const summarizeSus = (responses: number[][], members: number): SusSummary => {
  const complete = responses.filter(isSusResponse);
  const respondents = complete.length;
  const base = {
    respondents,
    members,
    responseRate: members > 0 ? round1((respondents / members) * 100) : null,
    benchmark: SUS_BENCHMARK,
    minRespondents: SUS_MIN_RESPONDENTS,
  };
  if (respondents < SUS_MIN_RESPONDENTS) return { ...base, figures: null };

  const scores = complete.map(susScore).sort((a, b) => a - b);
  const mean = scores.reduce((sum, score) => sum + score, 0) / respondents;
  const variance = respondents > 1 ? scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / (respondents - 1) : 0;
  const middle = Math.floor(respondents / 2);
  const median = respondents % 2 ? scores[middle] : (scores[middle - 1] + scores[middle]) / 2;
  const atOrAboveBenchmark = scores.filter((score) => score >= SUS_BENCHMARK).length;
  const distribution = Array.from({ length: 10 }, () => 0);
  for (const score of scores) distribution[Math.min(9, Math.floor(score / 10))] += 1;

  return {
    ...base,
    figures: {
      mean: round1(mean),
      median: round1(median),
      standardDeviation: round1(Math.sqrt(variance)),
      min: scores[0],
      max: scores[scores.length - 1],
      atOrAboveBenchmark,
      atOrAboveBenchmarkShare: round1((atOrAboveBenchmark / respondents) * 100),
      distribution,
      itemMeans: Array.from({ length: SUS_ITEMS }, (_, item) =>
        round1(complete.reduce((sum, answers) => sum + answers[item], 0) / respondents),
      ),
    },
  };
};
