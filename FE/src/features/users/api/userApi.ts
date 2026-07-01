// src/features/users/api/userApi.ts
//
// Admin-only user management. Talks to POST /users (RBAC-gated server-side
// by requirePermissions([USERS_CREATE]), which only the "admin" role has —
// see BE/src/middlewares/rbac.middleware.ts). This file does not itself
// enforce authorization; the server is the source of truth. The FE guards
// (admin-only "Agent Settings" section in SettingsPage.tsx, Sidebar role
// filter) only control visibility.

import { apiClient } from "@/lib/api/apiClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateUserPayload, CreateUserResponse } from "../types/user.types";

export const userApi = {
  createUser: (payload: CreateUserPayload) =>
    apiClient.post<CreateUserResponse>("/users", payload),
};

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
