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
});
