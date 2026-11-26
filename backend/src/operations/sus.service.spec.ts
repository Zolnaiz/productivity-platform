import { SusService } from './sus.service';

/**
 * An in-memory table: enough of TypeORM's find API for the service, with
 * `IsNull()` read the way PostgreSQL would.
 */
const table = <T extends Record<string, any>>(prefix: string) => {
  const rows: T[] = [];
  const matches = (row: T, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) =>
      (value as { _type?: string })?._type === 'isNull' ? row[key] == null : row[key] === value,
    );
  return {
    rows,
    repository: {
      create: jest.fn((value: Partial<T>) => ({ ...value }) as T),
      save: jest.fn(async (value: T) => {
        if (!rows.includes(value)) {
          Object.assign(value, { id: value.id ?? `${prefix}${rows.length + 1}`, createdAt: new Date(), updatedAt: new Date() });
          rows.push(value);
        }
        return value;
      }),
      findOne: jest.fn(async ({ where }) => rows.find((row) => matches(row, where)) ?? null),
      find: jest.fn(async ({ where }) => rows.filter((row) => matches(row, where))),
    },
  };
};

const build = (activeMembers = 5) => {
  const rounds = table<any>('round-');
  const responses = table<any>('response-');
  const users = { count: jest.fn(async () => activeMembers) };
  const service = new SusService(rounds.repository as never, responses.repository as never, users as never);
  return { service, rounds, responses, users };
};

const admin = { id: 'admin-1', organizationId: 'org-1' };
const member = (n: number) => ({ id: `u${n}`, organizationId: 'org-1' });
const neutral = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
const good = [4, 2, 4, 2, 4, 2, 4, 2, 4, 2];

describe('SusService', () => {
  it('asks nobody anything while no round is open', async () => {
    const { service } = build();

    await expect(service.current(member(1))).resolves.toEqual({ round: null, mine: null });
  });

  it('shows the open round, and after answering, the answers and the score they make', async () => {
    const { service } = build();
    const round = await service.open('End of pilot', admin);

    expect((await service.current(member(1))).mine).toBeNull();
    await service.answer(round.id, good, member(1));

    const now = await service.current(member(1));
    expect(now.round).toMatchObject({ id: round.id, title: 'End of pilot' });
    expect(now.mine).toMatchObject({ answers: good, score: 75 });
  });

  it('keeps one response a person: answering again changes it', async () => {
    const { service, responses } = build();
    const round = await service.open('End of pilot', admin);

    await service.answer(round.id, neutral, member(1));
    const changed = await service.answer(round.id, good, member(1));

    expect(responses.rows).toHaveLength(1);
    expect(changed.score).toBe(75);
  });

  it('opens one round at a time', async () => {
    const { service } = build();
    await service.open('Baseline', admin);

    await expect(service.open('Another', admin)).rejects.toMatchObject({
      response: { errorCode: 'SURVEY_ROUND_OPEN' },
    });
  });

  it('turns the database’s refusal of a second open round into the same answer', async () => {
    // Two administrators at once: both pass the check, the unique index lets one through.
    const { service, rounds } = build();
    rounds.repository.save.mockRejectedValueOnce(Object.assign(new Error('duplicate key'), { code: '23505' }));

    await expect(service.open('Baseline', admin)).rejects.toMatchObject({
      response: { errorCode: 'SURVEY_ROUND_OPEN' },
    });
  });

  it('takes no answers once a round is closed, and opens the next one after it', async () => {
    const { service } = build();
    const first = await service.open('Baseline', admin);
    await service.close(first.id, admin);

    await expect(service.answer(first.id, good, member(1))).rejects.toMatchObject({
      response: { errorCode: 'SURVEY_ROUND_CLOSED' },
    });
    await expect(service.open('End of pilot', admin)).resolves.toMatchObject({ title: 'End of pilot' });
  });

  it('keeps the first close: closing again does not move the date', async () => {
    const { service } = build();
    const round = await service.open('Baseline', admin);
    const closedAt = (await service.close(round.id, admin)).closedAt;

    await new Promise((resolve) => setTimeout(resolve, 5));
    expect((await service.close(round.id, admin)).closedAt).toBe(closedAt);
  });

  it('does not find another organization’s round, to answer or to read', async () => {
    const { service } = build();
    const round = await service.open('Baseline', admin);
    const outsider = { id: 'x1', organizationId: 'org-2' };

    await expect(service.answer(round.id, good, outsider)).rejects.toMatchObject({
      response: { errorCode: 'RESOURCE_NOT_FOUND' },
    });
    await expect(service.results(round.id, outsider)).rejects.toMatchObject({
      response: { errorCode: 'RESOURCE_NOT_FOUND' },
    });
  });

  it('reports totals only, and none below three respondents', async () => {
    const { service } = build(4);
    const round = await service.open('End of pilot', admin);
    await service.answer(round.id, good, member(1));
    await service.answer(round.id, neutral, member(2));

    const early = await service.results(round.id, admin);
    expect(early.summary).toMatchObject({ respondents: 2, members: 4, responseRate: 50, figures: null });

    await service.answer(round.id, good, member(3));
    const enough = await service.results(round.id, admin);
    expect(enough.summary.figures).toMatchObject({ mean: 66.7, min: 50, max: 75 });
    expect(JSON.stringify(enough)).not.toContain('u1');
  });

  it('lists every round with what it came to', async () => {
    const { service } = build();
    const first = await service.open('Baseline', admin);
    await service.close(first.id, admin);
    await service.open('End of pilot', admin);

    const list = await service.list(admin);

    expect(list.map((round) => round.title).sort()).toEqual(['Baseline', 'End of pilot']);
    expect(list[0].summary).toMatchObject({ respondents: 0, members: 5 });
  });

  it('needs somebody in an organization to ask', async () => {
    const { service } = build();

    await expect(service.current({ id: 'u1' })).rejects.toMatchObject({
      response: { errorCode: 'AUTH_ORGANIZATION_REQUIRED' },
    });
  });
});
