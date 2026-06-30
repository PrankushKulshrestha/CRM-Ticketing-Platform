
import type { Response } from "express";

import { HTTP_STATUS } from "../constants/constants";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import FeedbackModel from "../models/Feedback";
import TicketModel from "../models/Ticket";
import { requestFeedback } from "../services/feedback.service";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

const buildResponse = <T>(message: string, data: T) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

/**
 * GET /tickets/:id/feedback
 */
export const getTicketFeedback = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const feedback = await FeedbackModel.find({ ticketId: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Feedback fetched successfully", feedback),
    );
  },
);

/**
 * POST /tickets/:id/feedback/request
 * Manual trigger — agent explicitly requests feedback from the customer.
 * The auto-send on Resolve still fires too; this lets agents re-send
 * or send early (e.g. before marking resolved).
 */
export const requestTicketFeedback = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const ticket = await TicketModel.findById(req.params.id)
      .select({ _id: 1, tkt_number: 1, email_subject: 1, eml_ticket_created_for: 1, tkt_customer_name: 1 })
      .lean<{
        _id: import("mongoose").Types.ObjectId;
        tkt_number: string;
        email_subject?: string;
        eml_ticket_created_for?: string;
        tkt_customer_name?: string;
      } | null>();

    if (!ticket) throw new ApiError(404, "Ticket not found");
    if (!ticket.eml_ticket_created_for) {
      throw new ApiError(400, "Ticket has no customer email — cannot send feedback request");
    }

    await requestFeedback(ticket);

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Feedback request sent", { ticketId: req.params.id }),
    );
  },
);
