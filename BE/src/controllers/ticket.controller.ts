
import type { Request, Response } from "express";

import {
  HTTP_STATUS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "../constants/constants";
import { TicketService } from "../services/ticket.service";
import { asyncHandler } from "../utils/asyncHandler";

import type { TicketFilters } from "../types/ticket.types";

/*
 * FIX: updateTicket needs the acting user's id to attribute the new
 * STATUS_CHANGE AuditLog entry (see ticket.service.ts). Plain `Request`
 * has no `.user` property, so this route specifically needs
 * AuthenticatedRequest — already used elsewhere (rbac.middleware.ts
 * imports it from "./auth.middleware"), just not in this file yet.
 */
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

/* -------------------------------------------------------------------------- */
/* Response Builder                                                           */
/* -------------------------------------------------------------------------- */

const buildResponse = <T>(message: string, data: T, meta?: unknown) => ({
  success: true,
  message,
  data,
  meta,
  timestamp: new Date().toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Safe Parsers                                                               */
/* -------------------------------------------------------------------------- */

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v.length ? v : undefined;
};

/* -------------------------------------------------------------------------- */
/* Filter Builder                                                             */
/* -------------------------------------------------------------------------- */

const buildFilters = (query: Request["query"]): TicketFilters => ({
  page: toNumber(query.page, DEFAULT_PAGE),
  limit: Math.min(toNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  search: toOptionalString(query.search),
  tkt_status: toOptionalString(query.tkt_status),
  tkt_type: toOptionalString(query.tkt_type),
  cat_id: toOptionalString(query.cat_id),
  sub_cat_id: toOptionalString(query.sub_cat_id),
  sub_sub_cat_id: toOptionalString(query.sub_sub_cat_id),
  tkt_user: toOptionalString(query.tkt_user),
});

/* -------------------------------------------------------------------------- */
/* Controllers                                                                */
/* -------------------------------------------------------------------------- */

export const getTickets = asyncHandler(async (req: Request, res: Response) => {
  const filters = buildFilters(req.query);

  const result = await TicketService.getTickets(filters);

  res.status(HTTP_STATUS.OK).json(
    buildResponse("Tickets fetched successfully", result.data, result.meta)
  );
});

export const getTicketById = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await TicketService.getTicketById(req.params.id);

  res.status(HTTP_STATUS.OK).json(
    buildResponse("Ticket fetched successfully", ticket)
  );
});

/* -------------------------------------------------------------------------- */
/* ADD MISSING EXPORTS (FIX ROUTER CRASH)                                     */
/* -------------------------------------------------------------------------- */

export const createTicket = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await TicketService.createTicket(req.body);

  res.status(HTTP_STATUS.CREATED).json(
    buildResponse("Ticket created successfully", ticket)
  );
});

export const updateTicket = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    /*
     * FIX: previously called without a third argument, so
     * TicketService.updateTicket had no actingUserId and every
     * STATUS_CHANGE audit entry would have been written with no userId.
     * req.user is populated by the `authenticate` middleware that already
     * runs before this handler (see ticket.routes.ts's writeAccess chain).
     */
    const ticket = await TicketService.updateTicket(
      req.params.id,
      req.body,
      req.user?.userId,
      req.user?.role,
    );

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Ticket updated successfully", ticket)
    );
  },
);

export const deleteTicket = asyncHandler(async (req: Request, res: Response) => {
  await TicketService.deleteTicket(req.params.id);

  res.status(HTTP_STATUS.OK).json(
    buildResponse("Ticket deleted successfully", true)
  );
});

export const getTicketCount = asyncHandler(async (_req: Request, res: Response) => {
  const result = await TicketService.getTickets({ page: 1, limit: 1 });

  res.status(HTTP_STATUS.OK).json(
    buildResponse("Count fetched", { total: result.meta.total })
  );
});

export const getTicketStatistics = asyncHandler(async (_req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json(
    buildResponse("Statistics fetched", {
      message: "Not implemented yet"
    })
  );
});

/**
 * GET /tickets/:id/history
 * Returns the audit-log history for a ticket (FIX #3 — view history).
 */
export const getTicketHistory = asyncHandler(async (req: Request, res: Response) => {
  const history = await TicketService.getTicketHistory(req.params.id);
  res.status(HTTP_STATUS.OK).json(buildResponse("History fetched successfully", history));
});

/**
 * POST /tickets/:id/merge
 * Body: { targetId: string }
 * Merges this ticket INTO targetId (FIX #3 — wire merge button).
 */
export const mergeTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { targetId } = req.body as { targetId?: string };
  if (!targetId) throw new Error("targetId is required");

  const merged = await TicketService.mergeTickets(req.params.id, targetId, req.user?.userId);
  res.status(HTTP_STATUS.OK).json(buildResponse("Tickets merged successfully", merged));
});

/**
 * GET /tickets/backlog
 * Returns backlog summary grouped by status/priority (FIX #8).
 * Agents see only their own backlog; managers/admins see all.
 */
export const getBacklog = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const backlog = await TicketService.getBacklog(req.user?.userId, req.user?.role);
  res.status(HTTP_STATUS.OK).json(buildResponse("Backlog fetched successfully", backlog));
});
/**
 * GET /tickets/:id/print
 * FIX #6: Returns a complete, non-paginated snapshot (ticket + all comments +
 * audit history) for reliable full-length printing. The client renders this
 * single payload so no subsequent requests are needed during print.
 */
export const getTicketPrintData = asyncHandler(async (req: Request, res: Response) => {
  const data = await TicketService.getPrintData(req.params.id);
  res.status(HTTP_STATUS.OK).json(buildResponse("Print data fetched successfully", data));
});
