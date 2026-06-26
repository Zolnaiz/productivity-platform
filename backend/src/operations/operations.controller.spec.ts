import { OperationsController } from './operations.controller';

describe('OperationsController payload normalization', () => {
  const createController = () => {
    const service = {
      monthlyReport: jest.fn(),
      removeProject: jest.fn((id) => ({ id, deleted: true })),
      createTimeEntry: jest.fn((payload) => payload),
      findDailyGoals: jest.fn(),
      createDailyGoal: jest.fn((payload) => payload),
      updateDailyGoal: jest.fn((id, payload) => ({ id, ...payload })),
      findFiveSLayout: jest.fn(),
      upsertFiveSLayout: jest.fn((payload) => payload),
      createAssessmentResponse: jest.fn((payload) => payload),
      updateAssessmentResponse: jest.fn((id, payload) => ({ id, ...payload })),
    };

    return {
      controller: new OperationsController(service as any),
      service,
      req: { user: { id: 'user-1', organizationId: 'org-1' } },
    };
  };

  it('converts time entry timestamp strings before passing to the service', () => {
    const { controller, service, req } = createController();

    controller.createTimeEntry(
      {
        workDate: '2026-06-14',
        startedAt: '2026-06-14T01:00:00.000Z',
        endedAt: '2026-06-14T03:00:00.000Z',
        hours: 2,
      },
      req,
    );

    expect(service.createTimeEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        startedAt: expect.any(Date),
        endedAt: expect.any(Date),
      }),
      req.user,
    );
  });

  it('passes monthly report query period to the service', () => {
    const { controller, service, req } = createController();

    controller.monthlyReport(req, '2026-06');

    expect(service.monthlyReport).toHaveBeenCalledWith(req.user, '2026-06');
  });

  it('passes project delete requests to the service with current user scope', () => {
    const { controller, service, req } = createController();

    controller.removeProject('project-1', req);

    expect(service.removeProject).toHaveBeenCalledWith('project-1', req.user);
  });

  it('passes daily goal date filters to the service', () => {
    const { controller, service, req } = createController();

    controller.findDailyGoals(req, '2026-06-23');

    expect(service.findDailyGoals).toHaveBeenCalledWith(req.user, '2026-06-23');
  });

  it('passes daily goal creates and updates to the service with current user scope', () => {
    const { controller, service, req } = createController();

    controller.createDailyGoal({ title: 'Goal wall', date: '2026-06-23' }, req);
    controller.updateDailyGoal('goal-1', { completed: true }, req);

    expect(service.createDailyGoal).toHaveBeenCalledWith({ title: 'Goal wall', date: '2026-06-23' }, req.user);
    expect(service.updateDailyGoal).toHaveBeenCalledWith('goal-1', { completed: true }, req.user);
  });

  it('passes 5S layout reads and updates to the service with current user scope', () => {
    const { controller, service, req } = createController();
    const payload = {
      name: 'Office 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
    };

    controller.findFiveSLayout(req);
    controller.updateFiveSLayout(payload, req);

    expect(service.findFiveSLayout).toHaveBeenCalledWith(req.user);
    expect(service.upsertFiveSLayout).toHaveBeenCalledWith(payload, req.user);
  });

  it('converts assessment response submittedAt strings before create', () => {
    const { controller, service, req } = createController();

    controller.createAssessmentResponse(
      {
        templateId: 'template-1',
        submittedAt: '2026-06-14T03:00:00.000Z',
      },
      req,
    );

    expect(service.createAssessmentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedAt: expect.any(Date),
      }),
      req.user,
    );
  });

  it('converts assessment response submittedAt strings before update', () => {
    const { controller, service, req } = createController();

    controller.updateAssessmentResponse(
      'response-1',
      {
        submittedAt: '2026-06-14T03:00:00.000Z',
      },
      req,
    );

    expect(service.updateAssessmentResponse).toHaveBeenCalledWith(
      'response-1',
      expect.objectContaining({
        submittedAt: expect.any(Date),
      }),
      req.user,
    );
  });
});
