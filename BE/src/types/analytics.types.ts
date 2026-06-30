
/*
|--------------------------------------------------------------------------
| Domain Primitives
|--------------------------------------------------------------------------
| FIX (duplication + correctness): TicketPriority/TicketStatus below used
| to be locally redefined and DIVERGENT from the real schema —
| TicketStatus was "open" | "inProgress" | "resolved" (missing pending and
| closed entirely, and camelCase inProgress matched nothing in the DB).
| Now imported from constants.ts, the single source of truth also used by
| Ticket.ts, ticket.service.ts, and dashboard.service.ts.
|--------------------------------------------------------------------------
*/

import type {
  TicketPriority as ConstTicketPriority,
  TicketStatus,
} from "../constants/constants";

export type TicketPriority = ConstTicketPriority;
export type { TicketStatus };

/*
|--------------------------------------------------------------------------
| Tickets By Priority
|--------------------------------------------------------------------------
*/

export type TicketsByPriority = Record<TicketPriority, number>;

/*
|--------------------------------------------------------------------------
| Tickets By Status (API Layer)
|--------------------------------------------------------------------------
| Normalized API response format (DB-safe mapping applied in service layer)
|--------------------------------------------------------------------------
*/

export type TicketsByStatus = Record<TicketStatus, number>;

/*
|--------------------------------------------------------------------------
| Dashboard Analytics Response
|--------------------------------------------------------------------------
*/

export interface SLALevelHealthPoint {
  level: number;
  count: number;
  breached: number;
  healthy: number;
}

export interface DashboardAnalyticsResponse {
  resolvedToday: number;

  avgResolutionTime: string;

  breachedSla: number;

  slaCompliance: number;

  /** Per-level (1-5) SLA health breakdown, individually visible alongside the combined slaCompliance score. */
  slaByLevel: SLALevelHealthPoint[];

  customerSatisfaction: number | null;

  ticketsByPriority: TicketsByPriority;

  ticketsByStatus: TicketsByStatus;
}

/*
|--------------------------------------------------------------------------
| Agent Performance Analytics
|--------------------------------------------------------------------------
*/

export interface AgentPerformance {
  id: string;
  name: string;

  resolvedTickets: number;
  pendingTickets: number;
  totalTickets: number;

  avgResponseTime: string;
  satisfaction: number;
}

/*
|--------------------------------------------------------------------------
| Top Category Analytics
|--------------------------------------------------------------------------
*/

export interface TopCategory {
  name: string;
  count: number;
}

/*
|--------------------------------------------------------------------------
| Raw Aggregation Types (MongoDB Layer)
|--------------------------------------------------------------------------
*/

export interface TicketsByStatusRaw {
  _id: TicketStatus;
  count: number;
}

export interface TicketsByPriorityRaw {
  /* FIX: color_code is numeric (1-4) at the DB layer, not a string. */
  _id: TicketPriority extends string ? never : number;
  count: number;
}

/*
|--------------------------------------------------------------------------
| Dashboard Aggregation Result (Internal DB Shape)
|--------------------------------------------------------------------------
*/

export interface DashboardAggregationResult {
  totalTickets: { count: number }[];
  resolvedToday: { count: number }[];
  breachedSla: { count: number }[];
  avgResolution: { avg: number }[];
  ticketsByPriority: TicketsByPriorityRaw[];
  ticketsByStatus: TicketsByStatusRaw[];
  customerSatisfaction: { avg: number }[];
}
