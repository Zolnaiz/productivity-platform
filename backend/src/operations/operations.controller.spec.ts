import { OperationsController } from './operations.controller';

describe('OperationsController payload normalization', () => {
  const createController = () => {
    const service = {
      monthlyReport: jest.fn(),
      createTimeEntry: jest.fn((payload) => payload),
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
