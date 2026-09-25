import { PersonRecords, projectProgressPercent, summarisePeople } from './monthly-people';

const records = (over: Partial<PersonRecords> = {}): PersonRecords => ({
  tasks: [],
  workLogs: [],
  timeEntries: [],
  auditRuns: [],
  assessmentResponses: [],
  ...over,
});

describe('what each person did this month', () => {
  it('counts the tasks they finished, and the ones they were given', () => {
    const people = summarisePeople(
      records({
        tasks: [
          { assigneeId: 'u1', status: 'done' },
          { assigneeId: 'u1', status: 'in_progress' },
          { assigneeId: 'u2', status: 'done' },
        ],
      }),
    );

    expect(people.find((person) => person.userId === 'u1')).toMatchObject({
      completedTasks: 1,
      assignedTasks: 2,
    });
    expect(people.find((person) => person.userId === 'u2')).toMatchObject({ completedTasks: 1 });
  });

  it('adds up hours from both places people record them', () => {
    // Time entries and work logs are two ways of recording the same hours, and
    // counting one would report half of everybody's month.
    const people = summarisePeople(
      records({
        timeEntries: [{ userId: 'u1', hours: 6 }],
        workLogs: [{ userId: 'u1', hours: 2 }],
      }),
    );

    expect(people[0]).toMatchObject({ userId: 'u1', hours: 8, workLogs: 1 });
  });

  it('reads hours that arrived as strings, which numeric columns do', () => {
    const people = summarisePeople(records({ timeEntries: [{ userId: 'u1', hours: '7.5' }] }));

    expect(people[0].hours).toBe(7.5);
  });

  it('treats a missing or unreadable number of hours as none', () => {
    const people = summarisePeople(
      records({ timeEntries: [{ userId: 'u1' }, { userId: 'u1', hours: 'abc' }] }),
    );

    expect(people[0].hours).toBe(0);
  });

  it('counts the audits they carried out and the assessments they answered', () => {
    const people = summarisePeople(
      records({
        auditRuns: [{ auditorId: 'u1' }, { auditorId: 'u1' }],
        assessmentResponses: [{ respondentId: 'u1' }],
      }),
    );

    expect(people[0]).toMatchObject({ auditRuns: 2, assessments: 1 });
  });

  it('leaves out work nobody is recorded against', () => {
    // An unassigned task is a fact about the backlog, not about a person, and
    // it must not silently become somebody's month.
    const people = summarisePeople(
      records({
        tasks: [{ status: 'done' }],
        timeEntries: [{ hours: 5 }],
        auditRuns: [{}],
      }),
    );

    expect(people).toEqual([]);
  });

  it('gives each person one row however many kinds of record they left', () => {
    const people = summarisePeople(
      records({
        tasks: [{ assigneeId: 'u1', status: 'done' }],
        timeEntries: [{ userId: 'u1', hours: 3 }],
        workLogs: [{ userId: 'u1', hours: 1 }],
        auditRuns: [{ auditorId: 'u1' }],
      }),
    );

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ userId: 'u1', completedTasks: 1, hours: 4, auditRuns: 1 });
  });

  it('keeps somebody who has left, because they still did the work', () => {
    // Built from the records rather than the staff list: a month should not
    // empty itself when an account is deactivated.
    const people = summarisePeople(records({ workLogs: [{ userId: 'gone', hours: 4 }] }));

    expect(people[0].userId).toBe('gone');
  });

  it('puts the busiest first, because that is the end worth reading', () => {
    const people = summarisePeople(
      records({
        tasks: [
          { assigneeId: 'quiet', status: 'done' },
          { assigneeId: 'busy', status: 'done' },
          { assigneeId: 'busy', status: 'done' },
        ],
        timeEntries: [{ userId: 'busy', hours: 20 }],
      }),
    );

    expect(people.map((person) => person.userId)).toEqual(['busy', 'quiet']);
  });

  it('is empty for a month in which nothing was recorded', () => {
    expect(summarisePeople(records())).toEqual([]);
  });
});

describe('how far along a project is, for the report', () => {
  it('counts its tasks rather than the figure somebody typed', () => {
    // Averaging the slider produced a headline number nothing in the database
    // supported.
    const progress = projectProgressPercent({ id: 'p1', progress: 62 }, [
      { projectId: 'p1', status: 'done' },
      { projectId: 'p1', status: 'todo' },
    ]);

    expect(progress).toBe(50);
  });

  it('falls back to the typed figure while a project has no tasks', () => {
    expect(projectProgressPercent({ id: 'p1', progress: 62 }, [])).toBe(62);
  });

  it('ignores another project’s tasks', () => {
    expect(
      projectProgressPercent({ id: 'p1', progress: 0 }, [{ projectId: 'p2', status: 'done' }]),
    ).toBe(0);
  });

  it('reads a project with no typed figure as nothing done', () => {
    expect(projectProgressPercent({ id: 'p1' }, [])).toBe(0);
  });
});
