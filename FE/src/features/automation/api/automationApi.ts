
import { apiClient } from "@/lib/api/apiClient";
import { buildParams } from "@/lib/utils";
import type { ApiListResponse } from "@/types";
import type {
  AutomationRule,
  AutomationFilters,
  CreateAutomationRulePayload,
} from "../types/automation.types";

export const automationApi = {
  async getRules(
    filters: AutomationFilters = {},
  ): Promise<ApiListResponse<AutomationRule>> {
    const res = await apiClient.get<ApiListResponse<AutomationRule>>(
      `/automation?${buildParams(filters)}`,
    );
    return {
      success: res.success ?? true,
      data: res.data,
      meta: res.meta,
    };
  },

  async toggleRule(id: string, enabled: boolean): Promise<AutomationRule> {
    const res = await apiClient.patch<{
      success: boolean;
      data: AutomationRule;
    }>(`/automation/${id}`, { enabled });

    return res.data;
  },

  /*
   * FIX: automation.routes.ts already exposes POST /automation but no
   * client method called it — added to match createTeam's pattern.
   */
  async createRule(
    payload: CreateAutomationRulePayload,
  ): Promise<AutomationRule> {
    const res = await apiClient.post<{
      success: boolean;
      data: AutomationRule;
    }>("/automation", payload);

    return res.data;
  },
};