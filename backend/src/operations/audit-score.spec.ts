import { scoreFromAnswers } from './audit-score';

const questions = [
  { id: 'q1', text: 'Sorted', type: 'score' as const, maxScore: 5 },
  { id: 'q2', text: 'Labelled', type: 'score' as const },
  { id: 'q3', text: 'Aisle clear', type: 'yes_no' as const },
  { id: 'q4', text: 'What was found', type: 'text' as const },
];

describe('scoring an audit run on the server', () => {
  it.each([
    ['full marks', [{ questionId: 'q1', value: 5 }, { questionId: 'q2', value: 5 }, { questionId: 'q3', value: true }], 100],
    // 3 + 2 + 0 of 5 + 5 + 1
    ['part marks and a no', [{ questionId: 'q1', value: 3 }, { questionId: 'q2', value: 2 }, { questionId: 'q3', value: false }], 45],
    ['a yes sent as text counts as a yes', [{ questionId: 'q1', value: 5 }, { questionId: 'q2', value: 5 }, { questionId: 'q3', value: 'yes' }], 100],
    ['an unanswered question earns nought', [{ questionId: 'q1', value: 5 }], 45],
    ['nothing answered', [], 0],
    ['text answers earn nothing', [{ questionId: 'q4', value: 'Pallet in the aisle' }], 0],
  ])('%s', (_name, answers, expected) => {
    expect(scoreFromAnswers(questions, answers as never)).toBe(expected);
  });

  it('holds a value to its question’s range, so no answer counts for more than it is worth', () => {
    expect(scoreFromAnswers(questions, [{ questionId: 'q1', value: 500 }, { questionId: 'q2', value: -3 }] as never)).toBe(45);
  });

  it('treats a value that is not a number as nought', () => {
    expect(scoreFromAnswers(questions, [{ questionId: 'q1', value: 'lots' }] as never)).toBe(0);
  });

  it('ignores answers to questions the checklist does not have', () => {
    expect(scoreFromAnswers(questions, [{ questionId: 'q9', value: 5 }] as never)).toBe(0);
  });

  it('has no score for a checklist with nothing to score', () => {
    expect(scoreFromAnswers([{ id: 'q4', text: 'Notes', type: 'text' }], [{ questionId: 'q4', value: 'ok' }])).toBeNull();
    expect(scoreFromAnswers(undefined, [])).toBeNull();
  });
});
