import { OperationsService } from './operations.service';

const createRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((value) => value),
  save: jest.fn((value) => Promise.resolve({ id: 'department-new', ...value })),
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
 * A department owns its people and its 5S areas.
 *
 * The page existed with a browser-local list behind it and said so. What was
 * missing was the decision about what a department is for, not the storage —
 * and the answer is the one a 5S programme needs: an area's responsibility
 * should outlive the person whose name is on it.
 */
describe('departments', () => {
  it('reads only this organization, in the order somebody reads a list', async () => {
    const { service, repositories } = createService();
    repositories.departments.find.mockResolvedValue([
      { id: 'd1', name: 'Warehouse' },
      { id: 'd2', name: 'Assembly' },
    ]);

    const departments = await service.findDepartments(user);

    expect(repositories.departments.find).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
    });
    // By name: somebody looking for Assembly should find it where the
    // alphabet says it is, not where its creation date puts it.
    expect(departments.map((department) => department.name)).toEqual(['Assembly', 'Warehouse']);
  });

  it('stamps a new department with the caller organization', async () => {
    const { service, repositories } = createService();

    await service.createDepartment({ name: 'Maintenance' } as never, user);

    expect(repositories.departments.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Maintenance', organizationId: 'org-1' }),
    );
  });

  it('will not let an update move a department to another organization', async () => {
    const { service, repositories } = createService();
    repositories.departments.findOne.mockResolvedValue({
      id: 'd1',
      name: 'Warehouse',
      organizationId: 'org-1',
    });

    await service.updateDepartment('d1', { name: 'Stores', organizationId: 'org-2' } as never, user);

    expect(repositories.departments.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Stores', organizationId: 'org-1' }),
    );
  });

  it('refuses to touch another organization department', async () => {
    const { service, repositories } = createService();
    repositories.departments.findOne.mockResolvedValue(null);

    await expect(service.updateDepartment('d9', { name: 'Theirs' } as never, user)).rejects.toBeDefined();
    await expect(service.removeDepartment('d9', user)).rejects.toBeDefined();
  });

  it('retires a department without rewriting what pointed at it', async () => {
    // A department that is dissolved does not un-happen, and rewriting every
    // person and area to null in the same breath is how an undo becomes
    // impossible. What reads them resolves the unknown to "unassigned".
    const { service, repositories } = createService();
    const department = { id: 'd1', name: 'Warehouse', organizationId: 'org-1' };
    repositories.departments.findOne.mockResolvedValue(department);

    await expect(service.removeDepartment('d1', user)).resolves.toEqual({
      id: 'd1',
      deleted: true,
    });

    expect(repositories.departments.softRemove).toHaveBeenCalledWith(department);
    expect(repositories.fiveSLayouts.save).not.toHaveBeenCalled();
  });

  it('will not read anything for a caller with no organization', async () => {
    const { service } = createService();

    await expect(service.findDepartments({ id: 'nobody' })).rejects.toBeDefined();
  });
});
