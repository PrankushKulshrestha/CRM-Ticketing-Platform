
import { useQuery } from "@tanstack/react-query";
import {
  getAnalyticsOverview,
  getResponseTimeAnalytics,
  getResolutionHistogramAnalytics,
  getAgentPerformanceList,
  getAgentPerformanceById,
  type ResolutionHistogramOptions,
} from "../api/analyticsApi";
import { normalizeAnalyticsDashboard } from "../utils/normalizeAnalytics";
import type { AnalyticsDashboardResponse } from "../types/analytics.types";
import type { DashboardPeriodOptions } from "@/features/dashboard/types/dashboard.types";
import { QUERY_KEYS } from "@/lib/queryKeys";

export function useAnalytics(options?: DashboardPeriodOptions) {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(options),
    queryFn: () => getAnalyticsOverview(options),
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,

    select: (res: AnalyticsDashboardResponse) => {
      return {
        success: res.success,
        message: res.message,
        timestamp: res.timestamp,
        data: normalizeAnalyticsDashboard(res.data),
      };
    },
  });
}

/**
 * Monthly First Response Time / First Contact Resolution time.
 * Defaults to a 12-month trailing window (matches the backend default).
 */
export function useResponseTimeAnalytics(months?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.responseTimes(months),
    queryFn: () => getResponseTimeAnalytics(months),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Time to Resolution histogram, hour-bucketed.
 */
export function useResolutionHistogram(options?: ResolutionHistogramOptions) {
  return useQuery({
    queryKey: QUERY_KEYS.resolutionHistogram(options),
    queryFn: () => getResolutionHistogramAnalytics(options),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
export function useAgentPerformance() {
  return useQuery({
    queryKey: ["analytics", "agents"],
    queryFn: getAgentPerformanceList,
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useAgentPerformanceById(id: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "agents", id],
    queryFn: () => getAgentPerformanceById(id!),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
