import { UserRole } from './constants';
import { canAssignRole, rolesAssignableBy } from './roles';

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
