import { OrganizationRecords } from './monthly-report';
import { buildWeeklyMeasurements, isCalendarDay, weeksBetween } from './weekly-measurements';

/*
 * The pilot's weekly table: K1-K6 for each Monday-to-Sunday week, counted by
 * the monthly report's own rules. October 2026 starts on a Thursday; its
 * Mondays are the 5th, 12th, 19th and 26th.
 */

const organization = (over: Partial<Record<keyof OrganizationRecords, unknown[]>> = {}) =>
  ({
    projects: [],
    tasks: [],
    workLogs: [],
    timeEntries: [],
    auditRuns: [],
    assessmentResponses: [],
    expenses: [],
    dailyGoals: [],
    weeklyCheckins: [],
    members: [],
    ...over,
  }) as unknown as OrganizationRecords;

const team = { id: 'manager-1', ownOnly: false, today: '2026-11-01' };
const UTC = 'UTC';

describe('the weeks of a pilot', () => {
  it('starts on the Monday on or before the first day, and covers the last', () => {
    expect(weeksBetween('2026-10-07', '2026-10-20')).toEqual([
      { from: '2026-10-05', to: '2026-10-11' },
      { from: '2026-10-12', to: '2026-10-18' },
      { from: '2026-10-19', to: '2026-10-25' },
    ]);
  });

  it('is one week when both days fall in it, and none when they are reversed', () => {
    expect(weeksBetween('2026-10-12', '2026-10-18')).toHaveLength(1);
    expect(weeksBetween('2026-10-20', '2026-10-12')).toEqual([]);
  });

  it('crosses a month without breaking the week', () => {
    expect(weeksBetween('2026-10-28', '2026-11-03')).toEqual([
      { from: '2026-10-26', to: '2026-11-01' },
      { from: '2026-11-02', to: '2026-11-08' },
    ]);
  });

  it('takes only real calendar days', () => {
    expect(isCalendarDay('2026-10-12')).toBe(true);
    expect(isCalendarDay('2026-02-30')).toBe(false);
    expect(isCalendarDay('2026-10')).toBe(false);
    expect(isCalendarDay(undefined)).toBe(false);
  });
});

describe('K1-K6 week by week', () => {
  it('counts K1 in the week the work was finished, not the month', () => {
    const all = organization({
      tasks: [
        { id: 'on-time', assigneeId: 'u1', status: 'done', dueDate: '2026-10-09', completedAt: '2026-10-08T09:00:00Z' },
        { id: 'late', assigneeId: 'u1', status: 'done', dueDate: '2026-10-09', completedAt: '2026-10-13T09:00:00Z' },
      ],
    });

    const [first, second] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-18', team, UTC).weeks;

    expect(first.measurements.onTimeDelivery).toMatchObject({ value: 100, numerator: 1, denominator: 1 });
    expect(second.measurements.onTimeDelivery).toMatchObject({ value: 0, numerator: 0, denominator: 1 });
  });

  it('says "no data" for a week with nothing finished, never a measured 0', () => {
    const { weeks } = buildWeeklyMeasurements(organization(), '2026-10-05', '2026-10-11', team, UTC);

    expect(weeks[0].measurements.onTimeDelivery.value).toBeNull();
    expect(weeks[0].measurements.zoneAuditScore.value).toBeNull();
  });

  it('counts K2 as of the week’s last day', () => {
    const all = organization({
      tasks: [{ id: 'open', assigneeId: 'u1', status: 'in_progress', dueDate: '2026-10-08' }],
    });

    const [first, second] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-18', team, UTC).weeks;

    // Three days late on Sunday the 11th, ten on Sunday the 18th.
    expect(first.measurements.lateWork).toMatchObject({ value: 3, denominator: 1 });
    expect(second.measurements.lateWork).toMatchObject({ value: 10, denominator: 1 });
  });

  it('takes K3 from the audits saved in that week only', () => {
    const all = organization({
      auditRuns: [
        { id: 'a1', zoneId: 'z1', auditorId: 'u1', status: 'submitted', score: 70, createdAt: '2026-10-06T08:00:00Z' },
        { id: 'a2', zoneId: 'z1', auditorId: 'u1', status: 'submitted', score: 90, createdAt: '2026-10-14T08:00:00Z' },
      ],
    });

    const [first, second] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-18', team, UTC).weeks;

    expect(first.measurements.zoneAuditScore.value).toBe(70);
    expect(second.measurements.zoneAuditScore.value).toBe(90);
  });

  it('expects one check-in per person per week for K6', () => {
    const all = organization({
      members: [
        { id: 'u1', role: 'user', isActive: true },
        { id: 'u2', role: 'user', isActive: true },
      ],
      weeklyCheckins: [
        { userId: 'u1', week: '2026-10-05' },
        { userId: 'u1', week: '2026-10-12' },
        { userId: 'u2', week: '2026-10-12' },
      ],
    });

    const [first, second] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-18', team, UTC).weeks;

    expect(first.measurements.checkinRate).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
    expect(second.measurements.checkinRate).toMatchObject({ value: 100, numerator: 2, denominator: 2 });
  });

  it('places work by the organization’s calendar, not UTC', () => {
    // 07:00 on Monday the 12th in Ulaanbaatar is still Sunday the 11th in UTC.
    const all = organization({
      tasks: [{ id: 't', assigneeId: 'u1', status: 'done', dueDate: '2026-10-12', completedAt: '2026-10-11T23:00:00Z' }],
    });

    const [first, second] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-18', team, 'Asia/Ulaanbaatar').weeks;

    expect(first.measurements.onTimeDelivery.denominator).toBe(0);
    expect(second.measurements.onTimeDelivery.denominator).toBe(1);
  });

  it('shows an employee only their own records, as the monthly report does', () => {
    const all = organization({
      tasks: [
        { id: 'mine', assigneeId: 'u1', status: 'done', dueDate: '2026-10-09', completedAt: '2026-10-08T09:00:00Z' },
        { id: 'theirs', assigneeId: 'u2', status: 'done', dueDate: '2026-10-07', completedAt: '2026-10-08T09:00:00Z' },
      ],
    });

    const [week] = buildWeeklyMeasurements(all, '2026-10-05', '2026-10-11', { id: 'u1', ownOnly: true, today: '2026-11-01' }, UTC).weeks;

    expect(week.measurements.onTimeDelivery).toMatchObject({ value: 100, denominator: 1 });
  });

  it('leaves out weeks not yet begun, and marks the running one as incomplete', () => {
    const result = buildWeeklyMeasurements(organization(), '2026-10-19', '2026-11-15', { ...team, today: '2026-10-28' }, UTC);

    expect(result.weeks.map((week) => [week.from, week.complete])).toEqual([
      ['2026-10-19', true],
      ['2026-10-26', false],
    ]);
  });
});
