
import { apiClient } from "@/lib/api/apiClient";
import type {
  AnalyticsDashboardResponse,
  ResponseTimeReport,
  ResponseTimeApiResponse,
  TtrHistogramReport,
  TtrHistogramApiResponse,
} from "../types/analytics.types";
import type { DashboardPeriodOptions } from "@/features/dashboard/types/dashboard.types";

const DASHBOARD_ENDPOINT = "/analytics/dashboard";
const RESPONSE_TIMES_ENDPOINT = "/analytics/response-times";
const RESOLUTION_HISTOGRAM_ENDPOINT = "/analytics/resolution-histogram";

export async function getAnalyticsOverview(
  options?: DashboardPeriodOptions,
): Promise<AnalyticsDashboardResponse> {
  const res = await apiClient.get<AnalyticsDashboardResponse>(
    DASHBOARD_ENDPOINT,
    { params: options },
  );

  const data = res;

  if (!data?.data?.metrics || !data?.data?.charts) {
    throw new Error("Invalid analytics response structure");
  }

  return data;
}

export async function getResponseTimeAnalytics(
  months?: number,
): Promise<ResponseTimeReport> {
  const res = await apiClient.get<ResponseTimeApiResponse>(
    RESPONSE_TIMES_ENDPOINT,
    { params: months ? { months } : undefined },
  );

  if (!res?.data?.months) {
    throw new Error("Invalid response-time analytics response structure");
  }

  return res.data;
}

/* -------------------------------------------------------------------------- */
/* Agent Performance                                                          */
/* -------------------------------------------------------------------------- */

export interface AgentPerformanceSummary {
  agentId: string;
  name: string;
  email: string;
  role: string;
  totalTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  openTickets: number;
  reopenedCount: number;
  avgResolutionHours: number | null;
  avgResponseMinutes: number | null;
  slaBreaches: number;
  csatAvg: number | null;
  fcrRate: number | null;
}

export interface AgentPerformanceByIdResponse extends AgentPerformanceSummary {
  recentTickets: unknown[];
}

export async function getAgentPerformanceList(): Promise<AgentPerformanceSummary[]> {
  const res = await apiClient.get<{ success: boolean; data: AgentPerformanceSummary[] }>(
    "/analytics/agents",
  );
  return res.data;
}

export async function getAgentPerformanceById(
  id: string,
): Promise<AgentPerformanceByIdResponse> {
  const res = await apiClient.get<{ success: boolean; data: AgentPerformanceByIdResponse }>(
    `/analytics/agents/${id}`,
  );
  return res.data;
}

export interface ResolutionHistogramOptions {
  from?: string;
  to?: string;
}

export async function getResolutionHistogramAnalytics(
  options?: ResolutionHistogramOptions,
): Promise<TtrHistogramReport> {
  const res = await apiClient.get<TtrHistogramApiResponse>(
    RESOLUTION_HISTOGRAM_ENDPOINT,
    { params: options },
  );

  if (!res?.data?.buckets) {
    throw new Error("Invalid resolution-histogram response structure");
  }

  return res.data;
}