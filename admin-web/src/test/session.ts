/**
 * Signs a test in as a real, non-demo session is signed in: an access token in
 * the API module's memory. Browser storage no longer holds it, so a test can no
 * longer stand one up with `localStorage.setItem('token', …)`.
 *
 * The module is imported here, at the call, rather than at the top of the test
 * file: tests that call `vi.resetModules()` load a fresh API module for the
 * service under test, and only an import made after the reset reaches that same
 * instance - and the token it reads.
 */
export const signInWithToken = async (token = 'real-token') => {
  const { setAccessToken } = await import('../services/api');
  setAccessToken(token);
};
