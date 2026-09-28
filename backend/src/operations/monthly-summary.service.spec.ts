import { IdeaStatus } from './entities/idea.entity';
import { MonthlySummaryService, monthFacts } from './monthly-summary.service';

const report = {
  period: '2026-09',
  people: [{ userId: 'u1', name: 'Bat Erdene' }, { userId: 'u2', name: 'Saran Tuya' }],
  totals: { plannedTasks: 10, plannedCompleted: 8, completedTasks: 9, totalHours: 320, workLogs: 40, auditRuns: 6 },
  kpis: { completionRate: 80, dailyGoalCompletionRate: 70 },
  completedTasks: [{ title: 'Clear the dock' }, { title: 'Label the racking' }],
  projects: [{ name: '5S rollout', progress: 60 }],
} as never;

const ideas = [
  { title: 'Floor tape at the dock', status: IdeaStatus.DONE, reviewedAt: new Date('2026-09-12T09:00:00Z'), createdAt: new Date('2026-09-01T09:00:00Z') },
  { title: 'Old idea', status: IdeaStatus.DONE, reviewedAt: new Date('2026-06-12T09:00:00Z'), createdAt: new Date('2026-06-01T09:00:00Z') },
] as never;

const checkins = [
  { userId: 'u1', week: '2026-09-21', problems: 'Forklift is broken' },
  { userId: 'u2', week: '2026-09-28', problems: '  ' },
  { userId: 'u2', week: '2026-08-31', problems: 'August problem' },
] as never;

describe('the month in facts', () => {
  it('keeps the figures and what was raised, and names nobody', () => {
    const facts = monthFacts(report, ideas, checkins);

    expect(facts).toEqual(
      expect.objectContaining({
        period: '2026-09',
        people: 2,
        hours: 320,
        audits: 6,
        ideasPutInPlace: ['Floor tape at the dock'],
        ideasSubmitted: 1,
        problemsRaised: ['Forklift is broken'],
      }),
    );
    expect(facts.tasks).toEqual(expect.objectContaining({ completionRate: 80, finishedTitles: ['Clear the dock', 'Label the racking'] }));
    expect(JSON.stringify(facts)).not.toContain('Bat Erdene');
    expect(JSON.stringify(facts)).not.toContain('Saran Tuya');
  });
});

describe('drafting the summary', () => {
  const createService = (apiKey?: string) => {
    const summaries = {
      create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
      save: jest.fn(async (value: Record<string, unknown>) => value),
      findOne: jest.fn(async () => null),
    };
    const archive = { monthlyReport: jest.fn(async () => report) };
    const config = { get: jest.fn((key: string) => (key === 'ANTHROPIC_API_KEY' ? apiKey : undefined)) };
    const service = new MonthlySummaryService(
      summaries as never,
      { find: jest.fn(async () => ideas) } as never,
      { find: jest.fn(async () => checkins) } as never,
      archive as never,
      config as never,
    );
    return { service, summaries };
  };
  const manager = { id: 'm1', role: 'manager', organizationId: 'org-1' };
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('says AI is not set up when the server has no key', async () => {
    const { service } = createService(undefined);

    await expect(service.draft(manager, '2026-09', 'mn')).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'AI_NOT_CONFIGURED' }),
    });
  });

  it('asks Claude in the reader’s language and keeps the answer as an unapproved draft', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'Сар амжилттай өнгөрлөө.' }] }),
    }));
    global.fetch = fetchMock as never;
    const { service, summaries } = createService('test-key');

    const saved = await service.draft(manager, '2026-09', 'mn');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string>; body: string }];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('test-key');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('claude-sonnet-5');
    expect(body.system).toContain('Монгол хэлээр');
    expect(body.messages[0].content).toContain('Forklift is broken');
    expect(body.messages[0].content).not.toContain('Bat Erdene');
    expect(saved).toEqual(expect.objectContaining({ text: 'Сар амжилттай өнгөрлөө.', aiDrafted: true, approvedBy: null }));
    expect(summaries.save).toHaveBeenCalled();
  });

  it('says so when Claude cannot be reached or answers with an error', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 529, json: async () => ({}) })) as never;
    const { service } = createService('test-key');

    await expect(service.draft(manager, '2026-09', 'en')).rejects.toMatchObject({
      response: expect.objectContaining({ errorCode: 'AI_FAILED' }),
    });
  });

  it('keeps a manager’s own words, and approves them when asked', async () => {
    const { service } = createService(undefined);

    const saved = await service.save(manager, '2026-09', '  A good month.  ', true);

    expect(saved).toEqual(expect.objectContaining({ text: 'A good month.', aiDrafted: false, approvedBy: 'm1' }));
  });
});
