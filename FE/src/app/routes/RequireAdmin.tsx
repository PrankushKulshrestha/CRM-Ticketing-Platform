// src/app/routes/RequireAdmin.tsx
//
// Role-gated route wrapper. Renders its children only for admin users;
// everyone else is redirected away (no flash of admin-only UI). Used to
// protect Agent Settings (Create User + basic agent config) at the
// routing layer, in addition to the nav-level hiding in Sidebar.tsx and
// the server-side RBAC enforced by every /users and /system-settings
// endpoint — hiding a link is not a security boundary on its own.

import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import routes from "@/config/routes";

export default function RequireAdmin(): ReactElement {
  const { user } = useAuth();

  if (user?.role !== "admin") {
    return <Navigate to={routes.dashboard} replace />;
  }

  return <Outlet />;
}
