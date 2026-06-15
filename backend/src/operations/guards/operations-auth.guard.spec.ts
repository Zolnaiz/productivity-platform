import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OperationsAuthGuard } from './operations-auth.guard';

const createContext = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
  }) as any;

const createGuard = ({
  allowPublicOperations = false,
  payload,
  verifyError,
}: {
  allowPublicOperations?: boolean;
  payload?: Record<string, unknown>;
  verifyError?: Error;
}) => {
  const jwtService = {
    verify: jest.fn(() => {
      if (verifyError) {
        throw verifyError;
      }

      return (
        payload || {
          sub: 'user-1',
          email: 'owner@example.com',
          role: 'admin',
          organizationId: 'org-1',
          permissions: ['operations:read'],
        }
      );
    }),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'ALLOW_PUBLIC_OPERATIONS') {
        return allowPublicOperations;
      }

      if (key === 'JWT_SECRET') {
        return 'test-secret';
      }

      return undefined;
    }),
  } as unknown as ConfigService;

  return {
    guard: new OperationsAuthGuard(jwtService, configService),
    jwtService,
  };
};

describe('OperationsAuthGuard', () => {
  it('allows public access when explicitly enabled', () => {
    const { guard } = createGuard({ allowPublicOperations: true });

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('rejects missing bearer token by default', () => {
    const { guard } = createGuard({});

    expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
  });

  it('rejects malformed authorization headers', () => {
    const { guard } = createGuard({});

    expect(() => guard.canActivate(createContext('Token abc'))).toThrow(UnauthorizedException);
  });

  it('rejects authorization headers with extra parts', () => {
    const { guard } = createGuard({});

    expect(() => guard.canActivate(createContext('Bearer token extra'))).toThrow(UnauthorizedException);
  });

  it('attaches verified user payload to the request', () => {
    const { guard, jwtService } = createGuard({});
    const request = {
      headers: { authorization: 'Bearer smoke-token' },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('smoke-token', { secret: 'test-secret' });
    expect((request as any).user).toEqual({
      id: 'user-1',
      email: 'owner@example.com',
      role: 'admin',
      organizationId: 'org-1',
      permissions: ['operations:read'],
    });
  });

  it('requires organization context unless public operations are enabled', () => {
    const { guard } = createGuard({
      payload: {
        sub: 'user-1',
        email: 'owner@example.com',
        role: 'admin',
      },
    });

    expect(() => guard.canActivate(createContext('Bearer smoke-token'))).toThrow(UnauthorizedException);
  });

  it('rejects invalid or expired tokens', () => {
    const { guard } = createGuard({ verifyError: new Error('jwt expired') });

    expect(() => guard.canActivate(createContext('Bearer expired-token'))).toThrow(UnauthorizedException);
  });
});
