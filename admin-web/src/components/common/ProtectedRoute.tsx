import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * The permission this page needs, named exactly as the server names it.
   *
   * Preferred over `roles`: the server's table is the authority, and client
   * role lists had drifted from it in both directions — an `admin` could open
   * the workspace settings and then be refused the save, while an
   * `organization_admin` was locked out of an audit log the server would have
   * served them.
   */
  permission?: string;
  /** For pages whose audience really is a role rather than a capability. */
  roles?: string[];
}

/**
 * Keeps somebody off a page they cannot use.
 *
 * This is a convenience, not a security boundary. The boundary is the guard on
 * the route and the organization filter on the query, both on the server. That
 * is why this fails *open* when the permission list has not arrived: a
 * transient failure fetching it should not lock people out of their own
 * application, and anything they reach anyway will still be refused where it
 * counts.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, permission, roles }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user, hasPermission, knowsPermissions } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (permission && knowsPermissions && !hasPermission(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (roles?.length) {
    const userRoles = user?.roles || [];
    const allowed = roles.some((role) => userRoles.includes(role as never));

    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
