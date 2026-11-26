/**
 * The System Usability Scale - measure K7 of the thesis (Chapter 1, table
 * `kpi`; the questionnaire is Appendix B) - scored the way Brooke defined it.
 *
 * Pure functions, like the K1-K6 measures in monthly-measurements.ts: the
 * service reads the answers, these turn them into numbers, and the tests pin
 * the arithmetic without a database. The web mirrors `susScore` for its demo
 * workspace (admin-web/src/components/usability/sus.ts); a change here is a
 * change there.
 */

/** Ten statements, each answered from 1 (strongly disagree) to 5 (strongly agree). */
export const SUS_ITEMS = 10;
export const SUS_MIN_ANSWER = 1;
export const SUS_MAX_ANSWER = 5;

/** The average across published studies (Bangor et al.); the thesis target for K7 is at or above it. */
export const SUS_BENCHMARK = 68;

/**
 * Below this many respondents the summary keeps its numbers back. With one
 * or two answers in, an average is somebody's own score, and an administrator
 * who knows who has answered could read it - which is how a questionnaire
 * stops getting honest answers.
 */
export const SUS_MIN_RESPONDENTS = 3;

/** Whether `answers` is a complete SUS response: ten whole numbers from 1 to 5. */
export const isSusResponse = (answers: unknown): answers is number[] =>
  Array.isArray(answers) &&
  answers.length === SUS_ITEMS &&
  answers.every((value) => Number.isInteger(value) && value >= SUS_MIN_ANSWER && value <= SUS_MAX_ANSWER);

/**
 * One person's score, 0-100, in steps of 2.5.
 *
 * Odd statements are worded positively ("I thought the system was easy to
 * use"), so agreeing adds: answer − 1. Even ones are worded negatively ("I
 * found the system unnecessarily complex"), so agreeing takes away: 5 − answer.
 * Each contributes 0-4; ten of them make 0-40, and × 2.5 puts it on 0-100.
 */
export const susScore = (answers: number[]): number => {
  if (!isSusResponse(answers)) {
    throw new RangeError(`A SUS response is ${SUS_ITEMS} whole numbers from ${SUS_MIN_ANSWER} to ${SUS_MAX_ANSWER}`);
  }
  const contributions = answers.map((value, index) => (index % 2 === 0 ? value - 1 : 5 - value));
  return contributions.reduce((sum, value) => sum + value, 0) * 2.5;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const median = (sorted: number[]) => {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

/** The figures for a round, once there are enough answers to show them. */
export interface SusFigures {
  mean: number;
  median: number;
  /** Sample standard deviation (n − 1); 0 for a single answer. */
  standardDeviation: number;
  min: number;
  max: number;
  /** How many scored at or above the benchmark, and their share in percent. */
  atOrAboveBenchmark: number;
  atOrAboveBenchmarkShare: number;
  /** Scores counted in bands of ten: [0-10), [10-20) … [90-100]. */
  distribution: number[];
  /** The average answer (1-5) to each statement, S1 … S10, as given - not reversed. */
  itemMeans: number[];
}

export interface SusSummary {
  respondents: number;
  /** Active members of the organization, the people who could have answered. */
  members: number;
  /** respondents / members, in percent; null with no members. */
  responseRate: number | null;
  benchmark: number;
  minRespondents: number;
  /** Null while fewer than `minRespondents` have answered (see SUS_MIN_RESPONDENTS). */
  figures: SusFigures | null;
}

/**
 * What a round's answers come to: how many answered out of how many could,
 * and - with enough of them - the scores. Incomplete responses cannot be
 * stored (the service validates), but any that were are left out rather than
 * scored as something they are not.
 */
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
  const variance =
    respondents > 1 ? scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / (respondents - 1) : 0;
  const atOrAboveBenchmark = scores.filter((score) => score >= SUS_BENCHMARK).length;
  const distribution = Array.from({ length: 10 }, () => 0);
  for (const score of scores) distribution[Math.min(9, Math.floor(score / 10))] += 1;
  const itemMeans = Array.from({ length: SUS_ITEMS }, (_, item) =>
    round1(complete.reduce((sum, answers) => sum + answers[item], 0) / respondents),
  );

  return {
    ...base,
    figures: {
      mean: round1(mean),
      median: round1(median(scores)),
      standardDeviation: round1(Math.sqrt(variance)),
      min: scores[0],
      max: scores[scores.length - 1],
      atOrAboveBenchmark,
      atOrAboveBenchmarkShare: round1((atOrAboveBenchmark / respondents) * 100),
      distribution,
      itemMeans,
    },
  };
};
