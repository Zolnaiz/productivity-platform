import { AuditRun } from './entities/audit-run.entity';
import { AuditTemplate } from './entities/audit-template.entity';

/** A score question with no maximum of its own is marked out of five, as on the web and the phone. */
const DEFAULT_MAX_SCORE = 5;

/**
 * The percentage a run's answers earn against its checklist, worked out on
 * the server.
 *
 * The web (`auditAnswers.ts`) and the phone (`five_s_model.dart`) score a walk
 * as it is answered and send the result, and the server used to keep that
 * number as it came. It decides whether an area gets corrective work and goes
 * into K3, so it is recomputed here from the answers by the same rule: a
 * score question earns its value, a yes/no question one for a yes, text is
 * evidence and earns nothing, and an unanswered question earns nought. A
 * value outside the question's range is held to it, so no answer counts for
 * more than the question is worth.
 *
 * Null when the checklist has nothing to score: there is nothing to work the
 * number out from, and the run keeps the score it was sent.
 */
export const scoreFromAnswers = (
  questions: AuditTemplate['questions'] | undefined,
  answers: AuditRun['answers'] | undefined,
): number | null => {
  const given = new Map((answers ?? []).map((answer) => [answer.questionId, answer.value]));
  let earned = 0;
  let possible = 0;

  for (const question of questions ?? []) {
    const value = given.get(question.id);
    if (question.type === 'score') {
      const outOf = question.maxScore || DEFAULT_MAX_SCORE;
      const points = Number(value);
      possible += outOf;
      earned += Number.isFinite(points) ? Math.min(Math.max(points, 0), outOf) : 0;
    }
    if (question.type === 'yes_no') {
      possible += 1;
      earned += value === true || value === 'yes' ? 1 : 0;
    }
  }

  return possible ? Math.round((earned / possible) * 100) : null;
};
