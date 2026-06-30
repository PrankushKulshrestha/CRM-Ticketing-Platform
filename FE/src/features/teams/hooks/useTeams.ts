
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "../api/teamApi";
import type {
  TeamFilters,
  CreateTeamPayload,
  UpdateTeamMembersPayload,
} from "../types/team.types";
import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys";

/*
 * FIX: queryKey was a raw ["teams", filters] array, inconsistent with
 * useAutomation.ts / useCustomers.ts which both go through QUERY_KEYS.
 * Aligned so cache invalidation after createTeam actually hits this query.
 */
export function useTeams(filters: TeamFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.teams(filters),
    queryFn: () => teamApi.getTeams(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.team(id),
    queryFn: () => teamApi.getTeamById(id),
    enabled: Boolean(id),
  });
}

/*
 * FIX: added — POST /teams existed on the backend with no client-side
 * mutation hook to call it. Mirrors useToggleAutomationRule's pattern.
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTeamPayload) => teamApi.createTeam(payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.teams });
    },
  });
}

/**
 * Full replace of a team's member list. Backend was MongoDB-only for this
 * before — no endpoint existed — so this is the first client-side hook
 * for it.
 */
export function useUpdateTeamMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTeamMembersPayload;
    }) => teamApi.updateTeamMembers(id, payload),

    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.team(id) });
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.teams });
    },
  });
}