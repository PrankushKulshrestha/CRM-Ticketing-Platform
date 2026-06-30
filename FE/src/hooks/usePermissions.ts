
import { useCallback, useMemo } from "react";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  type Permission,
  type UserRole,
} from "@/config/permissions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionsReturn {
  /** Returns true if the role has the given permission. */
  can: (permission: Permission) => boolean;
  /** All permissions granted to this role. */
  permissions: readonly Permission[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns a helper to check whether a role has a given permission.
 * Draws the role→permission matrix from @/config/permissions (ROLE_PERMISSIONS).
 *
 * @example
 *   const { can } = usePermissions(user.role);
 *   if (can(PERMISSIONS.TICKETS_CREATE)) { ... }
 */
export function usePermissions(role: UserRole | string): PermissionsReturn {
  const allowed = useMemo<readonly Permission[]>(
    () => ROLE_PERMISSIONS[role as UserRole] ?? [],
    [role],
  );

  const can = useCallback(
    (permission: Permission) => (allowed as readonly string[]).includes(permission),
    [allowed],
  );

  return { can, permissions: allowed };
}

// Re-export PERMISSIONS so callers can do:
//   import { usePermissions, PERMISSIONS } from "@/hooks"
export { PERMISSIONS };
export type { Permission, UserRole };