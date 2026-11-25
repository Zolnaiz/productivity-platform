/** Unit test for AuthContext.tsx: AuthContext: where a session comes from. */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { authService } from '../services/auth.service';
import { getAccessToken, refreshSession } from '../services/api';

vi.mock('../services/auth.service', () => ({
  authService: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/people.service', () => ({
  peopleService: { getOwnPermissions: vi.fn().mockResolvedValue({ permissions: ['tasks:read'] }) },
}));

// The real module - the token in memory, the demo flag, clearing - with only
// the network call to the refresh cookie replaced.
vi.mock('../services/api', async () => ({
  ...(await vi.importActual<typeof import('../services/api')>('../services/api')),
  refreshSession: vi.fn(),
}));

const person = { id: 'u1', email: 'op@example.com', name: 'Operator', roles: ['user'] };

const AuthProbe = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  return (
    <div>
      <p>{isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out'}</p>
      <button onClick={() => login({ email: person.email, password: 'secret' })}>sign in</button>
    </div>
  );
};

const renderAuth = () =>
  render(
    <NotificationProvider>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </NotificationProvider>,
  );

describe('AuthContext: where a session comes from', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(refreshSession).mockReset();
    vi.mocked(authService.getMe).mockReset();
    vi.mocked(authService.login).mockReset();
  });

  it('restores a session after a reload from the refresh cookie, not from storage', async () => {
    localStorage.setItem('user', JSON.stringify(person));
    vi.mocked(refreshSession).mockResolvedValue('fresh');
    vi.mocked(authService.getMe).mockResolvedValue(person as never);

    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('asks nothing of the server in a browser where nobody has signed in', async () => {
    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('ends signed out when the cookie can no longer restore the session', async () => {
    localStorage.setItem('user', JSON.stringify(person));
    vi.mocked(refreshSession).mockRejectedValue(new Error('AUTH_SESSION_EXPIRED'));

    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('takes a browser signed in by an earlier version onto the cookie, and forgets its stored token', async () => {
    localStorage.setItem('token', 'from-before');
    localStorage.setItem('user', JSON.stringify(person));
    vi.mocked(refreshSession).mockResolvedValue('fresh');
    vi.mocked(authService.getMe).mockResolvedValue(person as never);

    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('brings the demo workspace back without a server', async () => {
    localStorage.setItem('demoSession', 'true');
    localStorage.setItem('user', JSON.stringify(person));

    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it('keeps the token it signs in with in memory and out of storage', async () => {
    vi.mocked(authService.login).mockResolvedValue({ token: 'issued', refreshToken: '', user: person } as never);
    renderAuth();
    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());

    fireEvent.click(screen.getByText('sign in'));

    await waitFor(() => expect(screen.getByText('signed-in')).toBeTruthy());
    expect(getAccessToken()).toBe('issued');
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.length).toBe(0);
  });

  it('clears corrupted stored user data instead of crashing during initialization', async () => {
    localStorage.setItem('token', 'real-token');
    localStorage.setItem('refreshToken', 'refresh-token');
    localStorage.setItem('user', '{broken-json');

    renderAuth();

    await waitFor(() => expect(screen.getByText('signed-out')).toBeTruthy());
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
