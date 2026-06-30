
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

import { ROLE_PERMISSIONS } from "@/config/permissions";
import { useAuth } from "./AuthProvider";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type Permission = string;

export interface PermissionsContextValue {
  can: (permission: Permission) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
  canAll: (...permissions: Permission[]) => boolean;
  permissionSet: ReadonlySet<Permission>;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

PermissionsContext.displayName = "PermissionsContext";

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({
  children,
}: PermissionProviderProps): React.ReactElement {
  const { user } = useAuth();

  /* ---------------------------------------------------------------------- */
  /* Stable permission set (optimized + referentially stable)              */
  /* ---------------------------------------------------------------------- */

  const permissionSet = useMemo<ReadonlySet<Permission>>(() => {
    const role = user?.role;

    if (!role) return new Set<Permission>();

    const permissions =
      ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];

    if (!Array.isArray(permissions)) {
      return new Set<Permission>();
    }

    return new Set<Permission>(permissions);
  }, [user?.role]);

  /* ---------------------------------------------------------------------- */
  /* Permission checks (optimized lookups)                                  */
  /* ---------------------------------------------------------------------- */

  const can = useCallback(
    (permission: Permission): boolean => {
      return permissionSet.has(permission);
    },
    [permissionSet],
  );

  const canAny = useCallback(
    (...permissions: Permission[]): boolean => {
      if (permissions.length === 0) return false;

      for (const p of permissions) {
        if (permissionSet.has(p)) return true;
      }

      return false;
    },
    [permissionSet],
  );

  const canAll = useCallback(
    (...permissions: Permission[]): boolean => {
      if (permissions.length === 0) return false;

      for (const p of permissions) {
        if (!permissionSet.has(p)) return false;
      }

      return true;
    },
    [permissionSet],
  );

  /* ---------------------------------------------------------------------- */
  /* Context value (fully stable)                                           */
  /* ---------------------------------------------------------------------- */

  const value = useMemo<PermissionsContextValue>(
    () => ({
      can,
      canAny,
      canAll,
      permissionSet,
    }),
    [can, canAny, canAll, permissionSet],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);

  if (!ctx) {
    throw new Error(
      "[usePermissions] must be used inside <PermissionProvider>",
    );
  }

  return ctx;
}