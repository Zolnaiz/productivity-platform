import { CheckinsService, mondayOf } from './checkins.service';

const operator = { id: 'op-1', organizationId: 'org-1' };

const createService = (existing: Record<string, unknown> | null = null) => {
  const checkins = {
    create: jest.fn((value: Record<string, unknown>) => ({ ...value })),
    save: jest.fn(async (value: Record<string, unknown>) => value),
    findOne: jest.fn(async () => (existing ? { ...existing } : null)),
    find: jest.fn(async () => []),
  };
  return { service: new CheckinsService(checkins as never), checkins };
};

describe('the week a day falls in', () => {
  it('starts on Monday', () => {
    expect(mondayOf('2026-09-28')).toBe('2026-09-28'); // a Monday
    expect(mondayOf('2026-10-02')).toBe('2026-09-28'); // Friday
    expect(mondayOf('2026-10-04')).toBe('2026-09-28'); // Sunday belongs to the week before it
  });

  it('crosses a month and a year', () => {
    expect(mondayOf('2026-01-01')).toBe('2025-12-29');
  });
});

describe('weekly check-ins', () => {
  it('writes a person’s week under the Monday of the day they give', async () => {
    const { service, checkins } = createService();

    await service.saveMine({ week: '2026-10-02', progress: ' Cleared the dock ', plans: 'Label the racking', problems: 'No labels in stock' }, operator);

    expect(checkins.findOne).toHaveBeenCalledWith({ where: { userId: 'op-1', week: '2026-09-28' } });
    expect(checkins.save).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        userId: 'op-1',
        week: '2026-09-28',
        progress: 'Cleared the dock',
        problems: 'No labels in stock',
      }),
    );
  });

  it('updates the same week rather than writing a second', async () => {
    const { service, checkins } = createService({ id: 'c1', userId: 'op-1', week: '2026-09-28', progress: 'Old', plans: 'Keep', problems: '' });

    await service.saveMine({ week: '2026-09-30', progress: 'New' }, operator);

    expect(checkins.create).not.toHaveBeenCalled();
    expect(checkins.save).toHaveBeenCalledWith(expect.objectContaining({ id: 'c1', progress: 'New', plans: 'Keep' }));
  });

  it('reads the team’s week only within the organization of whoever asks', async () => {
    const { service, checkins } = createService();

    await service.findTeam('2026-10-01', { id: 'mgr-1', organizationId: 'org-1' });

    expect(checkins.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1', week: '2026-09-28' } }),
    );
  });
});
