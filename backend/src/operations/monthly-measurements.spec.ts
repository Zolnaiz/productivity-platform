import { monthlyMeasurements, weeksOf } from './monthly-measurements';

type Records = Parameters<typeof monthlyMeasurements>[0];
const measure = (records: Partial<Records> = {}, timeZone = 'Asia/Ulaanbaatar') =>
  monthlyMeasurements({ completedTasks: [], auditRuns: [], workLogs: [], ...records }, '2026-03', timeZone);

describe('monthly measurement evidence', () => {
  it('distinguishes no evidence from a measured zero', () => {
    const empty = { value: null, numerator: 0, denominator: 0, excluded: 0 };
    expect(measure()).toEqual({
      version: 2, timeZone: 'Asia/Ulaanbaatar', referenceDay: '2026-03-31',
      onTimeDelivery: empty, lateWork: empty, zoneAuditScore: empty,
      fixClosureDays: empty, checkinRate: empty, workLinkage: empty,
      evidence: { lateWork: [], fixClosureDays: [], checkinMissing: [] },
    });
    expect(measure({ completedTasks: [{ completedAt: '2026-03-02', dueDate: '2026-03-01' }] }).onTimeDelivery)
      .toEqual({ value: 0, numerator: 0, denominator: 1, excluded: 0 });
  });

  it('counts dated completions, including late work due in an earlier month, and rounds one decimal', () => {
    expect(measure({ completedTasks: [
      { completedAt: '2026-03-02T08:00:00.000Z', dueDate: '2026-03-02' },
      { completedAt: new Date('2026-03-03T08:00:00.000Z'), dueDate: '2026-03-04' },
      { completedAt: '2026-03-01', dueDate: '2026-02-28' },
      { dueDate: '2026-03-01' },
    ] }).onTimeDelivery).toEqual({ value: 66.7, numerator: 2, denominator: 3, excluded: 1 });
  });

  it.each([undefined, null, '', 'invalid', '2026-03-32', '2026-02-30T12:00:00Z',
    '2026-03-04T25:00:00Z', '2026-03-01T00:00:00', new Date('invalid')])(
    'excludes missing or invalid completion evidence %s', (completedAt) => {
      expect(measure({ completedTasks: [{ completedAt, dueDate: '2026-03-31' }] }).onTimeDelivery)
        .toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
    },
  );

  it.each([undefined, null, '', 'not-a-date', '2026-02-30', '2026-13-01'])('excludes invalid due date %s', (dueDate) => {
    expect(measure({ completedTasks: [{ completedAt: '2026-03-05T08:00:00Z', dueDate }] }).onTimeDelivery)
      .toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
  });

  it('places a completion on the organization calendar before comparing it with a due day', () => {
    const records = { completedTasks: [{ completedAt: '2026-03-01T18:00:00Z', dueDate: '2026-03-01' }] };
    expect(measure(records).onTimeDelivery.value).toBe(0);
    expect(measure(records, 'UTC').onTimeDelivery.value).toBe(100);
  });

  it('excludes a moment outside the report month on that calendar', () => {
    const records = { completedTasks: [{ completedAt: '2026-03-31T18:00:00Z', dueDate: '2026-04-01' }] };
    expect(measure(records).onTimeDelivery).toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
    expect(measure(records, 'UTC').onTimeDelivery.value).toBe(100);
  });

  it('averages final zone runs, including real zero scores and stored numeric strings', () => {
    expect(measure({ auditRuns: [
      { zoneId: 'z1', status: 'submitted', score: 0 },
      { zoneId: 'z1', status: 'completed', score: 100 },
      { zoneId: 'z2', status: 'submitted', score: '55.5' },
    ] }).zoneAuditScore).toEqual({ value: 51.8, numerator: 155.5, denominator: 3, excluded: 0 });
  });

  it.each([undefined, 'draft', 'cancelled', 'in_progress'])('excludes a nonfinal zone run with status %s', (status) => {
    expect(measure({ auditRuns: [{ zoneId: 'z1', status, score: 80 }] }).zoneAuditScore)
      .toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
  });

  it.each([undefined, null, '', ' ', 'invalid', NaN, Infinity, -1, 101, true, false])(
    'excludes invalid score %s rather than coercing it to zero', (score) => {
      expect(measure({ auditRuns: [{ zoneId: 'z1', status: 'submitted', score }] }).zoneAuditScore)
        .toEqual({ value: null, numerator: 0, denominator: 0, excluded: 1 });
    },
  );

  it('keeps free-location audits outside the zone measurement cohort', () => {
    expect(measure({ auditRuns: [
      { status: 'submitted', score: 100 }, { zoneId: ' ', status: 'draft', score: NaN },
    ] }).zoneAuditScore).toEqual({ value: null, numerator: 0, denominator: 0, excluded: 0 });
  });

  it('counts each linked work log once, without requiring both links or looking up live records', () => {
    expect(measure({ workLogs: [
      { projectId: 'retired-project' }, { taskId: 'task-1' },
      { projectId: 'project-1', taskId: 'task-2' }, {}, { projectId: ' ', taskId: '' },
    ] }).workLinkage).toEqual({ value: 60, numerator: 3, denominator: 5, excluded: 0 });
  });
});

describe('K2 late work at the reference day', () => {
  const tz = 'Asia/Ulaanbaatar';
  const ref = '2026-03-31';
  it.each([
    ['no candidates in an old snapshot: no data', undefined, { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['candidates but none late: zero late, mean undefined', [{ id: 'a', status: 'todo', dueDate: '2026-03-31' }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['one open task five days late', [{ id: 'a', status: 'todo', dueDate: '2026-03-26' }], { value: 5, numerator: 5, denominator: 1, excluded: 0 }],
    ['finished after the reference day still counts as late on it', [{ id: 'a', status: 'done', dueDate: '2026-03-30', completedAt: '2026-04-02T03:00:00Z' }], { value: 1, numerator: 1, denominator: 1, excluded: 0 }],
    ['finished by the reference day is not late', [{ id: 'a', status: 'done', dueDate: '2026-03-10', completedAt: '2026-03-20T03:00:00Z' }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['backlog and undated tasks are nobody\'s promise', [{ id: 'a', status: 'backlog', dueDate: '2026-03-01' }, { id: 'b', status: 'todo' }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['an invalid due date is excluded', [{ id: 'a', status: 'todo', dueDate: '2026-02-30' }], { value: null, numerator: 0, denominator: 0, excluded: 1 }],
    ['done without a completion date is excluded', [{ id: 'a', status: 'done', dueDate: '2026-03-01' }], { value: null, numerator: 0, denominator: 0, excluded: 1 }],
    ['due exactly on the reference day is not yet late', [{ id: 'a', status: 'in_progress', dueDate: ref }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['mean of 2 and 10 days', [{ id: 'a', status: 'todo', dueDate: '2026-03-29' }, { id: 'b', status: 'review', dueDate: '2026-03-21' }], { value: 6, numerator: 12, denominator: 2, excluded: 0 }],
  ])('%s', (_name, lateCandidates, expected) => {
    const result = monthlyMeasurements(
      { completedTasks: [], auditRuns: [], workLogs: [], lateCandidates: lateCandidates as never },
      '2026-03',
      tz,
      ref,
    );
    expect(result.lateWork).toEqual(expected);
  });

  it('lists each late task with its days late, worst first, so the number can be traced', () => {
    const result = monthlyMeasurements(
      {
        completedTasks: [], auditRuns: [], workLogs: [],
        lateCandidates: [
          { id: 'a', title: 'Paint lines', status: 'todo', dueDate: '2026-03-29' },
          { id: 'b', title: 'Fix shelf', status: 'todo', dueDate: '2026-03-21' },
        ],
      },
      '2026-03', tz, ref,
    );
    expect(result.evidence.lateWork).toEqual([
      { id: 'b', title: 'Fix shelf', days: 10, dueDate: '2026-03-21' },
      { id: 'a', title: 'Paint lines', days: 2, dueDate: '2026-03-29' },
    ]);
  });
});

describe('K4 fix closure time', () => {
  const tz = 'Asia/Ulaanbaatar';
  it.each([
    ['no audit fixes: no data', [], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['ignores tasks from other sources', [{ id: 'a', sourceType: 'idea', createdAt: '2026-03-01T00:00:00Z', completedAt: '2026-03-03T00:00:00Z' }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['two days to close', [{ id: 'a', sourceType: 'audit_run', createdAt: '2026-03-01T00:00:00Z', completedAt: '2026-03-03T00:00:00Z' }], { value: 2, numerator: 2, denominator: 1, excluded: 0 }],
    ['half a day, then one and a half: mean one', [
      { id: 'a', sourceType: 'audit_run', createdAt: '2026-03-01T00:00:00Z', completedAt: '2026-03-01T12:00:00Z' },
      { id: 'b', sourceType: 'audit_run', createdAt: '2026-03-02T00:00:00Z', completedAt: '2026-03-03T12:00:00Z' },
    ], { value: 1, numerator: 2, denominator: 2, excluded: 0 }],
    ['completed in another month is outside', [{ id: 'a', sourceType: 'audit_run', createdAt: '2026-02-01T00:00:00Z', completedAt: '2026-02-03T00:00:00Z' }], { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['completion before creation is excluded', [{ id: 'a', sourceType: 'audit_run', createdAt: '2026-03-05T00:00:00Z', completedAt: '2026-03-03T00:00:00Z' }], { value: null, numerator: 0, denominator: 0, excluded: 1 }],
    ['missing creation moment is excluded', [{ id: 'a', sourceType: 'audit_run', completedAt: '2026-03-03T00:00:00Z' }], { value: null, numerator: 0, denominator: 0, excluded: 1 }],
  ])('%s', (_name, completedTasks, expected) => {
    expect(monthlyMeasurements({ completedTasks: completedTasks as never, auditRuns: [], workLogs: [] }, '2026-03', tz).fixClosureDays).toEqual(expected);
  });
});

describe('K6 weekly check-in rate', () => {
  // March 2026 has Mondays on the 2nd, 9th, 16th, 23rd and 30th.
  const tz = 'Asia/Ulaanbaatar';
  const run = (weeklyCheckins: unknown, checkinPeople: unknown, ref = '2026-03-31') =>
    monthlyMeasurements(
      { completedTasks: [], auditRuns: [], workLogs: [], weeklyCheckins: weeklyCheckins as never, checkinPeople: checkinPeople as never },
      '2026-03', tz, ref,
    );

  it('finds the weeks of a month that have started', () => {
    expect(weeksOf('2026-03', '2026-03-31')).toEqual(['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23', '2026-03-30']);
    expect(weeksOf('2026-03', '2026-03-10')).toEqual(['2026-03-02', '2026-03-09']);
    expect(weeksOf('2026-03', '2026-03-01')).toEqual([]);
  });

  it.each([
    ['no records in an old snapshot: no data', undefined, undefined, '2026-03-31', { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['nobody expected: no data rather than 0%', [], [], '2026-03-31', { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['before the first Monday: no weeks yet', [], ['u1'], '2026-03-01', { value: null, numerator: 0, denominator: 0, excluded: 0 }],
    ['two people, five weeks, three written', [
      { userId: 'u1', week: '2026-03-02' }, { userId: 'u1', week: '2026-03-09' }, { userId: 'u2', week: '2026-03-30' },
    ], ['u1', 'u2'], '2026-03-31', { value: 30, numerator: 3, denominator: 10, excluded: 0 }],
    ['all written', [{ userId: 'u1', week: '2026-03-02' }, { userId: 'u1', week: '2026-03-09' }], ['u1'], '2026-03-10', { value: 100, numerator: 2, denominator: 2, excluded: 0 }],
    ['an outsider and a week not in the month are excluded', [
      { userId: 'admin', week: '2026-03-02' }, { userId: 'u1', week: '2026-02-23' }, { userId: 'u1', week: '2026-03-02' },
    ], ['u1'], '2026-03-08', { value: 100, numerator: 1, denominator: 1, excluded: 2 }],
  ])('%s', (_name, checkins, people, ref, expected) => {
    expect(run(checkins, people, ref).checkinRate).toEqual(expected);
  });

  it('names every missing person-week', () => {
    expect(run([{ userId: 'u1', week: '2026-03-02' }], ['u1'], '2026-03-10').evidence.checkinMissing).toEqual([
      { userId: 'u1', week: '2026-03-09' },
    ]);
  });
});
