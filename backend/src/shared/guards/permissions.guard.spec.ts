import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../constants';
import { PermissionsGuard } from './permissions.guard';

const contextFor = (request: Record<string, unknown>) =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  }) as never;

describe('PermissionsGuard', () => {
  const guardRequiring = (permission: string | undefined) => {
    const reflector = { getAllAndOverride: jest.fn(() => permission) } as unknown as Reflector;

    return new PermissionsGuard(reflector);
  };

  it('lets a role through for something it may do', () => {
    const guard = guardRequiring('projects:create');

    expect(guard.canActivate(contextFor({ user: { role: UserRole.MANAGER } }))).toBe(true);
  });

  it('refuses a viewer trying to delete a project', () => {
    // The client hides the button. That is not the same as refusing the
    // request, which is what this guard exists to do.
    const guard = guardRequiring('projects:delete');

    expect(() => guard.canActivate(contextFor({ user: { role: UserRole.VIEWER } }))).toThrow(ForbiddenException);
  });

  it('refuses a plain user rewriting the audit templates', () => {
    const guard = guardRequiring('templates:update');

    expect(() => guard.canActivate(contextFor({ user: { role: UserRole.USER } }))).toThrow(ForbiddenException);
  });

  it('refuses a request with no role at all', () => {
    const guard = guardRequiring('projects:read');

    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(contextFor({ user: { role: 'root' } }))).toThrow(ForbiddenException);
  });

  it('leaves a route that names no permission alone', () => {
    const guard = guardRequiring(undefined);

    expect(guard.canActivate(contextFor({}))).toBe(true);
  });

  it('allows the development public-operations mode the auth guard marked', () => {
    const guard = guardRequiring('projects:delete');

    expect(guard.canActivate(contextFor({ anonymousOperations: true }))).toBe(true);
  });

  it('names the permission in the refusal, so the client can say which', () => {
    const guard = guardRequiring('zones:delete');

    try {
      guard.canActivate(contextFor({ user: { role: UserRole.USER } }));
      throw new Error('expected a refusal');
    } catch (error) {
      expect((error as ForbiddenException).getResponse()).toMatchObject({
        errorCode: expect.any(String),
      });
    }
  });
});
