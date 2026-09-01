import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import i18n from './index';
import { apiErrorMessage, errorCodeOf } from './apiError';

const t = i18n.t.bind(i18n) as TFunction;

const axiosError = (status: number, errorCode?: string) => ({
  response: { status, data: errorCode ? { errorCode } : {} },
});

describe('errorCodeOf', () => {
  it('uses the code the API sent', () => {
    expect(errorCodeOf(axiosError(401, 'AUTH_INVALID_CREDENTIALS'))).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('falls back to the status when the API sent no code', () => {
    expect(errorCodeOf(axiosError(404))).toBe('RESOURCE_NOT_FOUND');
    expect(errorCodeOf(axiosError(403))).toBe('ACCESS_DENIED');
    expect(errorCodeOf(axiosError(500))).toBe('INTERNAL_ERROR');
  });

  it('reports a request that never reached the server as offline', () => {
    expect(errorCodeOf(new Error('Network Error'))).toBe('offline');
  });
});

describe('apiErrorMessage', () => {
  it('translates the code rather than showing the API English', () => {
    expect(apiErrorMessage(axiosError(401, 'AUTH_INVALID_CREDENTIALS'), t)).toBe(
      'Email or password is incorrect.',
    );
  });

  it('falls back to a generic message for a code this build does not know', () => {
    // An older client against a newer API: the code exists, the wording does not.
    expect(apiErrorMessage(axiosError(400, 'AUTH_SOMETHING_ADDED_LATER'), t)).toBe(
      'Something went wrong. Try again.',
    );
  });

  it('never returns a raw error code', () => {
    const message = apiErrorMessage(axiosError(418, 'TEAPOT'), t);

    expect(message).not.toMatch(/^[A-Z_]+$/);
    expect(message.length).toBeGreaterThan(0);
  });
});
