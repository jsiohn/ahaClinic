import React from "react";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  Permission,
} from "../utils/auth";
import { User } from "../types/models";

interface ProtectedComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface PermissionGuardProps extends ProtectedComponentProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any permission
}

interface RoleGuardProps extends ProtectedComponentProps {
  role?: User["role"];
  roles?: User["role"][];
}

// Component to protect content based on specific permission
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}) => {
  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Component to protect content based on user role
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  roles,
  fallback = null,
}) => {
  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (roles && roles.length > 0) {
    hasAccess = roles.some((r) => hasRole(r));
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Combined guard that can check both permissions and roles
export const AccessGuard: React.FC<PermissionGuardProps & RoleGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
}) => {
  let hasPermissionAccess = true;
  let hasRoleAccess = true;

  // Check permissions if provided
  if (permission) {
    hasPermissionAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermissionAccess = requireAll
      ? hasAllPermissions(...permissions)
      : hasAnyPermission(...permissions);
  }

  // Check roles if provided
  if (role) {
    hasRoleAccess = hasRole(role);
  } else if (roles && roles.length > 0) {
    hasRoleAccess = roles.some((r) => hasRole(r));
  }

  const hasAccess = hasPermissionAccess && hasRoleAccess;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Higher-order component for protecting entire components
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission,
  fallback?: React.ComponentType
) {
  return function ProtectedComponent(props: P) {
    if (hasPermission(permission)) {
      return <Component {...props} />;
    }

    if (fallback) {
      const Fallback = fallback;
      return <Fallback />;
    }

    return null;
  };
}

// Higher-order component for protecting components based on role
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: User["role"],
  fallback?: React.ComponentType
) {
  return function ProtectedComponent(props: P) {
    if (hasRole(requiredRole)) {
      return <Component {...props} />;
    }

    if (fallback) {
      const Fallback = fallback;
      return <Fallback />;
    }

    return null;
  };
}
