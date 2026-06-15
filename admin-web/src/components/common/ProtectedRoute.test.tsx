import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: null as null | { roles: string[] },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderRoute = (roles?: string[]) =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={roles}>
              <div>Admin content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.isLoading = false;
    authState.user = null;
  });

  it('redirects unauthenticated users to login', () => {
    renderRoute();

    expect(screen.getByText('Login page')).toBeTruthy();
  });

  it('redirects authenticated users without required roles to dashboard', () => {
    authState.isAuthenticated = true;
    authState.user = { roles: ['user'] };

    renderRoute(['admin']);

    expect(screen.getByText('Dashboard page')).toBeTruthy();
  });

  it('renders protected content for users with required roles', () => {
    authState.isAuthenticated = true;
    authState.user = { roles: ['admin'] };

    renderRoute(['admin']);

    expect(screen.getByText('Admin content')).toBeTruthy();
  });
});
