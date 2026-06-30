
// src/features/dashboard/hooks/useDashboard.ts

import {
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

import { getDashboard } from "../api/dashboardApi";
import { QUERY_KEYS } from "@/lib/queryKeys";

import type {
  DashboardData,
  DashboardPeriodOptions,
} from "../types/dashboard.types";

export function useDashboard(
  options?: DashboardPeriodOptions,
): UseQueryResult<
  DashboardData,
  Error
> {
  return useQuery<
    DashboardData,
    Error
  >({
    queryKey:
      QUERY_KEYS.dashboard(options),

    queryFn:
      () => getDashboard(options),

    staleTime:
      60 * 1000,

    gcTime:
      5 * 60 * 1000,

    refetchInterval:
      60 * 1000,

    refetchIntervalInBackground:
      true,

    refetchOnWindowFocus:
      false,

    retry: (
      failureCount,
      _error,
    ) => {
      return (
        failureCount < 2
      );
    },

    retryDelay: (
      attempt,
    ) =>
      Math.min(
        1000 *
          2 ** attempt,
        10_000,
      ),

    placeholderData: (
      previousData,
    ) => previousData,
  });
}

export default useDashboard;