import { UserRole } from './constants';
import { canAssignRole, hasPermission, permissionsFor, rolesAssignableBy } from './roles';

describe('role hierarchy', () => {
  it('lets each role hand out only roles below its own', () => {
    expect(rolesAssignableBy(UserRole.SUPER_ADMIN)).toEqual([
      UserRole.ORGANIZATION_ADMIN,
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.USER,
      UserRole.VIEWER,
    ]);
    expect(rolesAssignableBy(UserRole.MANAGER)).toEqual([UserRole.USER, UserRole.VIEWER]);
    expect(rolesAssignableBy(UserRole.USER)).toEqual([]);
    expect(rolesAssignableBy(UserRole.VIEWER)).toEqual([]);
  });

  it('never lets anyone hand out their own role', () => {
    Object.values(UserRole).forEach((role) => {
      expect(canAssignRole(role, role)).toBe(false);
    });
  });

  it('covers every role in the enum, so none silently grants nothing', () => {
    // `manager` and `viewer` were missing from the copy this table replaced,
    // which meant an organization admin could invite a manager but could not
    // promote a colleague to one.
    Object.values(UserRole).forEach((role) => {
      expect(rolesAssignableBy(role)).toBeDefined();
    });

    expect(canAssignRole(UserRole.ORGANIZATION_ADMIN, UserRole.MANAGER)).toBe(true);
    expect(canAssignRole(UserRole.ORGANIZATION_ADMIN, UserRole.VIEWER)).toBe(true);
  });

  it('grants nothing to an unknown or missing role', () => {
    expect(rolesAssignableBy(undefined)).toEqual([]);
    expect(canAssignRole('root', UserRole.USER)).toBe(false);
  });

  it('offers no path to a second super admin', () => {
    Object.values(UserRole).forEach((role) => {
      expect(canAssignRole(role, UserRole.SUPER_ADMIN)).toBe(false);
    });
  });
});

describe('the two tables agree with each other', () => {
  it('lets exactly the roles that can hand out a role also issue an invitation', () => {
    // An invitation grants a role, so being able to send one and being able
    // to grant one have to be the same set. When they drift, either somebody
    // can invite past their own level or a route exists that nobody can call.
    Object.values(UserRole).forEach((role) => {
      expect(hasPermission(role, 'invitations:create')).toBe(rolesAssignableBy(role).length > 0);
    });
  });

  it('gives everyone who may change a role the permission to reach that route', () => {
    Object.values(UserRole)
      .filter((role) => hasPermission(role, 'users:update'))
      .forEach((role) => {
        expect(rolesAssignableBy(role).length).toBeGreaterThan(0);
      });
  });

  it('nests the permissions the way the roles nest', () => {
    const order = [
      UserRole.VIEWER,
      UserRole.USER,
      UserRole.MANAGER,
      UserRole.ADMIN,
      UserRole.ORGANIZATION_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    order.forEach((role, index) => {
      if (index === 0) return;

      const below = permissionsFor(order[index - 1]);
      const here = permissionsFor(role);

      below.forEach((permission) => expect(here).toContain(permission));
      expect(here.length).toBeGreaterThan(below.length);
    });
  });
});
