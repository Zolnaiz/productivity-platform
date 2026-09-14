import { PATH_METADATA } from '@nestjs/common/constants';
import { PERMISSION_KEY } from '../shared/decorators/permissions.decorator';
import { allPermissions, permissionsFor } from '../shared/roles';
import { UserRole } from '../shared/constants';
import { UsersController } from './users.controller';

/**
 * The shape of the member-management API.
 *
 * Three things here are worth a test rather than a comment. There is no create
 * endpoint, because an invitation is the only way into an organization and a
 * `POST /users` would be a way around it. The administrative routes name a
 * permission, because a guard is only as good as the decorator on the route.
 * And the self-service routes deliberately name none, because somebody has to
 * be able to read and edit their own profile whatever their role.
 */
describe('UsersController', () => {
  const usersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    activate: jest.fn(),
    deactivate: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    getPermissions: jest.fn(),
    changeRole: jest.fn(),
  };

  const controller = new UsersController(usersService as never);
  const request = {
    user: { id: 'admin-1', role: UserRole.ORGANIZATION_ADMIN, organizationId: 'org-1' },
  };

  const permissionOf = (method: string) =>
    Reflect.getMetadata(PERMISSION_KEY, UsersController.prototype[method]) as string | undefined;

  beforeEach(() => jest.clearAllMocks());

  it('has no endpoint that creates a user', () => {
    const methods = Object.getOwnPropertyNames(UsersController.prototype);

    expect(methods.filter((name) => /create/i.test(name))).toEqual([]);
  });

  it('passes the validated query straight through, scoped to the caller', async () => {
    const query = { page: 2, limit: 20, search: 'bat' };

    await controller.findAll(request, query as never);

    expect(usersService.findAll).toHaveBeenCalledWith(query, 'org-1', UserRole.ORGANIZATION_ADMIN);
  });

  it('reads the role out of a validated body rather than a bare string', async () => {
    await controller.changeRole('user-1', { role: UserRole.MANAGER }, request);

    expect(usersService.changeRole).toHaveBeenCalledWith('user-1', UserRole.MANAGER, request.user);
  });

  describe('route permissions', () => {
    it.each([
      ['findAll', 'users:read'],
      ['update', 'users:update'],
      ['remove', 'users:delete'],
      ['activate', 'users:update'],
      ['deactivate', 'users:update'],
      ['changeRole', 'users:update'],
    ])('guards %s with %s', (method, permission) => {
      expect(permissionOf(method)).toBe(permission);
    });

    it.each(['getProfile', 'updateProfile', 'getOwnPermissions'])(
      'leaves %s open to any signed-in member',
      (method) => {
        expect(permissionOf(method)).toBeUndefined();
      },
    );

    it('asks only for permissions the role table defines', () => {
      const known = allPermissions();
      const asked = Object.getOwnPropertyNames(UsersController.prototype)
        .filter((name) => name !== 'constructor')
        .filter((name) => Reflect.getMetadata(PATH_METADATA, UsersController.prototype[name]) !== undefined)
        .map((name) => ({ route: name, permission: permissionOf(name) }))
        .filter(({ permission }) => permission && !known.includes(permission));

      expect({ askingForNothing: asked }).toEqual({ askingForNothing: [] });
    });

    it('admits the seeded workspace owner, who is an admin rather than an org admin', () => {
      // The role list this replaced named only super_admin and
      // organization_admin, which locked the seeded owner out of their team.
      expect(permissionsFor(UserRole.ADMIN)).toContain('users:read');
      expect(permissionsFor(UserRole.ADMIN)).toContain('users:update');
    });

    it('keeps a plain user out of the administrative routes', () => {
      const user = permissionsFor(UserRole.USER);

      expect(user).not.toContain('users:read');
      expect(user).not.toContain('users:update');
      expect(user).not.toContain('users:delete');
    });
  });
});
