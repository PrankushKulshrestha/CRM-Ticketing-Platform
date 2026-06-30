
import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import logger from "../config/logger";
import { HTTP_STATUS } from "../constants/constants";

import { getDashboardData } from "../services/dashboard.service";
import { parsePeriodOptions } from "../utils/period.utils";
import { getMonthlyResponseTimes } from "../services/response-time.service";
import { getResolutionHistogram } from "../services/resolution-histogram.service";
import { ApiError } from "../utils/ApiError";

/*
|--------------------------------------------------------------------------
| Dashboard Analytics Controller (FIXED)
|--------------------------------------------------------------------------
*/

export const dashboardAnalyticsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const startTime = Date.now();

    logger.info("[DASHBOARD_ANALYTICS_FETCH]", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    const options = parsePeriodOptions(req.query);
    const dashboard = await getDashboardData(options);

    const metricsSource = dashboard?.metrics ?? {};

    const toNumber = (val: unknown, fallback = 0): number => {
      const n = typeof val === "number" ? val : Number(val);
      return Number.isFinite(n) ? n : fallback;
    };

    const totalTickets = toNumber(metricsSource.totalTickets);
    const openTickets = toNumber(metricsSource.openTickets);
    const resolvedToday = toNumber(metricsSource.resolvedToday);
    const slaBreaches = toNumber(metricsSource.slaBreaches);

    /*
     * FIX: this is the actual bug behind "dashboard shows SLA health,
     * analytics doesn't" — dashboard.service.ts's getDashboardData() always
     * computed slaCompliance, customerSatisfaction, and (now) slaByLevel
     * correctly, but this controller's responseData.metrics only ever
     * picked out totalTickets/openTickets/resolvedToday/slaBreaches/
     * avgResolutionTime, silently dropping the rest before they reached
     * the Analytics page. The Dashboard page must be reading metrics off
     * a different, more complete response shape — Analytics gets the
     * truncated one. Passing the full slice through now.
     */
    const slaCompliance = toNumber(metricsSource.slaCompliance, 100);
    const customerSatisfaction =
      typeof metricsSource.customerSatisfaction === "number"
        ? metricsSource.customerSatisfaction
        : null;

    // 🔥 FIX: strict numeric validation + consistent rounding
    const avgResolutionTime = (() => {
      const raw = toNumber(metricsSource.avgResolutionTime, 0);

      if (!Number.isFinite(raw)) return 0;

      return Number(raw.toFixed(2));
    })();

    const responseData = {
      metrics: {
        totalTickets,
        openTickets,
        resolvedToday,
        slaBreaches,
        avgResolutionTime,
        slaCompliance,
        customerSatisfaction,
      },
      charts: dashboard?.charts ?? {
        trends: [],
        categoryDistribution: [],
        subCategoryDistribution: [],
        statusDistribution: [],
        agentPerformance: [],
        slaByLevel: [],
      },
      activity: Array.isArray(dashboard?.activity) ? dashboard.activity : [],
    };

    const durationMs = Date.now() - startTime;

    logger.info("[DASHBOARD_ANALYTICS_SUCCESS]", {
      durationMs,
      totalTickets,
      openTickets,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Dashboard analytics fetched successfully",
      data: responseData,
      timestamp: new Date().toISOString(),
      meta: {
        durationMs,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Response Time Analytics (FRT / FCR)
|--------------------------------------------------------------------------
| GET /analytics/response-times?months=12
*/

export const responseTimeAnalyticsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const rawMonths = req.query.months;
    const months =
      typeof rawMonths === "string" && Number.isFinite(Number(rawMonths))
        ? Number(rawMonths)
        : undefined;

    const report = await getMonthlyResponseTimes(months);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Response time analytics fetched successfully",
      data: report,
      timestamp: new Date().toISOString(),
    });
  },
);

/*
|--------------------------------------------------------------------------
| Resolution Time Histogram (TTR)
|--------------------------------------------------------------------------
| GET /analytics/resolution-histogram?from=ISO&to=ISO
*/

export const resolutionHistogramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const parseDate = (value: unknown): Date | undefined => {
      if (typeof value !== "string" || !value.trim()) return undefined;
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        throw new ApiError(400, `Invalid date: ${value}`);
      }
      return d;
    };

    const from = parseDate(req.query.from);
    const to = parseDate(req.query.to);

    const report = await getResolutionHistogram({ from, to });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Resolution histogram fetched successfully",
      data: report,
      timestamp: new Date().toISOString(),
    });
  },
);
/* -------------------------------------------------------------------------- */
/* Agent Performance — GET /analytics/agents                                  */
/* -------------------------------------------------------------------------- */

export const agentPerformanceListController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const { getAgentPerformanceList } = await import("@/services/dashboard.service.js");
    const data = await getAgentPerformanceList();
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Agent performance fetched successfully",
      data,
      timestamp: new Date().toISOString(),
    });
  },
);

/* Agent Performance by ID — GET /analytics/agents/:id */

export const agentPerformanceByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { getAgentPerformanceById } = await import("@/services/dashboard.service.js");
    const data = await getAgentPerformanceById(id);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Agent performance fetched successfully",
      data,
      timestamp: new Date().toISOString(),
    });
  },
);
