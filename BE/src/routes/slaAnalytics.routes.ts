import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import {
  violations,
  adherenceVsViolated,
  violationsByAgent,
  violationsBySLA,
  complianceByTeam,
  violationsByStatus,
} from "../controllers/slaAnalytics.controller";

const router = Router();
const auth = [authenticate, requirePermissions([PERMISSIONS.ANALYTICS_READ])] as const;

router.get("/violations", ...auth, violations);
router.get("/adherence", ...auth, adherenceVsViolated);
router.get("/violations/by-agent", ...auth, violationsByAgent);
router.get("/violations/by-sla", ...auth, violationsBySLA);
router.get("/compliance/by-team", ...auth, complianceByTeam);
router.get("/violations/by-status", ...auth, violationsByStatus);

export default router;
