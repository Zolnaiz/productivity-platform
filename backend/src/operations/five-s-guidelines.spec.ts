import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn().mockResolvedValue(null),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve({ id: 'guideline-1', ...value })),
  softRemove: jest.fn((value) => Promise.resolve(value)),
});

const createService = () => {
  const repositories = {
    projects: createRepository(),
    tasks: createRepository(),
    workLogs: createRepository(),
    timeEntries: createRepository(),
    auditTemplates: createRepository(),
    auditRuns: createRepository(),
    assessmentTemplates: createRepository(),
    assessmentResponses: createRepository(),
    expenses: createRepository(),
    dailyGoals: createRepository(),
    fiveSLayouts: createRepository(),
    departments: createRepository(),
    guidelines: createRepository(),
  };

  const service = new OperationsService(
    { get: jest.fn(() => undefined) } as never,
    repositories.projects as never,
    repositories.tasks as never,
    repositories.workLogs as never,
    repositories.timeEntries as never,
    repositories.auditTemplates as never,
    repositories.auditRuns as never,
    repositories.assessmentTemplates as never,
    repositories.assessmentResponses as never,
    repositories.expenses as never,
    repositories.dailyGoals as never,
    repositories.fiveSLayouts as never,
    repositories.departments as never,
    repositories.guidelines as never,
    { notify: jest.fn(async () => null) } as never,
  );

  return { service, repositories };
};

const user = { id: 'user-1', organizationId: 'org-1' };

/**
 * A 5S improvement register is the memory of a programme: what was found, who
 * decided what, whether it worked. It lived in the browser that typed it, so
 * it was lost with every new laptop and shared with nobody.
 */
describe('the 5S register', () => {
  it('gives an organization that has never had one a standard to start from', async () => {
    // Nothing has gone wrong — the programme simply has not started — and a
    // blank page is a worse answer than a sensible standard they can change.
    const { service, repositories } = createService();

    const register = await service.findFiveSGuideline(user);

    expect(repositories.guidelines.findOne).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    expect(register.organizationId).toBe('org-1');
    expect(register.records).toEqual({});
    expect((register.content as { labelStandards?: string[] }).labelStandards?.length).toBeGreaterThan(0);
    // Not saved: looking at a register should not create a row.
    expect(repositories.guidelines.save).not.toHaveBeenCalled();
  });

  it("leaves an organization's own standard alone", async () => {
    const { service, repositories } = createService();
    repositories.guidelines.findOne.mockResolvedValue({
      id: 'g1',
      organizationId: 'org-1',
      content: { labelStandards: ['Ours, not theirs'] },
      records: {},
    });

    const register = await service.findFiveSGuideline(user);

    expect(register.content).toEqual({ labelStandards: ['Ours, not theirs'] });
  });

  it('reads only this organization', async () => {
    const { service, repositories } = createService();
    repositories.guidelines.findOne.mockResolvedValue({
      id: 'g1',
      organizationId: 'org-1',
      records: { improvements: [{ id: 'i1' }] },
    });

    const register = await service.findFiveSGuideline(user);

    expect(register.records).toEqual({ improvements: [{ id: 'i1' }] });
  });

  it('keeps the standard when records are saved', async () => {
    // A checklist tick must not be able to move the goalposts it is ticked
    // against: the standard is changed elsewhere, by somebody else.
    const { service, repositories } = createService();
    repositories.guidelines.findOne.mockResolvedValue({
      id: 'g1',
      organizationId: 'org-1',
      content: { labelStandards: ['Everything labelled'] },
      records: {},
    });

    await service.saveFiveSGuidelineRecords({ improvements: [{ id: 'i1' }] }, user);

    expect(repositories.guidelines.save).toHaveBeenCalledWith(
      expect.objectContaining({
        content: { labelStandards: ['Everything labelled'] },
        records: { improvements: [{ id: 'i1' }] },
      }),
    );
  });

  it('starts a register for an organization filling one in for the first time', async () => {
    const { service, repositories } = createService();

    await service.saveFiveSGuidelineRecords({ checklistProgress: [] }, user);

    expect(repositories.guidelines.save).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1', records: { checklistProgress: [] } }),
    );
  });

  it('treats nothing sent as an empty register rather than as a crash', async () => {
    const { service, repositories } = createService();

    await service.saveFiveSGuidelineRecords(undefined as never, user);

    expect(repositories.guidelines.save).toHaveBeenCalledWith(
      expect.objectContaining({ records: {} }),
    );
  });

  it('will not read or write anything for a caller with no organization', async () => {
    const { service } = createService();

    await expect(service.findFiveSGuideline({ id: 'nobody' })).rejects.toBeDefined();
    await expect(service.saveFiveSGuidelineRecords({}, { id: 'nobody' })).rejects.toBeDefined();
  });
});
