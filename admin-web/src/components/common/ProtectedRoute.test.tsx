import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  isLoading: false,
  user: null as null | { roles: string[] },
  permissions: [] as string[],
  knowsPermissions: false,
  hasPermission: (permission: string) => authState.permissions.includes(permission),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

const renderRoute = (roles?: string[], permission?: string) =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={roles} permission={permission}>
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
    authState.permissions = [];
    authState.knowsPermissions = false;
  });

  const signedInWith = (permissions: string[]) => {
    authState.isAuthenticated = true;
    authState.user = { roles: ['user'] };
    authState.permissions = permissions;
    authState.knowsPermissions = true;
  };

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

  describe('guarding by permission', () => {
    it('lets somebody in when the server says they may', () => {
      signedInWith(['auditlog:read']);

      renderRoute(undefined, 'auditlog:read');

      expect(screen.getByText('Admin content')).toBeTruthy();
    });

    it('turns somebody away when the server says they may not', () => {
      signedInWith(['projects:read']);

      renderRoute(undefined, 'auditlog:read');

      expect(screen.getByText('Dashboard page')).toBeTruthy();
    });

    it('lets somebody through while the permission list is unknown', () => {
      // Deliberate: this guard exists to avoid offering a page somebody cannot
      // use, and the server is what actually refuses them. A failed fetch of
      // the permission list must not lock people out of their own application.
      authState.isAuthenticated = true;
      authState.user = { roles: ['user'] };
      authState.permissions = [];
      authState.knowsPermissions = false;

      renderRoute(undefined, 'auditlog:read');

      expect(screen.getByText('Admin content')).toBeTruthy();
    });

    it('still refuses an unauthenticated visitor', () => {
      renderRoute(undefined, 'auditlog:read');

      expect(screen.getByText('Login page')).toBeTruthy();
    });
  });
});
