import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
const del = vi.fn();
let demoMode = false;

vi.mock('./api', () => ({
  get: (...args: unknown[]) => get(...args),
  post: (...args: unknown[]) => post(...args),
  patch: (...args: unknown[]) => patch(...args),
  del: (...args: unknown[]) => del(...args),
  isDemoMode: () => demoMode,
  shouldUseDemoFallback: () => demoMode,
  localId: () => 'local-1',
}));

const load = async () => (await import('./people.service')).peopleService;

describe('peopleService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    localStorage.clear();
    demoMode = false;
  });

  describe('against the API', () => {
    it('reads the page the users endpoint returns without unwrapping it twice', async () => {
      // `get` already strips the `{ success, data }` envelope, and the page
      // inside is itself `{ data, meta }`. Unwrapping again would silently
      // hand back the array and lose the paging metadata.
      get.mockResolvedValue({
        data: [{ id: 'u1', firstName: 'Bat', lastName: 'Dorj', email: 'bat@example.com', role: 'user', isActive: true }],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const page = await (await load()).listMembers({ search: 'bat' });

      expect(get).toHaveBeenCalledWith('/users', { search: 'bat' });
      expect(page.data).toHaveLength(1);
      expect(page.meta?.total).toBe(1);
    });

    it('copes with a bare array, in case the envelope collapses', async () => {
      get.mockResolvedValue([{ id: 'u1', email: 'bat@example.com' }]);

      expect((await (await load()).listMembers()).data).toHaveLength(1);
    });

    it('activates and deactivates through their own routes', async () => {
      post.mockResolvedValue({ id: 'u1' });
      const service = await load();

      await service.setMemberActive('u1', false);
      expect(post).toHaveBeenCalledWith('/users/u1/deactivate');

      await service.setMemberActive('u1', true);
      expect(post).toHaveBeenCalledWith('/users/u1/activate');
    });

    it('changes a role through the route that checks the hierarchy', async () => {
      post.mockResolvedValue({ id: 'u1', role: 'manager' });

      await (await load()).changeMemberRole('u1', 'manager');

      expect(post).toHaveBeenCalledWith('/users/u1/change-role', { role: 'manager' });
    });

    it('invites rather than creating, because the server has no create route', async () => {
      const service = await load();

      expect(service).not.toHaveProperty('createUser');
      post.mockResolvedValue({ invitation: { id: 'i1' }, token: 'secret' });

      const issued = await service.invite('new@example.com', 'user');

      expect(post).toHaveBeenCalledWith('/auth/invitations', { email: 'new@example.com', role: 'user' });
      expect(issued.token).toBe('secret');
    });

    it('sends only editable details when a member is edited', async () => {
      patch.mockResolvedValue({ id: 'u1' });

      await (await load()).updateMember('u1', { firstName: 'Bat', position: 'Инженер' });

      expect(patch).toHaveBeenCalledWith('/users/u1', { firstName: 'Bat', position: 'Инженер' });
    });

    it('revokes an invitation by id', async () => {
      del.mockResolvedValue({ id: 'i1', revoked: true });

      await (await load()).revokeInvitation('i1');

      expect(del).toHaveBeenCalledWith('/auth/invitations/i1');
    });

    it('lets a real failure surface rather than showing demo people', async () => {
      get.mockRejectedValue(new Error('network'));

      await expect((await load()).listMembers()).rejects.toThrow('network');
    });
  });

  describe('in demo mode', () => {
    beforeEach(() => {
      demoMode = true;
    });

    it('never calls the API', async () => {
      const service = await load();

      await service.getMembers();
      await service.setMemberActive('u1', false);
      await service.invite('demo@example.com', 'user');

      expect(get).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
    });

    it('recovers when stored members are invalid JSON', async () => {
      localStorage.setItem('productivity-demo-people', '{broken-json');

      const members = await (await load()).getMembers();

      expect(members.length).toBeGreaterThan(0);
      expect(members[0]).toHaveProperty('email');
      expect(localStorage.getItem('productivity-demo-people')).not.toBe('{broken-json');
    });

    it('recovers when stored departments are invalid JSON', async () => {
      localStorage.setItem('productivity-demo-departments', '{broken-json');

      const departments = await (await load()).getDepartments();

      expect(departments.length).toBeGreaterThan(0);
      expect(departments[0]).toHaveProperty('memberCount');
      expect(localStorage.getItem('productivity-demo-departments')).not.toBe('{broken-json');
    });

    it('keeps a deactivation between reads', async () => {
      const service = await load();

      await service.setMemberActive('u1', false);

      expect((await service.getMembers()).find((member) => member.id === 'u1')?.isActive).toBe(false);
    });
  });
});
