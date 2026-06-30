
/* -------------------------------------------------------------------------- */
/* CORE API RESPONSE                                                          */
/* -------------------------------------------------------------------------- */

export interface AnalyticsDashboardResponse {
  success?: boolean;
  message?: string;
  data: AnalyticsDashboard;
  timestamp?: string;
}

/* -------------------------------------------------------------------------- */
/* DASHBOARD SHAPE                                                           */
/* -------------------------------------------------------------------------- */

export interface AnalyticsDashboard {
  metrics: AnalyticsMetrics;
  charts: AnalyticsCharts;
  activity?: unknown[];
}

/* -------------------------------------------------------------------------- */
/* METRICS                                                                    */
/* -------------------------------------------------------------------------- */

export interface AnalyticsMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;

  avgResolutionTime: number;
  slaBreaches: number;
  slaCompliance: number;
  customerSatisfaction: number | null;
}

/* -------------------------------------------------------------------------- */
/* CHARTS                                                                     */
/* -------------------------------------------------------------------------- */

/** One row of the multi-level SLA health breakdown (level 1-5). */
export interface SLALevelHealthPoint {
  level: number;
  count: number;
  breached: number;
  healthy: number;
}

export interface AnalyticsCharts {
  trends?: unknown[];

  statusDistribution: DistributionItem[];
  categoryDistribution: DistributionItem[];
  subCategoryDistribution: DistributionItem[];

  agentPerformance: AgentPerformanceItem[];

  /** Per-level SLA health — individually visible alongside the combined slaCompliance score. */
  slaByLevel?: SLALevelHealthPoint[];
}

/* -------------------------------------------------------------------------- */

export interface DistributionItem {
  _id: string;
  value: number;
}

/* -------------------------------------------------------------------------- */

export interface TopCategory {
  name: string;
  count: number;
}

/* -------------------------------------------------------------------------- */

export interface AgentPerformanceItem {
  _id: string;
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  satisfaction?: number;
  avgResponseTime?: number;
}

/* -------------------------------------------------------------------------- */
/* RESPONSE TIME ANALYTICS (FRT / FCR)                                       */
/* -------------------------------------------------------------------------- */

export interface MonthlyResponsePoint {
  /** "YYYY-MM" */
  month: string;

  /** Average First Response Time, in minutes. null if no data for the month. */
  avgFirstResponseMinutes: number | null;
  firstResponseSampleSize: number;

  /** Average First Contact Resolution time, in minutes. null if no data. */
  avgFirstResolutionMinutes: number | null;
  firstResolutionSampleSize: number;

  /** % of resolved tickets that month resolved without ever being reopened. */
  fcrRate: number | null;
}

export interface ResponseTimeReport {
  months: MonthlyResponsePoint[];
}

export interface ResponseTimeApiResponse {
  success: boolean;
  message?: string;
  data: ResponseTimeReport;
  timestamp?: string;
}

/* -------------------------------------------------------------------------- */
/* RESOLUTION TIME HISTOGRAM (TTR)                                           */
/* -------------------------------------------------------------------------- */

export interface TtrBucket {
  minHours: number;
  maxHours: number | null;
  label: string;
  count: number;
}

export interface TtrHistogramReport {
  buckets: TtrBucket[];
  sampleSize: number;
  meanHours: number | null;
  medianHours: number | null;
}

export interface TtrHistogramApiResponse {
  success: boolean;
  message?: string;
  data: TtrHistogramReport;
  timestamp?: string;
}