
import { apiClient } from "@/lib/api/apiClient";
import { buildParams } from "@/lib/utils";
import type { ApiListResponse } from "@/types";
import type {
  Team,
  TeamFilters,
  CreateTeamPayload,
  UpdateTeamMembersPayload,
} from "../types/team.types";

/* -------------------------------------------------------------------------- */
/*
 * FIX: previously returned a hand-rolled { data, meta } shape and built its
 * own URLSearchParams, diverging from automationApi.ts / customerApi.ts.
 * Aligned to the same ApiListResponse<T> + buildParams pattern used
 * everywhere else, and added createTeam — team.routes.ts already exposes
 * POST /teams but no client method called it.
 */
/* -------------------------------------------------------------------------- */

export const teamApi = {
  async getTeams(filters: TeamFilters = {}): Promise<ApiListResponse<Team>> {
    const res = await apiClient.get<ApiListResponse<Team>>(
      `/teams?${buildParams(filters)}`,
    );

    return {
      success: res.success ?? true,
      data: res.data,
      meta: res.meta,
    };
  },

  async getTeamById(id: string): Promise<Team> {
    const res = await apiClient.get<{ success: boolean; data: Team }>(
      `/teams/${id}`,
    );
    return res.data;
  },

  async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const res = await apiClient.post<{ success: boolean; data: Team }>(
      "/teams",
      payload,
    );
    return res.data;
  },

  async updateTeamMembers(
    id: string,
    payload: UpdateTeamMembersPayload,
  ): Promise<Team> {
    const res = await apiClient.patch<{ success: boolean; data: Team }>(
      `/teams/${id}/members`,
      payload,
    );
    return res.data;
  },
};