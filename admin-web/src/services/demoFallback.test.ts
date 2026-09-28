import { beforeEach, describe, expect, it } from 'vitest';
import { shouldUseDemoFallback } from './api';

/**
 * Development answers a failed request from the demo data only when there was
 * no server to ask. A server that answered - 400, 403, 500 - said something
 * real, and hiding it is how a plan editor refused on every save looked fine.
 */
describe('falling back to the demo data in development', () => {
  beforeEach(() => localStorage.setItem('token', 'real-token'));

  it('does when the server could not be reached', () => {
    expect(shouldUseDemoFallback(new Error('Network Error'))).toBe(true);
  });

  it('does not when the server answered', () => {
    expect(shouldUseDemoFallback({ response: { status: 400, data: { errorCode: 'VALIDATION_FAILED' } } })).toBe(false);
  });

  it('always does in the demo', () => {
    localStorage.setItem('token', 'demo-token');

    expect(shouldUseDemoFallback({ response: { status: 500 } })).toBe(true);
  });
});
