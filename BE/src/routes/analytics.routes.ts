
import { Router } from "express";

import {
  dashboardAnalyticsController,
  responseTimeAnalyticsController,
  resolutionHistogramController,
  agentPerformanceListController,
  agentPerformanceByIdController,
} from "@/controllers/analytics.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

/*
|--------------------------------------------------------------------------
| Analytics Router
|--------------------------------------------------------------------------
| Mounted at: /analytics
|--------------------------------------------------------------------------
*/

const router = Router();

/*
|--------------------------------------------------------------------------
| Shared Middleware Stack
|--------------------------------------------------------------------------
*/

const analyticsMiddleware = [
  authenticate,
  requirePermissions([PERMISSIONS.ANALYTICS_READ]),
] as const;

/*
|--------------------------------------------------------------------------
| Dashboard Analytics
|--------------------------------------------------------------------------
*/

router.get(
  "/dashboard",
  ...analyticsMiddleware,
  dashboardAnalyticsController,
);

/*
|--------------------------------------------------------------------------
| Response Time Analytics — First Response Time / First Contact Resolution
|--------------------------------------------------------------------------
*/

router.get(
  "/response-times",
  ...analyticsMiddleware,
  responseTimeAnalyticsController,
);

/*
|--------------------------------------------------------------------------
| Resolution Time Histogram (TTR)
|--------------------------------------------------------------------------
*/

router.get(
  "/resolution-histogram",
  ...analyticsMiddleware,
  resolutionHistogramController,
);

/*
|--------------------------------------------------------------------------
| Agent Performance
|--------------------------------------------------------------------------
*/

router.get("/agents", ...analyticsMiddleware, agentPerformanceListController);
router.get("/agents/:id", ...analyticsMiddleware, agentPerformanceByIdController);

export default router;