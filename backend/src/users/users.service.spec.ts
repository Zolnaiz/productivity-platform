import { NotFoundException, UnauthorizedException } from '@nestjs/common';
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
  };
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      save: jest.fn(),
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
    expect(permissions).toContain('users:create');
    expect(permissions).toContain('users:update');
  });
});
