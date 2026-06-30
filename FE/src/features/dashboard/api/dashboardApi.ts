
// src/features/dashboard/api/dashboardApi.ts

import { apiClient } from "@/lib/api/apiClient";

import type {
  DashboardData,
  DashboardResponse,
  DashboardPeriodOptions,
} from "../types/dashboard.types";

const DASHBOARD_ENDPOINT =
  "/dashboard/metrics";

function isDashboardData(
  payload: unknown,
): payload is DashboardData {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "metrics" in payload &&
    "charts" in payload &&
    "activity" in payload
  );
}

function isWrappedResponse(
  payload: unknown,
): payload is DashboardResponse {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "success" in payload &&
    "data" in payload
  );
}

export const dashboardApi = {
  async getDashboard(
    options?: DashboardPeriodOptions,
  ): Promise<DashboardData> {
    try {
      const response =
        await apiClient.get<
          DashboardResponse | DashboardData
        >(DASHBOARD_ENDPOINT, {
          params: options,
        });

      const payload =
        response;

      /**
       * Wrapped backend response
       *
       * {
       *   success: true,
       *   data: DashboardData
       * }
       */
      if (
        isWrappedResponse(payload)
      ) {
        if (
          !isDashboardData(
            payload.data,
          )
        ) {
          throw new Error(
            "Invalid dashboard payload received from API.",
          );
        }

        return payload.data;
      }

      /**
       * Direct payload response
       *
       * {
       *   metrics,
       *   charts,
       *   activity
       * }
       */
      if (
        isDashboardData(payload)
      ) {
        return payload;
      }

      throw new Error(
        "Unexpected dashboard response format.",
      );
    } catch (error) {
      console.error(
        "[Dashboard API] Failed to load dashboard data",
        error,
      );

      throw error;
    }
  },
};

export const {
  getDashboard,
} = dashboardApi;

export default dashboardApi;