import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('./api', async () => {
  const actual = await vi.importActual<typeof import('./api')>('./api');
  return {
    ...actual,
    get: apiMocks.get,
    patch: apiMocks.patch,
  };
});

describe('fiveSLayoutService demo storage', () => {
  beforeEach(() => {
    vi.resetModules();
    apiMocks.get.mockReset();
    apiMocks.patch.mockReset();
    localStorage.clear();
  });

  it('loads the default 5S layout plan', async () => {
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.zones.length).toBeGreaterThan(0);
    expect(plan.objects.length).toBeGreaterThan(0);
    expect(plan.zones[0]).toHaveProperty('ownerName');
    expect(plan.zones[1].redTags?.length).toBeGreaterThan(0);
    expect(plan.backgroundImage).toBe('');
    expect(plan.backgroundOpacity).toBe(0.55);
    expect(plan.showGrid).toBe(true);
  });

  it('recovers the default layout when stored data is invalid JSON', async () => {
    localStorage.setItem('productivity-demo-5s-layout', '{broken-json');
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.zones.length).toBeGreaterThan(0);
    expect(localStorage.getItem('productivity-demo-5s-layout')).not.toBe('{broken-json');
  });

  it('normalizes stored plans that predate red-tag metadata', async () => {
    localStorage.setItem(
      'productivity-demo-5s-layout',
      JSON.stringify({
        id: 'old-layout',
        name: 'Old layout',
        site: 'HQ',
        scale: '1 square = 1 meter',
        zones: [
          {
            id: 'zone-1',
            code: 'A01',
            name: 'Reception',
            color: '#38bdf8',
            x: 10,
            y: 10,
            width: 100,
            height: 80,
            contents: '',
            standard: '',
            labelText: '',
            stage: 'sort',
            auditFrequency: 'weekly',
          },
        ],
        objects: [],
        updatedAt: '2026-06-24T00:00:00.000Z',
      }),
    );
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.zones[0].redTagCount).toBe(0);
    expect(plan.zones[0].redTags).toEqual([]);
    expect(plan.zones[0].lastCleanedAt).toBe('');
    expect(plan.zones[0].lastAuditAt).toBe('');
    expect(plan.showGrid).toBe(true);
  });

  it('creates placeholder red-tag items for legacy count-only zones', async () => {
    localStorage.setItem(
      'productivity-demo-5s-layout',
      JSON.stringify({
        id: 'legacy-red-tag-layout',
        name: 'Legacy layout',
        site: 'HQ',
        scale: '1 square = 1 meter',
        zones: [
          {
            id: 'zone-1',
            code: 'A01',
            name: 'Storage',
            color: '#f59e0b',
            x: 10,
            y: 10,
            width: 100,
            height: 80,
            ownerId: 'u2',
            ownerName: 'Quality Manager',
            contents: '',
            standard: '',
            labelText: '',
            stage: 'sort',
            auditFrequency: 'weekly',
            redTagCount: 2,
          },
        ],
        objects: [],
        updatedAt: '2026-06-24T00:00:00.000Z',
      }),
    );
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.zones[0].redTags).toHaveLength(2);
    expect(plan.zones[0].redTags?.[0].title).toBe('Red-tag item 1');
    expect(plan.zones[0].redTagCount).toBe(2);
  });

  it('creates numbered zones after the current highest code', async () => {
    const { fiveSLayoutService } = await import('./fiveSLayout.service');
    const plan = await fiveSLayoutService.getPlan();

    const zone = fiveSLayoutService.createZone(plan.zones);

    expect(zone.code).toBe('A06');
    expect(zone.stage).toBe('sort');
  });

  it('builds CSV-ready 5S zone labels', async () => {
    const { fiveSLayoutService } = await import('./fiveSLayout.service');
    const plan = await fiveSLayoutService.getPlan();

    const csv = fiveSLayoutService.buildZoneLabelsCsv(plan);

    expect(csv).toContain('"Code","Zone","Owner","Stage","Audit cycle","Last audit score","Last audited","Red tags","Last cleaned"');
    expect(csv).toContain('"A01","Reception","Demo Owner"');
    expect(csv).toContain('"88%"');
    expect(csv).toContain('"Front desk clear, visitor chairs aligned, documents sorted before 17:00."');
  });

  it('loads real backend 5S layout when a real token succeeds', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce({
      id: 'server-layout',
      organizationId: 'server-org',
      name: 'Server 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      zones: [{ id: 'zone-1', code: 'A01' }],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(apiMocks.get).toHaveBeenCalledWith('/five-s-layout');
    expect(plan.id).toBe('server-layout');
    expect(plan.zones).toHaveLength(1);
  });

  it('leaves an empty backend layout empty', async () => {
    // It used to substitute a sample office here, so somebody signing up was
    // shown a building that was not theirs, with areas named Reception and
    // Workstations, and their first job was working out none of it was real.
    // An empty plan is what a new workspace *is*; the editor asks how to
    // begin rather than pretending the question is answered.
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce({
      id: 'empty-server-layout',
      organizationId: 'server-org',
      name: '5S area map',
      site: 'Workspace',
      scale: '1 square = 1 meter',
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.id).toBe('empty-server-layout');
    expect(plan.zones).toEqual([]);
    expect(plan.objects).toEqual([]);
  });

  it('saves real backend 5S layout without client-only fields', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.patch.mockResolvedValueOnce({
      id: 'server-layout',
      organizationId: 'server-org',
      name: 'Updated 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      backgroundImage: 'data:image/png;base64,abc',
      backgroundOpacity: 0.4,
      showGrid: false,
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    await fiveSLayoutService.savePlan({
      id: 'client-layout',
      organizationId: 'client-org',
      name: 'Updated 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      backgroundImage: 'data:image/png;base64,abc',
      backgroundOpacity: 0.4,
      showGrid: false,
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });

    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/five-s-layout',
      expect.not.objectContaining({
        id: expect.anything(),
        organizationId: expect.anything(),
        updatedAt: expect.anything(),
      }),
    );
  });

  it('sends the walls, the openings and the scale', async () => {
    // These were left out of the payload for as long as walls existed, so a
    // plan drawn against a real backend was complete on screen and empty again
    // after a reload — dropped on the way out rather than refused.
    localStorage.setItem('token', 'real-token');
    apiMocks.patch.mockResolvedValueOnce({ id: 'server-layout', zones: [], objects: [], updatedAt: '' });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    await fiveSLayoutService.savePlan({
      id: 'client-layout',
      name: 'Drawn map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      metresPerUnit: 1 / 24,
      corners: [
        { id: 'c0', x: 0, y: 0 },
        { id: 'c1', x: 384, y: 0 },
      ],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 }],
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });

    expect(apiMocks.patch).toHaveBeenCalledWith(
      '/five-s-layout',
      expect.objectContaining({
        corners: [
          { id: 'c0', x: 0, y: 0 },
          { id: 'c1', x: 384, y: 0 },
        ],
        walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
        openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 }],
        metresPerUnit: 1 / 24,
      }),
    );
  });

  it('reads the walls back from the server', async () => {
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce({
      id: 'server-layout',
      name: 'Server 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      metresPerUnit: 0.05,
      corners: [{ id: 'c0', x: 0, y: 0 }],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [{ id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 }],
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.walls).toHaveLength(1);
    expect(plan.openings).toHaveLength(1);
    expect(plan.metresPerUnit).toBe(0.05);
  });

  it('drops a door whose wall is gone', async () => {
    // Otherwise the plan keeps an entrance that draws nowhere and can never be
    // reached to delete.
    localStorage.setItem('token', 'real-token');
    apiMocks.get.mockResolvedValueOnce({
      id: 'server-layout',
      name: 'Server 5S map',
      site: 'HQ',
      scale: '1 square = 1 meter',
      corners: [{ id: 'c0', x: 0, y: 0 }],
      walls: [{ id: 'w0', from: 'c0', to: 'c1', thickness: 12 }],
      openings: [
        { id: 'o0', wallId: 'w0', kind: 'door', offset: 120, width: 21.6 },
        { id: 'o1', wallId: 'deleted', kind: 'window', offset: 40, width: 28.8 },
      ],
      zones: [],
      objects: [],
      updatedAt: '2026-06-24T00:00:00.000Z',
    });
    const { fiveSLayoutService } = await import('./fiveSLayout.service');

    const plan = await fiveSLayoutService.getPlan();

    expect(plan.openings?.map((opening) => opening.id)).toEqual(['o0']);
  });
});
