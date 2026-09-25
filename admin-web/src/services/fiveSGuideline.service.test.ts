import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  demo: false,
  fallback: true,
}));

vi.mock('./api', () => ({
  get: apiMocks.get,
  patch: apiMocks.patch,
  isDemoMode: () => apiMocks.demo,
  shouldUseDemoFallback: () => apiMocks.fallback,
}));

const load = async () => (await import('./fiveSGuideline.service')).fiveSGuidelineService;

const state = (over: Record<string, unknown> = {}) => ({
  improvements: [],
  implementationCards: [],
  assessmentScores: [],
  checklistProgress: [],
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...over,
});

/**
 * A 5S improvement register is the memory of a programme. It lived in the
 * browser that typed it, so it was lost with every new laptop and shared with
 * nobody.
 */
describe('the registers a 5S programme keeps', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    apiMocks.get.mockReset();
    apiMocks.patch.mockReset();
    apiMocks.demo = false;
    apiMocks.fallback = true;
  });

  it('reads the organization register rather than this browser', async () => {
    apiMocks.get.mockResolvedValue({ records: state({ improvements: [{ id: 'i1' }] }) });

    const loaded = await (await load()).getRegister();

    expect(apiMocks.get).toHaveBeenCalledWith('/five-s-guidelines');
    expect(loaded.records.improvements).toEqual([{ id: 'i1' }]);
  });

  it('shows an empty register as empty, not as the demo sample', async () => {
    // An organization whose improvement list is genuinely empty must not be
    // shown somebody else's cable-tray finding as though it were theirs.
    apiMocks.get.mockResolvedValue({ records: { updatedAt: '2026-09-01T00:00:00.000Z' } });

    const loaded = await (await load()).getRegister();

    expect(loaded.records.improvements).toEqual([]);
    expect(loaded.records.implementationCards).toEqual([]);
  });

  it('sends the records and nothing else', async () => {
    // A checklist tick must not be able to move the goalposts it is ticked
    // against: the standard is changed elsewhere, by somebody else.
    apiMocks.patch.mockResolvedValue({ records: state() });

    await (await load()).saveState(state({ checklistProgress: [{ id: 'seiri-1', done: true }] }));

    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/five-s-guidelines',
      expect.objectContaining({
        records: expect.objectContaining({ checklistProgress: [{ id: 'seiri-1', done: true }] }),
      }),
    );
    expect(Object.keys(apiMocks.patch.mock.calls[0][1])).toEqual(['records']);
  });

  it('keeps what somebody typed when the save fails', async () => {
    // They have written a paragraph into an improvement record. Discarding it
    // is the fastest way to teach them not to use the register.
    apiMocks.patch.mockRejectedValue(new Error('offline'));

    const saved = await (await load()).saveState(state({ improvements: [{ id: 'typed' }] }));

    expect(saved.improvements).toEqual([{ id: 'typed' }]);
    expect(
      JSON.parse(localStorage.getItem('productivity-demo-5s-guideline-registers') ?? '{}').improvements,
    ).toEqual([{ id: 'typed' }]);
  });

  it('falls back to the local copy when the register cannot be read', async () => {
    apiMocks.get.mockRejectedValue(new Error('offline'));
    localStorage.setItem(
      'productivity-demo-5s-guideline-registers',
      JSON.stringify(state({ improvements: [{ id: 'local' }] })),
    );

    const loaded = await (await load()).getRegister();

    expect(loaded.records.improvements).toEqual([{ id: 'local' }]);
  });

  it('lets the failure through when a deployment forbids the fallback', async () => {
    // Production: quietly serving a browser-local register as though it were
    // the organization's is how two people end up with two registers.
    apiMocks.get.mockRejectedValue(new Error('offline'));
    apiMocks.fallback = false;

    await expect((await load()).getRegister()).rejects.toThrow('offline');
  });

  it('stays entirely local in demo mode', async () => {
    apiMocks.demo = true;

    const service = await load();
    await service.saveState(state({ improvements: [{ id: 'demo' }] }));

    expect(apiMocks.get).not.toHaveBeenCalled();
    expect(apiMocks.patch).not.toHaveBeenCalled();
    expect((await service.getRegister()).records.improvements).toEqual([{ id: 'demo' }]);
  });
});
