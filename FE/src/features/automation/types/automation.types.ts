
import type { ApiListResponse } from "@/types";

export type AutomationTrigger =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_assigned"
  | "sla_breached"
  | "status_changed";

export type AutomationActionType =
  | "assign_agent"
  | "assign_team"
  | "set_priority"
  | "send_notification"
  | "change_status"
  | "add_tag";

export interface AutomationAction {
  type: AutomationActionType;
  value: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions: Record<string, string>;
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Convenience alias — use ApiListResponse<AutomationRule> for the full shape */
export type AutomationResponse = ApiListResponse<AutomationRule>;

export interface AutomationFilters {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/*
 * FIX: added — automationApi.createRule() needs a payload shape. Mirrors
 * AutomationRuleEntity in be/src/models/AutomationRule.ts. enabled defaults
 * to true server-side so it's optional here.
 */
export interface CreateAutomationRulePayload {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, string>;
  actions: AutomationAction[];
  enabled?: boolean;
}