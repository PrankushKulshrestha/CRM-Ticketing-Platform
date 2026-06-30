import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import { HTTP_STATUS } from "../constants/constants";
import type { Request, Response } from "express";

const router = Router();

const reportsMiddleware = [
  authenticate,
  requirePermissions([PERMISSIONS.ANALYTICS_READ]),
] as const;

/*
 * GET /reports/summary
 * Derives report data from the dashboard aggregation pipeline.
 */
router.get(
  "/summary",
  ...reportsMiddleware,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { getDashboardData } = await import("../services/dashboard.service");
    const { getAgentPerformanceList } = await import("../services/dashboard.service");

    const periodMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const periodParam = String(req.query.period ?? "30d");
    const days = periodMap[periodParam] ?? 30;

    const [dashboard, agents] = await Promise.all([
      getDashboardData({ days }),
      getAgentPerformanceList(),
    ]);

    const trends = (dashboard.charts.trends ?? []).map((p: any) => ({
      date: p._id,
      created: p.count ?? 0,
      resolved: p.resolvedCount ?? 0,
    }));

    const topAgent = agents.length > 0 ? agents[0].name : "—";
    const topCategory = dashboard.charts.categoryDistribution?.[0]?._id ?? "—";

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        summary: {
          totalTickets: dashboard.metrics.totalTickets ?? 0,
          resolvedToday: dashboard.metrics.resolvedToday ?? 0,
          avgResolutionTimeHours: dashboard.metrics.avgResolutionTime ?? 0,
          slaBreaches: dashboard.metrics.slaBreaches ?? 0,
          slaCompliancePercent: dashboard.metrics.slaCompliance ?? 0,
          topCategory,
          topAgent,
        },
        trends,
        period: periodParam,
        generatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
