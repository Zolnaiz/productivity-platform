import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authService: jest.Mocked<Partial<AuthService>>;
  let controller: AuthController;

  beforeEach(() => {
    authService = {
      register: jest.fn().mockResolvedValue({ ok: true }),
      login: jest.fn().mockResolvedValue({ access_token: 'token' }),
      refreshToken: jest.fn().mockResolvedValue({ access_token: 'new-token' }),
      logout: jest.fn().mockResolvedValue({ message: 'ok' }),
      getProfile: jest.fn().mockResolvedValue({ id: 'user-1' }),
      forgotPassword: jest.fn().mockResolvedValue({ message: 'sent' }),
      resetPassword: jest.fn().mockResolvedValue({ message: 'reset' }),
      changePassword: jest.fn().mockResolvedValue({ message: 'changed' }),
    };
    controller = new AuthController(authService as unknown as AuthService);
  });

  it('passes register payloads to AuthService', async () => {
    const dto = {
      firstName: 'Org',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      organizationName: 'Demo Org',
    };

    await controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('passes login payloads to AuthService without relying on request user state', async () => {
    const dto = {
      email: 'admin@example.com',
      password: 'Password123',
    };

    await controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('passes refreshToken body value to AuthService', async () => {
    await controller.refresh({ refreshToken: 'refresh-token' });

    expect(authService.refreshToken).toHaveBeenCalledWith('refresh-token');
  });

  it('uses the authenticated user id for profile aliases', async () => {
    const request = { user: { id: 'user-1' } };

    await controller.getProfile(request);
    await controller.getMe(request);

    expect(authService.getProfile).toHaveBeenCalledTimes(2);
    expect(authService.getProfile).toHaveBeenCalledWith('user-1');
  });

  it('uses the authenticated user id for logout and password changes', async () => {
    const request = { user: { id: 'user-1' } };

    await controller.logout(request);
    await controller.changePassword(request, {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });

    expect(authService.logout).toHaveBeenCalledWith('user-1');
    expect(authService.changePassword).toHaveBeenCalledWith('user-1', 'old-password', 'new-password');
  });

  it('passes forgot and reset password DTO values to AuthService', async () => {
    await controller.forgotPassword({ email: 'admin@example.com' });
    await controller.resetPassword({ token: 'reset-token', password: 'Password123' });

    expect(authService.forgotPassword).toHaveBeenCalledWith('admin@example.com');
    expect(authService.resetPassword).toHaveBeenCalledWith('reset-token', 'Password123');
  });
});
