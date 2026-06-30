
// src/features/dashboard/types/dashboard.types.ts

/*
|--------------------------------------------------------------------------
| Period Selection (trend window)
|--------------------------------------------------------------------------
*/

export type DashboardPeriodPreset = "1d" | "7d" | "30d" | "full";

export interface DashboardPeriodOptions {
  /** One of the fixed presets. Ignored if `days` is also set. */
  period?: DashboardPeriodPreset;
  /** Custom number of trailing days. Takes precedence over `period`. */
  days?: number;
}

/*
|--------------------------------------------------------------------------
| Metrics
|--------------------------------------------------------------------------
*/

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  slaBreaches: number;

  /**
   * ALWAYS in HOURS (float)
   * Example: 14.41 = 14h 24m
   */
  avgResolutionTime: number;

  /*
   * Future analytics support
   */
  criticalTickets?: number;
  overdueTickets?: number;
  slaCompliance?: number;
  customerSatisfaction?: number | null;
}

/*
|--------------------------------------------------------------------------
| Charts
|--------------------------------------------------------------------------
*/

export interface TrendData {
  _id?: string;

  date?: string;

  /** Tickets created on this day (event count). */
  count?: number;

  total?: number;

  /*
   * FIX: added — these three power the additional lines on
   * TicketTrendChart. resolvedCount/closedCount are event counts
   * (tickets whose resolved_date/closed_date falls on this day).
   * openCount is a running balance — "open as of EOD this day" — not
   * an event count, see be/src/services/dashboard.service.ts for the
   * computation. Today's openCount is always live, recalculated on
   * every request from current ticket state.
   */
  resolvedCount?: number;
  closedCount?: number;
  openCount?: number;
}

export interface DistributionData {
  _id: string;

  value: number;
}

export interface AgentPerformance {
  _id: string;

  totalTickets: number;

  resolvedTickets: number;

  pendingTickets: number;
}

/** One row of the multi-level SLA health breakdown (level 1-5). */
export interface SLALevelHealth {
  level: number;
  count: number;
  breached: number;
  healthy: number;
}

export interface DashboardCharts {
  trends: TrendData[];

  categoryDistribution:
    DistributionData[];

  subCategoryDistribution:
    DistributionData[];

  statusDistribution:
    DistributionData[];

  agentPerformance:
    AgentPerformance[];

  /** Per-level SLA health — individually visible alongside the combined slaCompliance score. */
  slaByLevel?: SLALevelHealth[];
}

/*
|--------------------------------------------------------------------------
| Activity Feed
|--------------------------------------------------------------------------
*/

export interface DashboardActivity {
  ticketNumber?: string;

  title?: string;

  customer?: string;

  assignedTo?: string;

  category?: string;

  subCategory?: string;

  status?: string;

  updatedAt?: string;

  createdAt?: string;
}

/*
|--------------------------------------------------------------------------
| Dashboard Data
|--------------------------------------------------------------------------
*/

export interface DashboardData {
  metrics: DashboardMetrics;

  charts: DashboardCharts;

  activity: DashboardActivity[];
}

/*
|--------------------------------------------------------------------------
| Dashboard Response
|--------------------------------------------------------------------------
*/

export interface DashboardResponse {
  success: boolean;

  message?: string;

  data: DashboardData;

  timestamp?: string;
}