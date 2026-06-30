
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
      success: res.data.success ?? true,
      data: res.data.data,
      meta: res.data.meta,
    };
  },

  async toggleRule(id: string, enabled: boolean): Promise<AutomationRule> {
    const res = await apiClient.patch<{
      success: boolean;
      data: AutomationRule;
    }>(`/automation/${id}`, { enabled });

    return res.data.data;
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

    return res.data.data;
  },
};