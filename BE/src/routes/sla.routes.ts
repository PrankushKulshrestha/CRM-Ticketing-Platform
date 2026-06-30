
import { Router, type RequestHandler } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import { getSLAPolicy, updateSLAPolicy } from "../controllers/sla.controller";

const router = Router();

const readAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TICKETS_SLA]),
];

const writeAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TICKETS_SLA]),
];

/**
 * GET /sla/policy
 */
router.get("/policy", ...readAccess, getSLAPolicy);

/**
 * PATCH /sla/policy
 */
router.patch("/policy", ...writeAccess, updateSLAPolicy);

export default router;
