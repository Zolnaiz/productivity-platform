import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserRole } from '../shared/constants';

const user = {
  id: 'user-1',
  email: 'user@example.com',
  password: 'hashed-old-password',
  firstName: 'Demo',
  lastName: 'User',
  role: UserRole.USER,
  isActive: true,
};

describe('UsersService', () => {
  let repository: {
    findOne: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let query: Record<string, jest.Mock>;
  let service: UsersService;

  beforeEach(() => {
    query = {
      leftJoinAndSelect: jest.fn(() => query),
      where: jest.fn(() => query),
      andWhere: jest.fn(() => query),
      skip: jest.fn(() => query),
      take: jest.fn(() => query),
      orderBy: jest.fn(() => query),
      getCount: jest.fn(async () => 0),
      getMany: jest.fn(async () => []),
    };
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => query),
    };
    service = new UsersService(repository as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('changes a password after validating the current password', async () => {
    repository.findOne.mockResolvedValue({ ...user });
    repository.save.mockImplementation(async (value) => value);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-new-password' as never);

    const result = await service.changePassword('user-1', 'old-password', 'new-password');

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      relations: ['organization'],
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('old-password', 'hashed-old-password');
    expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed-new-password' }));
    expect(result.password).toBe('hashed-new-password');
  });

  it('rejects password changes for unknown users', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.changePassword('missing-user', 'old-password', 'new-password')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects password changes when the current password is incorrect', async () => {
    repository.findOne.mockResolvedValue({ ...user });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(service.changePassword('user-1', 'bad-password', 'new-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows ADMIN users to read users from their own organization', async () => {
    repository.findOne.mockResolvedValue({
      ...user,
      organizationId: 'org-1',
    });

    const result = await service.findOne('user-1', {
      id: 'admin-1',
      role: UserRole.ADMIN,
      organizationId: 'org-1',
    });

    expect(result.id).toBe('user-1');
  });

  it('includes user-management permissions for ADMIN users', () => {
    const permissions = service['getRolePermissions'](UserRole.ADMIN);

    expect(permissions).toContain('users:read');
    expect(permissions).toContain('users:update');
    expect(permissions).toContain('users:delete');
    // Not `users:create`: there is no create endpoint, because an invitation
    // is the only way into an organization. Issuing one is the capability.
    expect(permissions).not.toContain('users:create');
    expect(permissions).toContain('invitations:create');
  });

  describe('editing a member', () => {
    const admin = { id: 'admin-1', role: UserRole.ORGANIZATION_ADMIN, organizationId: 'org-1' };

    beforeEach(() => {
      repository.save.mockImplementation(async (value) => value);
    });

    it('changes the details it is given', async () => {
      repository.findOne.mockResolvedValue({ ...user, organizationId: 'org-1' });

      const result = await service.update('user-1', { firstName: 'Bat', position: 'Engineer' }, admin);

      expect(result.firstName).toBe('Bat');
      expect(result.position).toBe('Engineer');
    });

    it('ignores a role smuggled past the validation pipe', async () => {
      // The DTO has no role field, so the pipe rejects one over HTTP. This is
      // the second lock, for the internal callers no pipe runs in front of.
      repository.findOne.mockResolvedValue({ ...user, organizationId: 'org-1' });

      const result = await service.update(
        'user-1',
        {
          firstName: 'Bat',
          role: UserRole.SUPER_ADMIN,
          organizationId: 'other-org',
          isActive: false,
        } as never,
        admin,
      );

      expect(result.role).toBe(UserRole.USER);
      expect(result.organizationId).toBe('org-1');
      expect(result.isActive).toBe(true);
    });

    it('does not let a profile edit set a password', async () => {
      repository.findOne.mockResolvedValue({ ...user });
      const hash = jest.spyOn(bcrypt, 'hash');

      const result = await service.updateProfile('user-1', { password: 'Whatever1' } as never);

      expect(result.password).toBe('hashed-old-password');
      expect(hash).not.toHaveBeenCalled();
    });
  });

  describe('changing a role', () => {
    const orgAdmin = { id: 'admin-1', role: UserRole.ORGANIZATION_ADMIN, organizationId: 'org-1' };

    beforeEach(() => {
      repository.save.mockImplementation(async (value) => value);
    });

    it('promotes a member to a role below the caller', async () => {
      repository.findOne.mockResolvedValue({ ...user, organizationId: 'org-1' });

      const result = await service.changeRole('user-1', UserRole.MANAGER, orgAdmin);

      expect(result.role).toBe(UserRole.MANAGER);
    });

    it('refuses to change the role of the caller themselves', async () => {
      repository.findOne.mockResolvedValue({ ...user, id: 'admin-1', organizationId: 'org-1' });

      await expect(service.changeRole('admin-1', UserRole.SUPER_ADMIN, orgAdmin)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('refuses to grant a role above the caller', async () => {
      repository.findOne.mockResolvedValue({ ...user, organizationId: 'org-1' });

      await expect(service.changeRole('user-1', UserRole.SUPER_ADMIN, orgAdmin)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('refuses to demote somebody at the same level as the caller', async () => {
      // Not being able to promote past yourself is worth nothing if you can
      // demote the person beside you instead.
      repository.findOne.mockResolvedValue({
        ...user,
        id: 'peer-1',
        role: UserRole.ORGANIZATION_ADMIN,
        organizationId: 'org-1',
      });

      await expect(service.changeRole('peer-1', UserRole.USER, orgAdmin)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('listing members', () => {
    it('searches case-insensitively and pages within bounds', async () => {
      await service.findAll({ page: 2, limit: 5, search: 'bat' }, 'org-1', UserRole.ORGANIZATION_ADMIN);

      expect(query.andWhere).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), { search: '%bat%' });
      expect(query.skip).toHaveBeenCalledWith(5);
      expect(query.take).toHaveBeenCalledWith(5);
    });

    it('falls back to a first page when the caller passes nothing', async () => {
      await service.findAll({}, 'org-1', UserRole.ORGANIZATION_ADMIN);

      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.take).toHaveBeenCalledWith(20);
    });

    it('keeps an organization admin inside their own organization', async () => {
      await service.findAll({}, 'org-1', UserRole.ORGANIZATION_ADMIN);

      expect(query.andWhere).toHaveBeenCalledWith('user.organizationId = :organizationId', {
        organizationId: 'org-1',
      });
    });
  });

  describe('bringing a removed member back', () => {
    const admin = { id: 'admin-1', role: UserRole.ORGANIZATION_ADMIN, organizationId: 'org-1' };

    it('finds the soft-deleted row and clears the delete mark', async () => {
      repository.findOne.mockResolvedValue({
        ...user,
        organizationId: 'org-1',
        isActive: false,
        deletedAt: new Date(),
      });
      repository.save.mockImplementation(async (value) => value);

      const result = await service.activate('user-1', admin);

      expect(repository.findOne).toHaveBeenCalledWith(expect.objectContaining({ withDeleted: true }));
      expect(result.isActive).toBe(true);
      expect(result.deletedAt).toBeNull();
    });
  });

  describe('permissions', () => {
    it('describes every role in the enum', () => {
      Object.values(UserRole).forEach((role) => {
        expect(service['getRolePermissions'](role).length).toBeGreaterThan(0);
      });
    });

    it('nests the roles, so a manager can do what a user can', () => {
      const forUser = service['getRolePermissions'](UserRole.USER);
      const forManager = service['getRolePermissions'](UserRole.MANAGER);

      forUser.forEach((permission) => expect(forManager).toContain(permission));
      expect(forManager).toContain('projects:create');
      expect(service['getRolePermissions'](UserRole.VIEWER)).not.toContain('tasks:update');
    });

    it('names modules this system actually has', () => {
      const all = Object.values(UserRole).flatMap((role) => service['getRolePermissions'](role));

      // Questionnaires and responses were removed; expenses still live under
      // the operations module, so they stay.
      expect(all).not.toContain('questionnaires:read');
      expect(all).not.toContain('responses:read');
      expect(all).toContain('expenses:read');
      expect(all).toContain('zones:read');
    });
  });
});
