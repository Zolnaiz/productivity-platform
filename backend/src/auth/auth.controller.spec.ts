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
    controller = new AuthController(authService as unknown as AuthService, config as never);
  });

  const config = { get: jest.fn(() => 'test') };
  const plain = { headers: {} };
  const response = () => ({ cookie: jest.fn(), clearCookie: jest.fn() });

  it('passes register payloads to AuthService', async () => {
    const dto = {
      firstName: 'Org',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'Password123',
      organizationName: 'Demo Org',
    };

    await controller.register(dto, plain, response());

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('passes login payloads to AuthService without relying on request user state', async () => {
    const dto = {
      email: 'admin@example.com',
      password: 'Password123',
    };

    await controller.login(dto, plain, response());

    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('passes refreshToken body value to AuthService', async () => {
    await controller.refresh({ refreshToken: 'refresh-token' }, plain, response());

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

    await controller.logout(request, response());
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

  describe('a browser that asks for the session cookie', () => {
    const browser = { headers: { 'x-session-cookie': 'true' } };
    // A real-shaped token, so its expiry can be read: exp = 2026-10-29T00:00:00Z.
    const refresh = `x.${Buffer.from(JSON.stringify({ sub: 'u1', exp: 1793232000 })).toString('base64url')}.y`;

    it('gets the refresh token as an HttpOnly cookie, not in the body', async () => {
      authService.login = jest.fn().mockResolvedValue({ access_token: 'a', refresh_token: refresh, user: {} });
      const res = response();

      const body = await controller.login({ email: 'a@b.mn', password: 'x' }, browser, res);

      expect(body).not.toHaveProperty('refresh_token');
      expect(body).toMatchObject({ access_token: 'a' });
      expect(res.cookie).toHaveBeenCalledWith(
        'pp_refresh',
        refresh,
        expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/api/auth', maxAge: expect.any(Number) }),
      );
    });

    it('refreshes from the cookie when the body has no token', async () => {
      authService.refreshToken = jest.fn().mockResolvedValue({ access_token: 'b', refresh_token: refresh });

      await controller.refresh({}, { headers: { ...browser.headers, cookie: `other=1; pp_refresh=${refresh}` } }, response());

      expect(authService.refreshToken).toHaveBeenCalledWith(refresh);
    });

    it('is told the session is over when there is neither', async () => {
      await expect(controller.refresh({}, browser, response())).rejects.toMatchObject({
        response: expect.objectContaining({ errorCode: 'AUTH_SESSION_EXPIRED' }),
      });
    });

    it('loses the cookie on logout', async () => {
      const res = response();
      await controller.logout({ user: { id: 'u1' } }, res);

      expect(res.clearCookie).toHaveBeenCalledWith('pp_refresh', expect.objectContaining({ path: '/api/auth' }));
    });

    it('leaves the phone, which does not ask, as it was', async () => {
      authService.login = jest.fn().mockResolvedValue({ access_token: 'a', refresh_token: refresh });
      const res = response();

      expect(await controller.login({ email: 'a@b.mn', password: 'x' }, plain, res)).toMatchObject({ refresh_token: refresh });
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
