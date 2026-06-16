import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('./api', () => ({
  get: apiMocks.get,
  post: apiMocks.post,
}));

describe('authService backend contract normalization', () => {
  beforeEach(() => {
    apiMocks.get.mockReset();
    apiMocks.post.mockReset();
  });

  it('normalizes backend login tokens and role into frontend auth shape', async () => {
    apiMocks.post.mockResolvedValueOnce({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'u1',
        email: 'admin@example.com',
        firstName: 'Org',
        lastName: 'Admin',
        role: 'organization_admin',
        organizationId: 'org1',
        isActive: true,
      },
    });
    const { authService } = await import('./auth.service');

    const response = await authService.login({
      email: 'admin@example.com',
      password: 'Password123',
    });

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@example.com',
      password: 'Password123',
    });
    expect(response.token).toBe('access-token');
    expect(response.refreshToken).toBe('refresh-token');
    expect(response.user.name).toBe('Org Admin');
    expect(response.user.roles).toContain('admin');
  });

  it('normalizes enveloped backend login responses', async () => {
    apiMocks.post.mockResolvedValueOnce({
      success: true,
      data: {
        access_token: 'wrapped-access-token',
        refresh_token: 'wrapped-refresh-token',
        user: {
          id: 'u1',
          email: 'owner@example.com',
          firstName: 'Demo',
          lastName: 'Owner',
          role: 'admin',
          organizationId: 'org1',
          isActive: true,
        },
      },
    });
    const { authService } = await import('./auth.service');

    const response = await authService.login({
      email: 'owner@example.com',
      password: 'Password123',
    });

    expect(response.token).toBe('wrapped-access-token');
    expect(response.refreshToken).toBe('wrapped-refresh-token');
    expect(response.user.name).toBe('Demo Owner');
  });

  it('normalizes profile responses from /auth/me', async () => {
    apiMocks.get.mockResolvedValueOnce({
      id: 'u2',
      email: 'owner@example.com',
      fullName: 'Owner User',
      role: 'super_admin',
      isActive: true,
    });
    const { authService } = await import('./auth.service');

    const user = await authService.getMe();

    expect(apiMocks.get).toHaveBeenCalledWith('/auth/me');
    expect(user.name).toBe('Owner User');
    expect(user.roles).toContain('super_admin');
  });

  it('normalizes enveloped profile responses from /auth/me', async () => {
    apiMocks.get.mockResolvedValueOnce({
      success: true,
      data: {
        id: 'u2',
        email: 'owner@example.com',
        fullName: 'Owner User',
        role: 'admin',
        isActive: true,
      },
    });
    const { authService } = await import('./auth.service');

    const user = await authService.getMe();

    expect(apiMocks.get).toHaveBeenCalledWith('/auth/me');
    expect(user.name).toBe('Owner User');
    expect(user.roles).toContain('admin');
  });

  it('maps frontend register data to the backend register DTO', async () => {
    apiMocks.post.mockResolvedValueOnce({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user: {
        id: 'u3',
        email: 'owner@example.com',
        firstName: 'Owner',
        lastName: 'User',
        role: 'admin',
        isActive: true,
      },
    });
    const { authService } = await import('./auth.service');

    await authService.register({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'Password123',
      organizationName: 'NewTech Operations',
      organizationId: 'existing-org-id-should-not-be-used-as-name',
    });

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'Owner',
      lastName: 'User',
      email: 'owner@example.com',
      password: 'Password123',
      organizationName: 'NewTech Operations',
      phone: undefined,
    });
  });

  it('normalizes refresh responses with renewed tokens and user data', async () => {
    apiMocks.post.mockResolvedValueOnce({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      user: {
        id: 'u4',
        email: 'refreshed@example.com',
        fullName: 'Refreshed User',
        role: 'admin',
        organizationId: 'org1',
        isActive: true,
      },
    });
    const { authService } = await import('./auth.service');

    const response = await authService.refreshToken('old-refresh-token');

    expect(apiMocks.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'old-refresh-token' });
    expect(response.token).toBe('new-access-token');
    expect(response.refreshToken).toBe('new-refresh-token');
    expect(response.user.name).toBe('Refreshed User');
    expect(response.user.roles).toContain('admin');
  });

  it('validates the current session through /auth/me', async () => {
    apiMocks.get.mockResolvedValueOnce({
      id: 'u5',
      email: 'owner@example.com',
    });
    const { authService } = await import('./auth.service');

    await expect(authService.validateSession()).resolves.toBe(true);

    expect(apiMocks.get).toHaveBeenCalledWith('/auth/me');
  });
});
