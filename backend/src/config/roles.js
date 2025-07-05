// Role definitions and permissions
export const USER_ROLES = {
  ADMIN: "admin",
  STAFF: "staff",
  USER: "user",
};

// Permission definitions
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
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    // All permissions for admin
    ...Object.values(PERMISSIONS),
  ],

  [USER_ROLES.STAFF]: [
    // Can do everything except manage users and system settings
    // Read-only access to organizations and organization animals
    PERMISSIONS.READ_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.UPDATE_CLIENTS,
    PERMISSIONS.DELETE_CLIENTS,
    PERMISSIONS.READ_ANIMALS,
    PERMISSIONS.CREATE_ANIMALS,
    PERMISSIONS.UPDATE_ANIMALS,
    PERMISSIONS.DELETE_ANIMALS,
    PERMISSIONS.READ_MEDICAL_RECORDS,
    PERMISSIONS.CREATE_MEDICAL_RECORDS,
    PERMISSIONS.UPDATE_MEDICAL_RECORDS,
    PERMISSIONS.DELETE_MEDICAL_RECORDS,
    PERMISSIONS.READ_INVOICES,
    PERMISSIONS.CREATE_INVOICES,
    PERMISSIONS.UPDATE_INVOICES,
    PERMISSIONS.DELETE_INVOICES,
    PERMISSIONS.READ_ORGANIZATIONS, // Read-only for organizations
    PERMISSIONS.READ_ORGANIZATION_ANIMALS, // Read-only for organization animals
    PERMISSIONS.READ_BLACKLIST,
    PERMISSIONS.CREATE_BLACKLIST,
    PERMISSIONS.UPDATE_BLACKLIST,
    PERMISSIONS.DELETE_BLACKLIST,
    PERMISSIONS.READ_DOCUMENTS,
    PERMISSIONS.CREATE_DOCUMENTS,
    PERMISSIONS.UPDATE_DOCUMENTS,
    PERMISSIONS.DELETE_DOCUMENTS,
  ],

  [USER_ROLES.USER]: [
    // Read-only access to everything
    PERMISSIONS.READ_CLIENTS,
    PERMISSIONS.READ_ANIMALS,
    PERMISSIONS.READ_MEDICAL_RECORDS,
    PERMISSIONS.READ_INVOICES,
    PERMISSIONS.READ_ORGANIZATIONS,
    PERMISSIONS.READ_ORGANIZATION_ANIMALS,
    PERMISSIONS.READ_BLACKLIST,
    PERMISSIONS.READ_DOCUMENTS,
  ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Helper function to get all permissions for a role
export const getRolePermissions = (userRole) => {
  return ROLE_PERMISSIONS[userRole] || [];
};
