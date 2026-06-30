
import mongoose from "mongoose";
import FeedbackModel, { FEEDBACK_SOURCES } from "../models/Feedback";
import TicketModel from "../models/Ticket";
import { sendOutboundEmail } from "../email/outbound/outbound.pipeline";
import logger from "../config/logger";

/* -------------------------------------------------------------------------- */
/* REQUEST — fired once, when a ticket transitions to Resolved                */
/* -------------------------------------------------------------------------- */

interface ResolvedTicketForFeedback {
  _id: mongoose.Types.ObjectId;
  tkt_number: string;
  email_subject?: string;
  eml_ticket_created_for?: string;
  tkt_customer_name?: string;
}

export async function requestFeedback(ticket: ResolvedTicketForFeedback): Promise<void> {
  const recipient = ticket.eml_ticket_created_for;
  if (!recipient) {
    logger.warn("[FEEDBACK_REQUEST_SKIPPED_NO_EMAIL]", { ticketId: ticket._id });
    return;
  }

  const requestedAt = new Date();

  sendOutboundEmail({
    to: recipient,
    templateName: "feedback_request",
    context: {
      name: ticket.tkt_customer_name || "there",
      tkt_number: ticket.tkt_number,
      subject: ticket.email_subject || "",
    },
    meta: { ticketId: ticket._id.toString(), source: "ticket" },
  });

  await TicketModel.updateOne(
    { _id: ticket._id },
    { $set: { feedback_requested_at: requestedAt } },
  );
}

/* -------------------------------------------------------------------------- */
/* PARSE — turn a customer's reply body into a 1-5 rating + description       */
/*                                                                            */
/* Looks for a standalone digit 1-5 (optionally "X/5" or "X out of 5"), and  */
/* treats everything else as the description. Best-effort: a reply with no  */
/* recognizable rating is not recorded (logged for manual follow-up) rather  */
/* than guessing.                                                            */
/* -------------------------------------------------------------------------- */

const RATING_PATTERNS = [
  /\b([1-5])\s*\/\s*5\b/, // "4/5"
  /\b([1-5])\s+out of\s+5\b/i, // "4 out of 5"
  /\brating[:\s]+([1-5])\b/i, // "rating: 4"
  /^\s*([1-5])\s*[-—:.]/m, // leading "5 — great service" on its own line
  /\b([1-5])\s*stars?\b/i, // "5 stars"
];

export function parseFeedbackReply(body: string): { rating: number; description: string } | null {
  const text = body.trim();
  if (!text) return null;

  for (const pattern of RATING_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const rating = Number(match[1]);
      const description = text.replace(match[0], "").trim().slice(0, 5000);
      return { rating, description };
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/* RECORD — called by the inbound pipeline once a reply matches a ticket      */
/* awaiting feedback                                                          */
/* -------------------------------------------------------------------------- */

export async function recordFeedbackFromReply(params: {
  ticketId: mongoose.Types.ObjectId;
  ticketNumber: string;
  customerEmail: string;
  bodyText: string;
}): Promise<boolean> {
  const parsed = parseFeedbackReply(params.bodyText);

  if (!parsed) {
    logger.info("[FEEDBACK_REPLY_UNPARSEABLE]", { ticketId: params.ticketId });
    return false;
  }

  const ticket = await TicketModel.findById(params.ticketId)
    .select({ feedback_requested_at: 1 })
    .lean<{ feedback_requested_at?: Date | null } | null>();

  await FeedbackModel.create({
    ticketId: params.ticketId,
    ticketNumber: params.ticketNumber,
    rating: parsed.rating,
    description: parsed.description,
    customerEmail: params.customerEmail,
    source: FEEDBACK_SOURCES.EMAIL_REPLY,
    rawReplyText: params.bodyText.slice(0, 20_000),
    requestedAt: ticket?.feedback_requested_at ?? new Date(),
    respondedAt: new Date(),
  });

  // Also keep the legacy single-number field on Ticket in sync, since
  // existing UI (TicketDetailsPage's star widget) reads it directly.
  await TicketModel.updateOne(
    { _id: params.ticketId },
    { $set: { customer_satisfaction: parsed.rating, feedback_requested_at: null } },
  );

  logger.info("[FEEDBACK_RECORDED]", { ticketId: params.ticketId, rating: parsed.rating });
  return true;
}
