
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";
import logger from "../config/logger";

/* -------------------------------------------------------------------------- */
/* Permission Registry                                                        */
/* -------------------------------------------------------------------------- */

export const PERMISSIONS = {
  TICKETS_READ: "tickets:read",
  TICKETS_CREATE: "tickets:create",
  TICKETS_UPDATE: "tickets:update",
  TICKETS_DELETE: "tickets:delete",
  TICKETS_COMMENT: "tickets:comment",
  TICKETS_ASSIGN: "tickets:assign",
  TICKETS_CLOSE: "tickets:close",
  TICKETS_REOPEN: "tickets:reopen",
  TICKETS_SLA: "tickets:sla",

  ANALYTICS_READ: "analytics:read",
  DASHBOARD_READ: "dashboard:read",

  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",

  SETTINGS_MANAGE: "settings:manage",

  // FIX: added — teams.routes.ts / automation.routes.ts / customer.routes.ts
  // previously had no permission constants to gate against and fell back to
  // authenticate-only. Names follow the existing "<resource>:<verb>" convention.
  TEAMS_READ: "teams:read",
  TEAMS_CREATE: "teams:create",
  TEAMS_UPDATE: "teams:update",
  TEAMS_DELETE: "teams:delete",

  AUTOMATION_READ: "automation:read",
  AUTOMATION_CREATE: "automation:create",
  AUTOMATION_TOGGLE: "automation:toggle",
  AUTOMATION_DELETE: "automation:delete",

  CUSTOMERS_READ: "customers:read",
  CUSTOMERS_UPDATE: "customers:update",
  CUSTOMERS_EMAIL: "customers:email", // gates the future "send email" action
} as const;

export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/* -------------------------------------------------------------------------- */
/* Roles                                                                      */
/* -------------------------------------------------------------------------- */

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  TEAM_LEAD: "team_lead",
  AGENT: "agent",
  VIEWER: "viewer",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/* -------------------------------------------------------------------------- */
/* Role Permission Matrix (Immutable)                                         */
/* -------------------------------------------------------------------------- */

const rolePermissions: Record<Role, readonly Permission[]> = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.MANAGER]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_COMMENT,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.TICKETS_REOPEN,
    PERMISSIONS.TICKETS_SLA,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,

    // Managers run teams and automation rules, and can read/update/email customers.
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.TEAMS_CREATE,
    PERMISSIONS.TEAMS_UPDATE,
    PERMISSIONS.AUTOMATION_READ,
    PERMISSIONS.AUTOMATION_CREATE,
    PERMISSIONS.AUTOMATION_TOGGLE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_UPDATE,
    PERMISSIONS.CUSTOMERS_EMAIL,
  ],

  [ROLES.TEAM_LEAD]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_COMMENT,
    PERMISSIONS.TICKETS_ASSIGN,
    PERMISSIONS.TICKETS_CLOSE,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.DASHBOARD_READ,

    // Team leads can see their team and toggle existing automation, but
    // not create rules or teams outright — that's a manager+ action.
    PERMISSIONS.TEAMS_READ,
    PERMISSIONS.AUTOMATION_READ,
    PERMISSIONS.AUTOMATION_TOGGLE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_EMAIL,
  ],

  [ROLES.AGENT]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
    PERMISSIONS.TICKETS_COMMENT,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.ANALYTICS_READ,

    // Agents need customer context to work tickets, including emailing them.
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_EMAIL,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.TICKETS_READ,
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.CUSTOMERS_READ,
  ],
};

/* -------------------------------------------------------------------------- */
/* Optimized Lookups (O(1) instead of includes O(n))                          */
/* -------------------------------------------------------------------------- */

const rolePermissionSets = (() => {
  const map: Partial<Record<Role, ReadonlySet<Permission>>> = {};

  (Object.keys(rolePermissions) as Role[]).forEach((role) => {
    map[role] = new Set(rolePermissions[role]);
  });

  return map as Record<Role, ReadonlySet<Permission>>;
})();

const VALID_ROLES = new Set<Role>(Object.values(ROLES));

function getRolePermissions(role: Role): ReadonlySet<Permission> {
  return rolePermissionSets[role];
}

/* -------------------------------------------------------------------------- */
/* Response Helpers                                                           */
/* -------------------------------------------------------------------------- */

function respondForbidden(
  res: Response,
  message: string,
  errorCode: string,
  details?: unknown
): void {
  res.status(403).json({
    success: false,
    message,
    errorCode,
    ...(details ? { details } : {}),
  });
}

function respondInternalError(res: Response, error: unknown): void {
  logger.error("[RBAC_INTERNAL_ERROR]", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  res.status(500).json({
    success: false,
    message: "Authorization validation failed",
    errorCode: "RBAC_INTERNAL_ERROR",
  });
}

/* -------------------------------------------------------------------------- */
/* Middleware Factory                                                         */
/* -------------------------------------------------------------------------- */

export function requirePermissions(required: readonly Permission[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const user = req.user;

      if (!user) {
        return respondForbidden(
          res,
          "Authentication required",
          "AUTH_REQUIRED"
        );
      }

      const role = user.role as Role;

      if (!VALID_ROLES.has(role)) {
        return respondForbidden(
          res,
          "Invalid user role",
          "INVALID_ROLE"
        );
      }

      const allowed = getRolePermissions(role);

      const missingPermissions = required.filter(
        (p) => !allowed.has(p)
      );

      if (missingPermissions.length > 0) {
        logger.warn("[RBAC_DENIED]", {
          userId: user.userId,
          role,
          required,
          missingPermissions,
        });

        return respondForbidden(
          res,
          "Insufficient permissions",
          "PERMISSION_DENIED",
          {
            role,
            requiredPermissions: required,
            missingPermissions,
          }
        );
      }

      return next();
    } catch (error) {
      return respondInternalError(res, error);
    }
  };
}