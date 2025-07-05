import { User, UserProfile } from "../types/models";

// Permission constants - must match backend
export const PERMISSIONS = {
  // Client permissions
  READ_CLIENTS: "read_clients",
  CREATE_CLIENTS: "create_clients",
  UPDATE_CLIENTS: "update_clients",
  DELETE_CLIENTS: "delete_clients",

  // Animal permissions
  READ_ANIMALS: "read_animals",
  CREATE_ANIMALS: "create_animals",
  UPDATE_ANIMALS: "update_animals",
  DELETE_ANIMALS: "delete_animals",

  // Medical record permissions
  READ_MEDICAL_RECORDS: "read_medical_records",
  CREATE_MEDICAL_RECORDS: "create_medical_records",
  UPDATE_MEDICAL_RECORDS: "update_medical_records",
  DELETE_MEDICAL_RECORDS: "delete_medical_records",

  // Invoice permissions
  READ_INVOICES: "read_invoices",
  CREATE_INVOICES: "create_invoices",
  UPDATE_INVOICES: "update_invoices",
  DELETE_INVOICES: "delete_invoices",

  // Organization permissions
  READ_ORGANIZATIONS: "read_organizations",
  CREATE_ORGANIZATIONS: "create_organizations",
  UPDATE_ORGANIZATIONS: "update_organizations",
  DELETE_ORGANIZATIONS: "delete_organizations",

  // Organization Animals permissions
  READ_ORGANIZATION_ANIMALS: "read_organization_animals",
  CREATE_ORGANIZATION_ANIMALS: "create_organization_animals",
  UPDATE_ORGANIZATION_ANIMALS: "update_organization_animals",
  DELETE_ORGANIZATION_ANIMALS: "delete_organization_animals",

  // Blacklist permissions
  READ_BLACKLIST: "read_blacklist",
  CREATE_BLACKLIST: "create_blacklist",
  UPDATE_BLACKLIST: "update_blacklist",
  DELETE_BLACKLIST: "delete_blacklist",

  // Document permissions
  READ_DOCUMENTS: "read_documents",
  CREATE_DOCUMENTS: "create_documents",
  UPDATE_DOCUMENTS: "update_documents",
  DELETE_DOCUMENTS: "delete_documents",

  // User management permissions
  MANAGE_USERS: "manage_users",

  // System permissions
  VIEW_SYSTEM_SETTINGS: "view_system_settings",
  MANAGE_SYSTEM_SETTINGS: "manage_system_settings",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Auth token utilities
export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
};

export const isLoggedIn = (): boolean => {
  return !!getToken();
};

// User profile utilities
export const setUserProfile = (profile: UserProfile): void => {
  localStorage.setItem("user", JSON.stringify(profile.user));
  localStorage.setItem("permissions", JSON.stringify(profile.permissions));
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

export const getUserPermissions = (): string[] => {
  const permissionsStr = localStorage.getItem("permissions");
  return permissionsStr ? JSON.parse(permissionsStr) : [];
};

// Permission checking utilities
export const hasPermission = (permission: Permission): boolean => {
  const permissions = getUserPermissions();
  return permissions.includes(permission);
};

export const hasAnyPermission = (...permissions: Permission[]): boolean => {
  const userPermissions = getUserPermissions();
  return permissions.some((permission) => userPermissions.includes(permission));
};

export const hasAllPermissions = (...permissions: Permission[]): boolean => {
  const userPermissions = getUserPermissions();
  return permissions.every((permission) =>
    userPermissions.includes(permission)
  );
};

// Role checking utilities
export const hasRole = (role: User["role"]): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

export const isAdmin = (): boolean => {
  return hasRole("admin");
};

export const isStaff = (): boolean => {
  return hasRole("staff");
};

export const isUser = (): boolean => {
  return hasRole("user");
};

// Helper function to get user display name
export const getUserDisplayName = (): string => {
  const user = getCurrentUser();
  return user ? user.username : "User";
};

// Helper function to get user role display name
export const getRoleDisplayName = (role: User["role"]): string => {
  switch (role) {
    case "admin":
      return "Administrator";
    case "staff":
      return "Staff";
    case "user":
      return "User";
    default:
      return "User";
  }
};
