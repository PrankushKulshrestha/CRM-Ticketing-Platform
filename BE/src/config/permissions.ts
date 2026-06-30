
/*
|--------------------------------------------------------------------------
| RBAC: Roles & Permissions
|--------------------------------------------------------------------------
| Strongly typed, immutable, production-safe authorization layer
|--------------------------------------------------------------------------
*/

/* -------------------------------------------------------------------------- */
/* Roles                                                                     */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];

/* -------------------------------------------------------------------------- */
/* Permission Keys                                                          */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS = {
  // Tickets
  TICKETS_READ: "tickets:read",
  TICKETS_CREATE: "tickets:create",
  TICKETS_UPDATE: "tickets:update",
  TICKETS_DELETE: "tickets:delete",

  // Customers
  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_CREATE: "customers:create",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_DELETE: "customers:delete",

  // Teams
  TEAMS_READ: "teams:read",
  TEAMS_MANAGE: "teams:manage",

  // Analytics
  ANALYTICS_READ: "analytics:read",

  // Reports
  REPORTS_READ: "reports:read",

  // Settings
  SETTINGS_MANAGE: "settings:manage",

  // Automation
  AUTOMATION_MANAGE: "automation:manage",
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* -------------------------------------------------------------------------- */
/* Role → Permission Matrix                                                 */
/* -------------------------------------------------------------------------- */

export const ROLE_PERMISSIONS: Readonly<
  Record<UserRole, readonly Permission[]>
> = Object.freeze({
  [USER_ROLES.ADMIN]: Object.freeze([
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_DELETE,

    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_DELETE,

    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_MANAGE,

    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,

    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUTOMATION_MANAGE,
  ]),

  [USER_ROLES.MANAGER]: Object.freeze([
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,

    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_CREATE,
    PERMISSIONS.CUSTOMERS_UPDATE,

    PERMISSIONS.TEAMS_READ,

    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,
  ]),

  [USER_ROLES.AGENT]: Object.freeze([
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,

    PERMISSIONS.CUSTOMERS_READ,
  ]),
});

/* -------------------------------------------------------------------------- */
/* Permission Checker                                                       */
/* -------------------------------------------------------------------------- */

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  const permissionsForRole = ROLE_PERMISSIONS[role];

  if (!permissionsForRole) return false;

  return permissionsForRole.includes(permission);
}

/* -------------------------------------------------------------------------- */
/* Optional: Reverse lookup helpers (very useful in UI)                     */
/* -------------------------------------------------------------------------- */

export function getPermissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function isAdmin(role: UserRole): boolean {
  return role === USER_ROLES.ADMIN;
}

/* -------------------------------------------------------------------------- */