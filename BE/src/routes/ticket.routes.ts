
import { Router, RequestHandler } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketCount,
  getTicketStatistics,
  getTicketHistory,
  mergeTicket,
  getBacklog,
  getTicketPrintData,
} from "../controllers/ticket.controller";

import {
  getTicketComments,
  addTicketComment,
} from "../controllers/comment.controller";

import { getTicketFeedback, requestTicketFeedback } from "../controllers/feedback.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Middleware Chains                                                          */
/* -------------------------------------------------------------------------- */

const readAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TICKETS_READ]),
];

const writeAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_UPDATE,
  ]),
];

const deleteAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TICKETS_DELETE]),
];

const commentAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.TICKETS_COMMENT]),
];

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /tickets/statistics
 */
router.get("/statistics", ...readAccess, getTicketStatistics);

/**
 * GET /tickets/count
 */
router.get("/count", ...readAccess, getTicketCount);

/**
 * GET /tickets/backlog — FIX #8: backlog visibility for agents
 */
router.get("/backlog", ...readAccess, getBacklog);

/**
 * GET /tickets
 */
router.get("/", ...readAccess, getTickets);

/**
 * GET /tickets/:id
 */
router.get("/:id", ...readAccess, getTicketById);

/**
 * POST /tickets
 */
router.post("/", ...writeAccess, createTicket);

/**
 * PATCH /tickets/:id
 */
router.patch("/:id", ...writeAccess, updateTicket);

/**
 * DELETE /tickets/:id
 */
router.delete("/:id", ...deleteAccess, deleteTicket);

/**
 * GET /tickets/:id/comments
 */
router.get("/:id/comments", ...readAccess, getTicketComments);

/**
 * POST /tickets/:id/comments
 */
router.post("/:id/comments", ...commentAccess, addTicketComment);

/**
 * GET /tickets/:id/feedback
 */
router.get("/:id/feedback", ...readAccess, getTicketFeedback);
router.post("/:id/feedback/request", ...writeAccess, requestTicketFeedback);

/**
 * GET /tickets/:id/history — FIX #3: view ticket history (audit log)
 */
router.get("/:id/history", ...readAccess, getTicketHistory);

/**
 * POST /tickets/:id/merge — FIX #3: merge ticket into another
 * Body: { targetId: string }
 */
router.post("/:id/merge", ...writeAccess, mergeTicket);

/**
 * GET /tickets/:id/print — FIX #6: full non-paginated data for printing
 */
router.get("/:id/print", ...readAccess, getTicketPrintData);

export default router;