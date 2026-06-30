
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent";
  assignedTickets: number;
  resolvedTickets: number;
  avatarUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamsResponse {
  data: Team[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TeamFilters {
  search?: string;
  page?: number;
  limit?: number;
}

/*
 * FIX: added — teamApi.createTeam() needs a payload shape. Mirrors
 * TeamEntity in be/src/models/Team.ts: name required, description optional,
 * members is an array of User _ids (empty on creation, added afterward).
 */
export interface CreateTeamPayload {
  name: string;
  description?: string;
}

export interface UpdateTeamMembersPayload {
  memberIds: string[];
}