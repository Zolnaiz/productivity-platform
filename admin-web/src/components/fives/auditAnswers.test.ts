import { describe, expect, it } from 'vitest';
import { answersForRun, scoreAnswers } from './auditAnswers';

const template = (questions: Array<Record<string, unknown>>) =>
  ({ questions } as Parameters<typeof scoreAnswers>[0]);

describe('what a walk of a checklist is worth', () => {
  it('marks score questions out of five unless the template says otherwise', () => {
    const checklist = template([
      { id: 'q1', text: 'Sort', type: 'score' },
      { id: 'q2', text: 'Set in order', type: 'score', maxScore: 10 },
    ]);

    // 5 of 5 and 5 of 10 is ten of fifteen.
    expect(scoreAnswers(checklist, { q1: '5', q2: '5' })).toBe(67);
  });

  it('counts an unanswered question as zero, not as skipped', () => {
    // A walk that did not look at something has not passed it — dropping the
    // question from the denominator would make a half-done walk read as full
    // marks, which is the one number nobody would question.
    const checklist = template([
      { id: 'q1', text: 'Sort', type: 'score' },
      { id: 'q2', text: 'Shine', type: 'score' },
    ]);

    expect(scoreAnswers(checklist, { q1: '5' })).toBe(50);
  });

  it('gives a yes one point and a no none', () => {
    const checklist = template([
      { id: 'q1', text: 'Labelled?', type: 'yes_no' },
      { id: 'q2', text: 'Swept?', type: 'yes_no' },
    ]);

    expect(scoreAnswers(checklist, { q1: 'yes', q2: 'no' })).toBe(50);
  });

  it('scores nothing for text, which is evidence rather than measurement', () => {
    const checklist = template([
      { id: 'q1', text: 'Sort', type: 'score' },
      { id: 'q2', text: 'Anything else?', type: 'text' },
    ]);

    expect(scoreAnswers(checklist, { q1: '5', q2: 'the bin by the door is full' })).toBe(100);
  });

  it('is zero for a checklist with nothing to measure, rather than full marks', () => {
    expect(scoreAnswers(template([{ id: 'q1', text: 'Notes', type: 'text' }]), {})).toBe(0);
    expect(scoreAnswers(undefined, {})).toBe(0);
  });

  it('records each answer as the kind of thing it is', () => {
    const checklist = template([
      { id: 'q1', text: 'Sort', type: 'score' },
      { id: 'q2', text: 'Labelled?', type: 'yes_no' },
      { id: 'q3', text: 'Anything else?', type: 'text' },
    ]);

    expect(answersForRun(checklist, { q1: '4', q2: 'yes', q3: 'spill by the press' })).toEqual([
      { questionId: 'q1', value: 4 },
      { questionId: 'q2', value: true },
      { questionId: 'q3', value: 'spill by the press' },
    ]);
  });

  it('records an unanswered question rather than leaving a hole in the run', () => {
    const checklist = template([
      { id: 'q1', text: 'Sort', type: 'score' },
      { id: 'q2', text: 'Labelled?', type: 'yes_no' },
    ]);

    expect(answersForRun(checklist, {})).toEqual([
      { questionId: 'q1', value: 0 },
      { questionId: 'q2', value: false },
    ]);
  });
});
