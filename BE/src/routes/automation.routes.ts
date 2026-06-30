
import { Router, RequestHandler } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

import {
  getRules,
  toggleRule,
  createRule,
} from "../controllers/automation.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Middleware Chains                                                          */
/* -------------------------------------------------------------------------- */

const readAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.AUTOMATION_READ]),
];

const writeAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.AUTOMATION_CREATE]),
];

const toggleAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.AUTOMATION_TOGGLE]),
];

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /automation
 */
router.get("/", ...readAccess, getRules);

/**
 * POST /automation
 */
router.post("/", ...writeAccess, createRule);

/**
 * PATCH /automation/:id
 * Separate from writeAccess — toggling on/off is a lower-stakes action
 * than authoring a new rule, so team_lead can do this without create rights.
 */
router.patch("/:id", ...toggleAccess, toggleRule);

export default router;