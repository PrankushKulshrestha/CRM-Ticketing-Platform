
import type { Request, Response } from "express";

import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";

import { getDashboardData } from "../services/dashboard.service";
import { parsePeriodOptions } from "../utils/period.utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  slaBreaches: number;
  avgResolutionTime: number;
  slaCompliance: number;
  customerSatisfaction: number | null;
}

interface DashboardResponse {
  metrics: DashboardMetrics;
  charts: unknown;
  activity: unknown[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toSafeArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? value : [];

const toSafeObject = <T extends object>(value: unknown, fallback: T): T =>
  value && typeof value === "object" ? (value as T) : fallback;

const formatAvg = (value: unknown): number => {
  const n = toNumber(value, 0);
  return Number(n.toFixed(2));
};

/* -------------------------------------------------------------------------- */
/* Mapper                                                                     */
/* -------------------------------------------------------------------------- */

const buildDashboardResponse = (data: unknown): DashboardResponse => {
  const safeData = toSafeObject<{ metrics?: any; charts?: unknown; activity?: unknown[] }>(
    data,
    {},
  );

  const metrics = safeData.metrics ?? {};

  return {
    metrics: {
      totalTickets: toNumber(metrics.totalTickets),
      openTickets: toNumber(metrics.openTickets),
      resolvedToday: toNumber(metrics.resolvedToday),
      slaBreaches: toNumber(metrics.slaBreaches),
      avgResolutionTime: formatAvg(metrics.avgResolutionTime),
      /*
       * FIX: previously dropped here, which is why SLAHealthPanel.tsx had
       * to invent its own client-side compliance formula off slaBreaches/
       * totalTickets (a different, less correct calculation than the
       * backend's real slaCompliance, which is denominated against closed
       * tickets only). Passing the real value through now.
       */
      slaCompliance: toNumber(metrics.slaCompliance, 100),
      customerSatisfaction:
        typeof metrics.customerSatisfaction === "number"
          ? metrics.customerSatisfaction
          : null,
    },

    charts: safeData.charts ?? {},
    activity: toSafeArray(safeData.activity),
  };
};

/* -------------------------------------------------------------------------- */
/* Controller                                                                 */
/* -------------------------------------------------------------------------- */

export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    logger.info("[DASHBOARD_METRICS_REQUEST]", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    const options = parsePeriodOptions(req.query);
    const dashboardData = await getDashboardData(options);

    const responseData = buildDashboardResponse(dashboardData);

    logger.info("[DASHBOARD_METRICS_SUCCESS]", {
      durationMs: Date.now() - startTime,
      totalTickets: responseData.metrics.totalTickets,
      openTickets: responseData.metrics.openTickets,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Dashboard metrics fetched successfully",
      data: responseData,
      timestamp: new Date().toISOString(),
    });
    return;
  },
);