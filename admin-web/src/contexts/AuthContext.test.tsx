import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider } from './NotificationContext';

vi.mock('../services/auth.service', () => ({
  authService: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
  },
}));

vi.mock('../services/api', () => ({
  clearStoredAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  isDemoEnabled: () => true,
}));

const AuthProbe = () => {
  const { isAuthenticated, isLoading } = useAuth();
  return <div>{isLoading ? 'loading' : isAuthenticated ? 'signed-in' : 'signed-out'}</div>;
};

const renderAuth = () =>
  render(
    <NotificationProvider>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </NotificationProvider>,
  );

describe('AuthContext storage recovery', () => {
  beforeEach(() => {
    localStorage.clear();
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
