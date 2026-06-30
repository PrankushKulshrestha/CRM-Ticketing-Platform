
/*
 * FIX (duplication reduction): PaginationMeta below was an exact duplicate
 * of common.types.ts's PaginationMeta. Now imported from the single
 * canonical source.
 */
import type { PaginationMeta } from "./common.types";

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

export interface TeamFilters {
  search?: string;
  page?: number;
  limit?: number;
}

/* PaginationMeta now imported from common.types.ts — see top of file. */

export interface TeamsResult {
  data: Team[];
  meta: PaginationMeta;
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  memberIds?: string[];
}

/**
 * Full replace of a team's member list — the client sends the complete
 * desired set of member user IDs, and the server diffs it against the
 * current set. Simpler and less error-prone over the wire than separate
 * add/remove single-member endpoints, and matches how the multi-select
 * UI naturally works (it always has the full intended list in hand).
 */
export interface UpdateTeamMembersPayload {
  memberIds: string[];
}