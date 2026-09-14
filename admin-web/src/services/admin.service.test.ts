import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const patch = vi.fn();
let demoMode = false;

vi.mock('./api', () => ({
  get: (...args: unknown[]) => get(...args),
  patch: (...args: unknown[]) => patch(...args),
  isDemoMode: () => demoMode,
  shouldUseDemoFallback: () => demoMode,
  localId: () => 'local-1',
}));

const members = vi.fn();
vi.mock('./people.service', () => ({ peopleService: { getMembers: () => members() } }));

const load = async () => (await import('./admin.service')).adminService;

const organization = {
  id: 'org-1',
  name: 'MPC',
  address: 'Ulaanbaatar',
  contactEmail: 'it@example.com',
  phone: '+97699112233',
  settings: { industry: 'Manufacturing', timezone: 'Asia/Ulaanbaatar', language: 'mn-MN', monthCloseDay: 5 },
};

describe('adminService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    demoMode = false;
    members.mockResolvedValue([{ id: 'u1', isActive: true }, { id: 'u2', isActive: false }]);
  });

  describe('against the API', () => {
    it('reads the workspace from the organization the token names', async () => {
      get.mockResolvedValue(organization);

      const profile = await (await load()).getWorkspaceProfile();

      expect(get).toHaveBeenCalledWith('/organizations/my-organization');
      expect(profile).toMatchObject({ id: 'org-1', name: 'MPC', industry: 'Manufacturing' });
    });

    it('counts the headcount from the members rather than storing it', async () => {
      get.mockResolvedValue(organization);

      // Two members, one of them deactivated.
      expect((await (await load()).getWorkspaceProfile()).employeeCount).toBe(1);
    });

    it('still answers when the member list is refused', async () => {
      // A viewer may read the workspace but not list members; the page should
      // show the workspace rather than fail entirely.
      get.mockResolvedValue(organization);
      members.mockRejectedValue(new Error('forbidden'));

      expect((await (await load()).getWorkspaceProfile()).employeeCount).toBe(0);
    });

    it('saves the profile fields onto the organization record', async () => {
      get.mockResolvedValue(organization);
      patch.mockResolvedValue(organization);

      await (await load()).updateWorkspaceProfile({
        id: 'org-1',
        name: 'MPC',
        industry: 'Construction',
        address: 'Ulaanbaatar',
        contactEmail: 'it@example.com',
        contactPhone: '+97699112233',
        employeeCount: 1,
      });

      expect(patch).toHaveBeenCalledWith('/organizations/my-organization', {
        name: 'MPC',
        address: 'Ulaanbaatar',
        contactEmail: 'it@example.com',
        phone: '+97699112233',
        settings: { industry: 'Construction', timezone: 'Asia/Ulaanbaatar', language: 'mn-MN', monthCloseDay: 5 },
      });
    });

    it('does not drop the settings the other screen owns', async () => {
      // `settings` is one JSON column. Saving the profile with only the keys
      // this screen knows would erase the chosen language.
      get.mockResolvedValue(organization);
      patch.mockResolvedValue(organization);

      await (await load()).updateWorkspaceSettings({
        timezone: 'UTC',
        language: 'en',
        monthCloseDay: 1,
      });

      expect(patch.mock.calls[0][1].settings).toMatchObject({
        industry: 'Manufacturing',
        timezone: 'UTC',
        language: 'en',
      });
    });

    it('falls back to sensible settings for an organization that has none', async () => {
      get.mockResolvedValue({ id: 'org-1', name: 'New' });

      // `mn-MN`, matching an option the language select actually offers. A
      // bare `mn` matches neither and leaves the field blank.
      expect(await (await load()).getWorkspaceSettings()).toEqual({
        timezone: 'Asia/Ulaanbaatar',
        language: 'mn-MN',
        monthCloseDay: 5,
      });
    });

    it('lets a real failure surface rather than showing the demo workspace', async () => {
      get.mockRejectedValue(new Error('network'));

      await expect((await load()).getWorkspaceProfile()).rejects.toThrow('network');
    });
  });

  describe('in demo mode', () => {
    beforeEach(() => {
      demoMode = true;
    });

    it('never calls the API', async () => {
      await (await load()).getWorkspaceProfile();

      expect(get).not.toHaveBeenCalled();
    });

    it('recovers when the stored workspace is invalid JSON', async () => {
      localStorage.setItem('productivity-demo-organization', '{broken-json');

      const profile = await (await load()).getWorkspaceProfile();

      expect(profile.id).toBe('workspace-demo');
      expect(localStorage.getItem('productivity-demo-organization')).not.toBe('{broken-json');
    });

    it('keeps an edit between reads', async () => {
      const service = await load();

      await service.updateWorkspaceSettings({ timezone: 'UTC', language: 'en', monthCloseDay: 1 });

      expect((await service.getWorkspaceSettings()).timezone).toBe('UTC');
    });
  });

  describe('the audit log', () => {
    it('recovers when stored entries are invalid JSON', async () => {
      localStorage.setItem('productivity-demo-audit-log', '{broken-json');

      const logs = await (await load()).getAuditLog();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toHaveProperty('module');
      expect(localStorage.getItem('productivity-demo-audit-log')).not.toBe('{broken-json');
    });

    it('stays local, because there is no endpoint behind it', async () => {
      await (await load()).getAuditLog();

      expect(get).not.toHaveBeenCalled();
    });
  });
});
