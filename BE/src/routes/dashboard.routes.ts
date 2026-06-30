
import { Router } from "express";

import { getDashboardMetrics } from "../controllers/dashboard.controller";
import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

/*
|--------------------------------------------------------------------------
| Dashboard Router
|--------------------------------------------------------------------------
| Mounted at: /dashboard
|--------------------------------------------------------------------------
*/

const router = Router();

/*
|--------------------------------------------------------------------------
| Shared Middleware Stack
|--------------------------------------------------------------------------
*/

const dashboardMiddleware = [
  authenticate,
  requirePermissions([PERMISSIONS.DASHBOARD_READ]),
] as const;

/*
|--------------------------------------------------------------------------
| Metrics Endpoint
|--------------------------------------------------------------------------
*/

router.get(
  "/metrics",
  ...dashboardMiddleware,
  getDashboardMetrics,
);

/*
|--------------------------------------------------------------------------
| Future Dashboard Modules
|--------------------------------------------------------------------------
*/

// router.get("/kpis", ...dashboardMiddleware, kpiController);
// router.get("/sla", ...dashboardMiddleware, slaController);
// router.get("/agents", ...dashboardMiddleware, agentController);
// router.get("/trends", ...dashboardMiddleware, trendsController);
// router.get("/realtime", ...dashboardMiddleware, realtimeController);

export default router;