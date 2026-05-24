// Permission helper utilities
import api from "../api";

const PERMISSIONS_KEY = 'user_permissions';
const REVOKED_KEY = 'user_revoked_permissions';
const ROLES_KEY = 'user_roles';
const USER_KEY = 'user_data';

export const setUserData = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUserData = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
};

export const clearUserData = () => {
  localStorage.removeItem(USER_KEY);
};

export const setUserPermissions = (permissions, revoked = []) => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
  localStorage.setItem(REVOKED_KEY, JSON.stringify(revoked));
  window.dispatchEvent(new CustomEvent('permissions-changed'));
};

export const setUserRoles = (roles) => {
  localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
};

export const getUserPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY)) || [];
  } catch {
    return [];
  }
};

export const getUserRevokedPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem(REVOKED_KEY)) || [];
  } catch {
    return [];
  }
};

export const getUserRoles = () => {
  try {
    return JSON.parse(localStorage.getItem(ROLES_KEY)) || [];
  } catch {
    return [];
  }
};

export const hasPermission = (permission) => {
  const permissions = getUserPermissions();
  const revoked = getUserRevokedPermissions();
  const roles = getUserRoles();

  // Super Admin has all permissions
  if (roles.includes('Super Admin')) return true;

  // Explicitly revoked — deny
  if (revoked.includes(permission)) return false;

  // Check specific permission
  return permissions.includes(permission);
};

export const hasAnyPermission = (permissions) => {
  return permissions.some(p => hasPermission(p));
};

export const hasAllPermissions = (permissions) => {
  return permissions.every(p => hasPermission(p));
};

export const clearPermissions = () => {
  localStorage.removeItem(PERMISSIONS_KEY);
  localStorage.removeItem(REVOKED_KEY);
  localStorage.removeItem(ROLES_KEY);
};

/**
 * Fetch current permissions from backend and refresh localStorage.
 * Call this after permission changes to keep frontend in sync.
 */
export const refreshPermissions = async () => {
  try {
    const res = await api.get('/profile');
    const data = res.data?.data;
    if (!data) return false;

    const permissions = data.permissions?.map((p) => p.name || p) || [];
    const revoked = data.revoked_permissions || [];
    const roles = data.roles?.map((r) => r.name) || [];

    setUserPermissions(permissions, revoked);
    setUserRoles(roles);
    return true;
  } catch {
    return false;
  }
};

// Module permission helpers
export const canView = (module) => hasPermission(`${module}-view`);
export const canCreate = (module) => hasPermission(`${module}-create`);
export const canEdit = (module) => hasPermission(`${module}-edit`);
export const canDelete = (module) => hasPermission(`${module}-delete`);
