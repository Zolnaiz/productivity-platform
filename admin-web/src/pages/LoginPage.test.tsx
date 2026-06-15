import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  loginDemo: vi.fn(),
}));

const apiMocks = vi.hoisted(() => ({
  demoEnabled: true,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authMocks,
}));

vi.mock('../services/api', () => ({
  isDemoEnabled: () => apiMocks.demoEnabled,
}));

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  beforeEach(() => {
    authMocks.login.mockReset();
    authMocks.loginDemo.mockReset();
    apiMocks.demoEnabled = true;
  });

  it('opens the demo workspace when demo mode is enabled', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Demo workspace нээх' }));

    expect(authMocks.loginDemo).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Dashboard page')).toBeTruthy();
  });

  it('hides the demo workspace action when demo mode is disabled', () => {
    apiMocks.demoEnabled = false;

    renderLogin();

    expect(screen.queryByRole('button', { name: 'Demo workspace нээх' })).toBeNull();
  });
});
