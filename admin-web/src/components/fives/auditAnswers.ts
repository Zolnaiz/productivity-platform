import { AuditRun, AuditTemplate } from '../../types/operations.types';

/** What somebody has typed or tapped so far, question id to raw value. */
export type AuditAnswers = Record<string, string>;

/**
 * A score question with no maximum of its own is marked out of five.
 *
 * The scale is the one 5S checklists are written on, and it is here rather
 * than at each call site so a template that omits `maxScore` means the same
 * thing wherever it is answered.
 */
const DEFAULT_MAX_SCORE = 5;

/**
 * The percentage a set of answers earns against a template.
 *
 * This was written inside the audit page, where nothing else could reach it.
 * The checklist is now answered from two places — a desk and a phone standing
 * in the area — and a second copy of the arithmetic is how two screens come to
 * disagree about the same walk.
 *
 * Text answers score nothing: they are evidence, not measurement. An
 * unanswered score question earns zero rather than being skipped, because a
 * walk that did not look at something has not passed it.
 */
export const scoreAnswers = (
  template: Pick<AuditTemplate, 'questions'> | undefined,
  answers: AuditAnswers,
): number => {
  if (!template) return 0;

  let earned = 0;
  let possible = 0;

  template.questions.forEach((question) => {
    if (question.type === 'score') {
      possible += question.maxScore || DEFAULT_MAX_SCORE;
      earned += Number(answers[question.id] || 0);
    }

    if (question.type === 'yes_no') {
      possible += 1;
      earned += answers[question.id] === 'yes' ? 1 : 0;
    }
  });

  return possible ? Math.round((earned / possible) * 100) : 0;
};

/**
 * The answers as the run stores them: numbers for scores, booleans for yes/no,
 * the words themselves for text.
 *
 * Kept beside the scoring for the same reason — what is counted and what is
 * recorded have to describe the same answer.
 */
export const answersForRun = (
  template: Pick<AuditTemplate, 'questions'> | undefined,
  answers: AuditAnswers,
): AuditRun['answers'] =>
  (template?.questions ?? []).map((question) => ({
    questionId: question.id,
    value:
      question.type === 'score'
        ? Number(answers[question.id] || 0)
        : question.type === 'yes_no'
          ? answers[question.id] === 'yes'
          : answers[question.id] || '',
  }));
