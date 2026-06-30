
import { Router, RequestHandler } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeamMembers,
} from "../controllers/team.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Middleware Chains                                                          */
/* -------------------------------------------------------------------------- */

const readAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TEAMS_READ]),
];

const writeAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TEAMS_CREATE]),
];

const updateAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TEAMS_UPDATE]),
];

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /teams
 */
router.get("/", ...readAccess, getTeams);

/**
 * GET /teams/:id
 */
router.get("/:id", ...readAccess, getTeamById);

/**
 * POST /teams
 */
router.post("/", ...writeAccess, createTeam);

/**
 * PATCH /teams/:id/members
 */
router.patch("/:id/members", ...updateAccess, updateTeamMembers);

export default router;