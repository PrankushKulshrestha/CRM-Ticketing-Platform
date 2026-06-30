/*
 * FIX (duplication reduction): PaginationMeta below was an exact duplicate
 * of common.types.ts's PaginationMeta. Now imported from the single
 * canonical source.
 */
import type { PaginationMeta } from "./common.types";

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

export interface AutomationFilters {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/* PaginationMeta now imported from common.types.ts — see top of file. */

export interface AutomationResult {
  data: AutomationRule[];
  meta: PaginationMeta;
}

export interface CreateAutomationRulePayload {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, string>;
  actions: AutomationAction[];
  enabled?: boolean;
}