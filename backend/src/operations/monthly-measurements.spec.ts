import { monthlyMeasurements } from './monthly-measurements';

type Records = Parameters<typeof monthlyMeasurements>[0];
const measure = (records: Partial<Records> = {}, timeZone = 'Asia/Ulaanbaatar') =>
  monthlyMeasurements({ completedTasks: [], auditRuns: [], workLogs: [], ...records }, '2026-03', timeZone);

describe('monthly measurement evidence', () => {
  it('distinguishes no evidence from a measured zero', () => {
    const empty = { value: null, numerator: 0, denominator: 0, excluded: 0 };
    expect(measure()).toEqual({
      version: 1, timeZone: 'Asia/Ulaanbaatar',
      onTimeDelivery: empty, zoneAuditScore: empty, workLinkage: empty,
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
