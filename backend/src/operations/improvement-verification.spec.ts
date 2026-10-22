import { verifyImprovements } from './improvement-verification';

const failing = { id: 'r1', zoneId: 'z1', status: 'submitted', score: 60, createdAt: '2026-03-01T03:00:00Z' };
const fix = (over: Record<string, unknown> = {}) => ({
  id: 't1', title: 'Fix A01', sourceType: 'audit_run', sourceId: 'r1', status: 'done',
  completedAt: '2026-03-05T03:00:00Z', ...over,
});

describe('PDCA check: verifying audit-raised fixes', () => {
  it.each([
    ['still open', fix({ status: 'in_progress', completedAt: null }), [], 'open'],
    ['done, area not audited since', fix(), [], 'awaiting_reaudit'],
    ['done before completion dates were kept: not open, not matched', fix({ completedAt: null }), [{ id: 'r2', zoneId: 'z1', status: 'submitted', score: 95, createdAt: '2026-03-06T03:00:00Z' }], 'done_undated'],
    ['an audit before the fix was closed does not count', fix(), [{ id: 'r2', zoneId: 'z1', status: 'submitted', score: 95, createdAt: '2026-03-04T03:00:00Z' }], 'awaiting_reaudit'],
    ['re-audit meets the standard', fix(), [{ id: 'r2', zoneId: 'z1', status: 'submitted', score: 90, createdAt: '2026-03-06T03:00:00Z' }], 'verified'],
    ['exactly the standard is verified', fix(), [{ id: 'r2', zoneId: 'z1', status: 'completed', score: 85, createdAt: '2026-03-06T03:00:00Z' }], 'verified'],
    ['better but below standard', fix(), [{ id: 'r2', zoneId: 'z1', status: 'submitted', score: 75, createdAt: '2026-03-06T03:00:00Z' }], 'improved'],
    ['same or worse', fix(), [{ id: 'r2', zoneId: 'z1', status: 'submitted', score: 60, createdAt: '2026-03-06T03:00:00Z' }], 'not_improved'],
    ['a draft re-audit does not count', fix(), [{ id: 'r2', zoneId: 'z1', status: 'draft', score: 99, createdAt: '2026-03-06T03:00:00Z' }], 'awaiting_reaudit'],
    ['another zone’s audit does not count', fix(), [{ id: 'r2', zoneId: 'z2', status: 'submitted', score: 99, createdAt: '2026-03-06T03:00:00Z' }], 'awaiting_reaudit'],
  ])('%s', (_name, task, laterRuns, expected) => {
    const result = verifyImprovements([task as never], [failing, ...(laterRuns as never[])]);
    expect(result.fixes[0].status).toBe(expected);
  });

  it('uses the first audit after closing, not a later one', () => {
    const result = verifyImprovements([fix() as never], [
      failing,
      { id: 'late', zoneId: 'z1', status: 'submitted', score: 95, createdAt: '2026-03-20T03:00:00Z' },
      { id: 'first', zoneId: 'z1', status: 'submitted', score: 70, createdAt: '2026-03-07T03:00:00Z' },
    ]);
    expect(result.fixes[0]).toMatchObject({ status: 'improved', reauditRunId: 'first', reauditScore: 70, triggerScore: 60, delta: 10 });
  });

  it('summarises with the report’s measurement shape; null when nothing has been re-audited', () => {
    expect(verifyImprovements([fix() as never], [failing]).verificationRate).toEqual({ value: null, numerator: 0, denominator: 0, excluded: 0 });

    const runs = [
      failing,
      { id: 'r3', zoneId: 'z3', status: 'submitted', score: 50, createdAt: '2026-03-01T03:00:00Z' },
      { id: 'a', zoneId: 'z1', status: 'submitted', score: 92, createdAt: '2026-03-06T03:00:00Z' },
      { id: 'b', zoneId: 'z3', status: 'submitted', score: 40, createdAt: '2026-03-06T03:00:00Z' },
    ];
    const result = verifyImprovements(
      [fix() as never, fix({ id: 't3', sourceId: 'r3' }) as never, fix({ id: 't4', sourceId: 'missing' }) as never, fix({ id: 't5', sourceType: 'idea' }) as never],
      runs as never,
    );
    expect(result.counts).toEqual({
      open: 0,
      doneUndated: 0,
      awaitingReaudit: 0,
      verified: 1,
      improved: 0,
      notImproved: 1,
      rootCauseRecorded: 0,
      signedOff: 0,
    });
    expect(result.verificationRate).toEqual({ value: 50, numerator: 1, denominator: 2, excluded: 1 });
  });

  it('counts an undated done fix as excluded from the rate, never as open', () => {
    const result = verifyImprovements([fix({ completedAt: null }) as never], [failing]);
    expect(result.counts).toMatchObject({ open: 0, doneUndated: 1 });
    expect(result.verificationRate).toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
  });

  it('carries the root cause and the manager’s sign-off with each fix, and counts them', () => {
    const result = verifyImprovements(
      [
        fix({ id: 'a', rootCause: '  No shadow board for the tools ', fixSignedOffBy: 'm1', fixSignedOffAt: '2026-03-03T03:00:00Z' }),
        fix({ id: 'b', rootCause: '   ' }),
      ] as never,
      [failing],
    );

    expect(result.fixes[0]).toMatchObject({
      rootCause: 'No shadow board for the tools',
      signedOffBy: 'm1',
      signedOffAt: '2026-03-03T03:00:00.000Z',
    });
    // A blank answer is no root cause.
    expect(result.fixes[1].rootCause).toBeUndefined();
    expect(result.counts).toMatchObject({ rootCauseRecorded: 1, signedOff: 1 });
  });

  it('passes on the key a raised title is worded from', () => {
    const result = verifyImprovements(
      [fix({ titleKey: 'raised.auditFix.title', titleParams: { zone: 'A01' } })] as never,
      [failing],
    );

    expect(result.fixes[0]).toMatchObject({ titleKey: 'raised.auditFix.title', titleParams: { zone: 'A01' } });
  });

  it('handles no fixes at all', () => {
    expect(verifyImprovements([], []).fixes).toEqual([]);
  });
});
