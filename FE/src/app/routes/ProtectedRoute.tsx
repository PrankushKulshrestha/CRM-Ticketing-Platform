
import type { ReactElement } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/app/providers/AuthProvider";
import routes from "@/config/routes";
import { getRefreshToken } from "@/features/auth/utils/authStorage";

/* -------------------------------------------------------------------------- */
/* Loading UI                                                                 */
/* -------------------------------------------------------------------------- */

function HydrationFallback(): ReactElement {
  return (
    <div
      role="status"
      aria-label="Restoring authentication session"
      className="flex min-h-screen items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />

        <div className="text-center">
          <p className="text-sm font-medium">CRM Helpdesk</p>
          <p className="text-xs text-muted-foreground">
            Restoring session...
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Protected Route                                                            */
/* -------------------------------------------------------------------------- */

export default function ProtectedRoute(): ReactElement {
  const { isHydrating, isAuthenticated } = useAuth();
  const location = useLocation();

  const from = location.pathname + location.search;

  /* ---------------------------------------------------------------------- */
  /* 1. Auth hydration gate                                                */
  /* ---------------------------------------------------------------------- */

  if (isHydrating) {
    return <HydrationFallback />;
  }

  /* ---------------------------------------------------------------------- */
  /* 2. Auth gate (strict + deterministic)                                  */
  /* ---------------------------------------------------------------------- */

  // Bug fix: don't redirect if a refresh token still exists in storage.
  // This prevents a flicker-logout when the access token expired between
  // sessions and AuthProvider is mid-refresh when ProtectedRoute first renders.
  const hasRefreshToken = Boolean(getRefreshToken());

  if (!isAuthenticated && !hasRefreshToken) {
    return (
      <Navigate
        to={routes.login}
        replace
        state={{ from }}
      />
    );
  }

  // Has a refresh token but user not yet set — still hydrating, show spinner
  if (!isAuthenticated && hasRefreshToken) {
    return <HydrationFallback />;
  }

  /* ---------------------------------------------------------------------- */
  /* 3. Protected app shell                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}