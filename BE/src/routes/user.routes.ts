
import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

import {
  getUsers,
  getUserById,
  getAssignableUsers,
  createUser,
  updateUser,
  deleteUser,
  updateCurrentUser,
  getCurrentUser,
  changeUserStatus,
} from "../controllers/user.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Middleware shortcuts                                                       */
/* -------------------------------------------------------------------------- */

const withAuth = authenticate;

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /users
 */
router.get(
  "/",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_READ]),
  getUsers,
);

/**
 * POST /users
 */
router.post(
  "/",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_CREATE]),
  createUser,
);

/**
 * GET /users/me
 */
router.get(
  "/me",
  withAuth,
  getCurrentUser,
);

/**
 * GET /users/assignable
 *
 * Lightweight list of users a ticket can be assigned to (admin/manager/
 * team_lead/agent). Gated by TICKETS_READ rather than USERS_READ — every
 * ticket-handling role has TICKETS_READ, whereas USERS_READ is admin/
 * manager only and would leave agents/team leads unable to populate the
 * assignee dropdown. Must be registered before GET /:id so "assignable"
 * isn't swallowed as an :id param.
 */
router.get(
  "/assignable",
  withAuth,
  requirePermissions([PERMISSIONS.TICKETS_READ]),
  getAssignableUsers,
);

/**
 * PATCH /users/me
 */
router.patch(
  "/me",
  withAuth,
  updateCurrentUser,
);

/**
 * PATCH /users/:id/status
 */
router.patch(
  "/:id/status",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_UPDATE]),
  changeUserStatus,
);

/**
 * GET /users/:id
 */
router.get(
  "/:id",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_READ]),
  getUserById,
);

/**
 * PATCH /users/:id
 */
router.patch(
  "/:id",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_UPDATE]),
  updateUser,
);

/**
 * DELETE /users/:id
 */
router.delete(
  "/:id",
  withAuth,
  requirePermissions([PERMISSIONS.USERS_DELETE]),
  deleteUser,
);

export default router;