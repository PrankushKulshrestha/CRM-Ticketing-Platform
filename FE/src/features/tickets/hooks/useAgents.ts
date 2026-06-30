
// src/features/tickets/hooks/useAgents.ts
//
// Calls GET /users/assignable, a lightweight endpoint gated by
// TICKETS_READ (not USERS_READ) so every ticket-handling role — agent,
// team_lead, manager, admin — can populate the assignee dropdown, not
// just admins/managers. Returns every user with a ticket-handling role
// (everything except "viewer", which is read-only).

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/apiClient";

export interface Agent {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

async function fetchAssignableAgents(): Promise<Agent[]> {
  const res = await apiClient.get<ApiResponse<Agent[]>>("/users/assignable");
  return res.data.data;
}

export function useAgents() {
  return useQuery({
    queryKey: ["users", "assignable"],
    queryFn: fetchAssignableAgents,
    staleTime: 5 * 60 * 1000,
  });
}
