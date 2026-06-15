import { ConflictException, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { UserRole } from '../shared/constants';

const mockUser = {
  id: 'user-1',
  email: 'admin@example.com',
  firstName: 'Org',
  lastName: 'Admin',
  fullName: 'Org Admin',
  role: UserRole.ADMIN,
  organizationId: 'org-1',
  organization: { id: 'org-1', name: 'Demo Org' },
  profileImageUrl: undefined,
  phone: undefined,
  isActive: true,
  createdAt: new Date('2026-06-01T00:00:00.000Z'),
  updatedAt: new Date('2026-06-01T00:00:00.000Z'),
} as any;

describe('AuthService', () => {
  let usersService: jest.Mocked<Partial<UsersService>>;
  let organizationsService: jest.Mocked<Partial<OrganizationsService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: Partial<ConfigService>;
  let service: AuthService;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    usersService = {
      validateUser: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      changePassword: jest.fn(),
    };
    organizationsService = {
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token'),
      verify: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          JWT_SECRET: 'jwt-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '14d',
        };
        return values[key] || defaultValue;
      }) as any,
    };
    service = new AuthService(
      usersService as unknown as UsersService,
      organizationsService as unknown as OrganizationsService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in with UsersService validation and returns backend token contract', async () => {
    usersService.validateUser.mockResolvedValue(mockUser);

    const response = await service.login({
      email: 'admin@example.com',
      password: 'Password123',
    });

    expect(usersService.validateUser).toHaveBeenCalledWith('admin@example.com', 'Password123');
    expect(response.access_token).toBe('access-token');
    expect(response.refresh_token).toBe('refresh-token');
    expect(response.user).toMatchObject({
      id: 'user-1',
      role: UserRole.ADMIN,
      organizationId: 'org-1',
    });
  });

  it('rejects invalid login credentials', async () => {
    usersService.validateUser.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates organization and first admin user during registration', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    organizationsService.create.mockResolvedValue({ id: 'org-1', name: 'Demo Org' } as any);
    usersService.create.mockResolvedValue(mockUser);

    const response = await service.register({
      firstName: 'Org',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      organizationName: 'Demo Org',
    });

    expect(organizationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Demo Org',
        contactEmail: 'admin@example.com',
      }),
    );
    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Org',
        lastName: 'Admin',
        role: UserRole.ADMIN,
      }),
      'org-1',
    );
    expect(response.user.organizationId).toBe('org-1');
  });

  it('rejects registration for an existing email', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.register({
        firstName: 'Org',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'Password123',
        organizationName: 'Demo Org',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refreshes tokens with refresh secret and active user lookup', async () => {
    jwtService.verify.mockReturnValue({ sub: 'user-1' });
    usersService.findById.mockResolvedValue(mockUser);

    const response = await service.refreshToken('refresh-token-input');

    expect(jwtService.verify).toHaveBeenCalledWith('refresh-token-input', {
      secret: 'refresh-secret',
    });
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(response.access_token).toBe('access-token');
  });

  it('uses validated config values when signing access and refresh tokens', async () => {
    usersService.validateUser.mockResolvedValue(mockUser);

    await service.login({
      email: 'admin@example.com',
      password: 'Password123',
    });

    expect(jwtService.sign).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sub: 'user-1' }),
      expect.objectContaining({ expiresIn: '15m' }),
    );
    expect(jwtService.sign).toHaveBeenNthCalledWith(
      2,
      { sub: 'user-1' },
      expect.objectContaining({ secret: 'refresh-secret', expiresIn: '14d' }),
    );
  });

  it('delegates password changes to UsersService changePassword', async () => {
    usersService.changePassword.mockResolvedValue(mockUser);

    const response = await service.changePassword('user-1', 'old-password', 'new-password');

    expect(usersService.changePassword).toHaveBeenCalledWith('user-1', 'old-password', 'new-password');
    expect(usersService.update).not.toHaveBeenCalled();
    expect(response).toEqual({ message: 'Password changed successfully' });
  });
});
