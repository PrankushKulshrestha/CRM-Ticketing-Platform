
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { automationApi } from "../api/automationApi";
import type {
  AutomationFilters,
  CreateAutomationRulePayload,
} from "../types/automation.types";
import { QUERY_KEYS, QUERY_ROOTS } from "@/lib/queryKeys";

export function useAutomationRules(filters: AutomationFilters = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.automation(filters),
    queryFn: () => automationApi.getRules(filters),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function useToggleAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      automationApi.toggleRule(id, enabled),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.automation });
    },
  });
}

/*
 * FIX: added — POST /automation existed on the backend with no client-side
 * mutation hook to call it.
 */
export function useCreateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAutomationRulePayload) =>
      automationApi.createRule(payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_ROOTS.automation });
    },
  });
}