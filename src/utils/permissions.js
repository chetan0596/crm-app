// Permission helper utilities
const PERMISSIONS_KEY = 'user_permissions';
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

export const setUserPermissions = (permissions) => {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
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

export const getUserRoles = () => {
  try {
    return JSON.parse(localStorage.getItem(ROLES_KEY)) || [];
  } catch {
    return [];
  }
};

export const hasPermission = (permission) => {
  const permissions = getUserPermissions();
  const roles = getUserRoles();
  
  // Super Admin has all permissions
  if (roles.includes('Super Admin')) return true;
  
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
  localStorage.removeItem(ROLES_KEY);
};

// Module permission helpers
export const canView = (module) => hasPermission(`${module}-view`);
export const canCreate = (module) => hasPermission(`${module}-create`);
export const canEdit = (module) => hasPermission(`${module}-edit`);
export const canDelete = (module) => hasPermission(`${module}-delete`);
