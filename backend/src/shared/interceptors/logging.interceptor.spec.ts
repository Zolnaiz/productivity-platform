import { redactSensitiveData, resolveRequestId } from './logging.interceptor';

describe('redactSensitiveData', () => {
  it('redacts sensitive keys recursively', () => {
    const result = redactSensitiveData({
      email: 'owner@example.com',
      password: 'secret-password',
      nested: {
        refreshToken: 'refresh-token',
        accessToken: 'access-token',
        safe: 'visible',
      },
      items: [
        {
          jwtSecret: 'jwt-secret',
          title: 'Task',
        },
      ],
    });

    expect(result).toEqual({
      email: 'owner@example.com',
      password: '[REDACTED]',
      nested: {
        refreshToken: '[REDACTED]',
        accessToken: '[REDACTED]',
        safe: 'visible',
      },
      items: [
        {
          jwtSecret: '[REDACTED]',
          title: 'Task',
        },
      ],
    });
  });
});

describe('resolveRequestId', () => {
  it('uses a provided request id header', () => {
    expect(resolveRequestId(' request-123 ')).toBe('request-123');
  });

  it('uses the first request id when multiple header values are present', () => {
    expect(resolveRequestId(['request-123', 'request-456'])).toBe('request-123');
  });

  it('generates a request id when the header is missing', () => {
    expect(resolveRequestId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });
});
