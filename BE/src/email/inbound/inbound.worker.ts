
import logger from "@/config/logger";
import { createHash } from "crypto";
import Ticket from "@/models/Ticket";
import { TICKET_PRIORITY } from "@/models/Ticket";
import {
  TICKET_STATUS,
  TICKET_CLASSIFICATION,
  TICKET_NUMBER_PREFIX,
  PRIORITY,
  type TicketClassification,
  type TicketPriority,
} from "@/constants/constants";
import { classifyTicketCategory } from "@/email/shared/ticket-classifier";
import { recordFeedbackFromReply } from "@/services/feedback.service";
import { CommentService } from "@/services/comment.service";
import { applyAutomationRules } from "@/services/automation.service";

/* -------------------------------------------------------------------------- */
/* CONTRACT                                                                   */
/* -------------------------------------------------------------------------- */

export interface InboundEmailJob {
  uid: number;
  from: string;
  /** FIX #2: Display name from the From header (e.g. "John Smith"). Empty string if absent. */
  fromName: string;
  subject: string;
  text?: string;
  html?: string;
  date: Date;
}

/* -------------------------------------------------------------------------- */
/* PRIORITY MAPPING                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Maps string priority from classify() → numeric color_code on the Ticket schema.
 * Ticket.ts uses TICKET_PRIORITY = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }.
 * constants.ts PRIORITY uses strings: "low" | "medium" | "high" | "urgent".
 */
const PRIORITY_TO_COLOR_CODE: Record<TicketPriority, number> = {
  [PRIORITY.LOW]:    TICKET_PRIORITY.LOW,
  [PRIORITY.MEDIUM]: TICKET_PRIORITY.MEDIUM,
  [PRIORITY.HIGH]:   TICKET_PRIORITY.HIGH,
  [PRIORITY.URGENT]: TICKET_PRIORITY.URGENT,
};

/* -------------------------------------------------------------------------- */
/* MAIN PROCESSOR                                                             */
/* -------------------------------------------------------------------------- */

export async function processInboundEmail(
  email: InboundEmailJob,
): Promise<void> {
  logger.info("[INBOUND_EMAIL_START]", { uid: email.uid });

  const fingerprint = createFingerprint(email);

  /* ── Deduplication: skip if we already processed this exact email ──────── */
  const exists = await Ticket.exists({ email_fingerprint: fingerprint });
  if (exists) {
    logger.info("[INBOUND_EMAIL_DUPLICATE_SKIPPED]", {
      uid: email.uid,
      fingerprint,
    });
    return;
  }

  const classification = classify(email);

  const bodyText = email.text || stripHtml(email.html) || "";

  /*
   * REPLY DETECTION: every inbound email previously created a brand-new
   * ticket, even when it was a reply to one already awaiting feedback.
   * A ticket number (e.g. "TCK-A1B2C3D4") appearing in the subject is
   * treated as a match — match against tickets currently awaiting a
   * feedback reply (feedback_requested_at set) first, since that's the
   * only reply flow this system currently understands.
   */
  const ticketNumberMatch = email.subject.match(
    new RegExp(`${TICKET_NUMBER_PREFIX}-[A-Z0-9]+`, "i"),
  );

  if (ticketNumberMatch) {
    const tktNumber = ticketNumberMatch[0].toUpperCase();

    // 1. Feedback reply — ticket awaiting CSAT rating
    const feedbackTicket = await Ticket.findOne({
      tkt_number: tktNumber,
      feedback_requested_at: { $ne: null },
    })
      .select({ _id: 1, tkt_number: 1 })
      .lean<{ _id: import("mongoose").Types.ObjectId; tkt_number: string } | null>();

    if (feedbackTicket) {
      logger.info("[INBOUND_EMAIL_FEEDBACK_REPLY_MATCHED]", { uid: email.uid, ticketId: feedbackTicket._id });
      const recorded = await recordFeedbackFromReply({
        ticketId: feedbackTicket._id,
        ticketNumber: feedbackTicket.tkt_number,
        customerEmail: email.from,
        bodyText,
      });
      if (recorded) return;
      // Unparseable — fall through to conversation threading below
    }

    // 2. Conversation reply — thread into the existing ticket regardless of status
    const existingTicket = await Ticket.findOne({ tkt_number: tktNumber })
      .select({ _id: 1, tkt_number: 1, tkt_customer_name: 1 })
      .lean<{ _id: import("mongoose").Types.ObjectId; tkt_number: string; tkt_customer_name?: string } | null>();

    if (existingTicket) {
      logger.info("[INBOUND_EMAIL_REPLY_THREADED]", { uid: email.uid, ticketId: existingTicket._id });
      try {
        await CommentService.createFromEmail(existingTicket._id.toString(), {
          fromEmail: email.from,
          fromName: existingTicket.tkt_customer_name || email.from,
          message: bodyText || "(empty reply)",
        });
        // If the ticket was resolved/closed, reopen it since the customer replied
        const ticket = await Ticket.findById(existingTicket._id).select({ tkt_status: 1 }).lean<{ tkt_status: string } | null>();
        if (ticket && (ticket.tkt_status === TICKET_STATUS.RESOLVED || ticket.tkt_status === TICKET_STATUS.CLOSED)) {
          await Ticket.updateOne(
            { _id: existingTicket._id },
            { $set: { tkt_status: TICKET_STATUS.OPEN, was_reopened: true, update_date: new Date() } },
          );
        }
      } catch (err) {
        logger.error("[INBOUND_EMAIL_THREAD_FAILED]", { uid: email.uid, err });
      }
      return; // Do NOT create a new ticket
    }
  }

  const categoryResult = classifyTicketCategory(email.subject, bodyText);

  logger.info("[INBOUND_EMAIL_CLASSIFIED]", {
    uid: email.uid,
    catId: categoryResult.catId,
    subCatId: categoryResult.subCatId,
    score: categoryResult.score,
    // Only log the top few candidates — enough to see a close call without
    // flooding logs on every single inbound email.
    candidates: categoryResult.candidates.slice(0, 3),
  });

  try {
    const ticket = await Ticket.create({
      tkt_number:             generateTicketNumber(),
      email_subject:          email.subject,
      description:            bodyText || "No content",
      // FIX #2: use display name from email header if present, else fall back to address
      tkt_customer_name:      email.fromName || email.from,
      eml_ticket_created_for: email.from,
      tkt_type:               classification.category,
      cat_id:                 categoryResult.catId,
      sub_cat_id:             categoryResult.subCatId,
      tkt_status:             TICKET_STATUS.NEW,
      color_code:             PRIORITY_TO_COLOR_CODE[classification.priority],
      email_fingerprint:      fingerprint,
      email_uid:              email.uid,
      email_date:             email.date,
      source:                 "email",
    });

    logger.info("[INBOUND_EMAIL_TICKET_CREATED]", {
      uid:        email.uid,
      ticketId:   ticket._id,
      tktNumber:  ticket.tkt_number,
      fingerprint,
    });

    // Apply ticket_created automation rules (best-effort).
    applyAutomationRules("ticket_created", ticket._id).catch((err) =>
      logger.error("[AUTOMATION_INBOUND_TRIGGER_FAILED]", { ticketId: ticket._id, err }),
    );
  } catch (err) {
    logger.error("[INBOUND_EMAIL_FAILED]", { uid: email.uid, err });
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* CLASSIFICATION                                                             */
/* -------------------------------------------------------------------------- */

function classify(email: {
  subject: string;
  text?: string;
  html?: string;
}): { category: TicketClassification; priority: TicketPriority } {
  const body = `${email.subject} ${email.text || stripHtml(email.html) || ""}`.toLowerCase();

  let priority: TicketPriority = PRIORITY.LOW;
  if (body.includes("urgent") || body.includes("critical") || body.includes("asap")) {
    priority = PRIORITY.HIGH;
  } else if (body.includes("help") || body.includes("request")) {
    priority = PRIORITY.MEDIUM;
  }

  let category: TicketClassification = TICKET_CLASSIFICATION.GENERAL;
  if (body.includes("complaint"))     category = TICKET_CLASSIFICATION.COMPLAINT;
  else if (body.includes("incident")) category = TICKET_CLASSIFICATION.INCIDENT;
  else if (body.includes("service"))  category = TICKET_CLASSIFICATION.SERVICE;
  else if (body.includes("request"))  category = TICKET_CLASSIFICATION.REQUEST;

  return { category, priority };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function createFingerprint(email: InboundEmailJob): string {
  return createHash("sha256")
    .update(`${email.from}::${email.subject}::${email.date.toISOString()}`)
    .digest("hex");
}

/**
 * Generates a simple time-based ticket number.
 * Replace with your generateTicketNumber util if one exists at @/utils/generateTicketNumber.
 */
function generateTicketNumber(): string {
  return `TCK-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function stripHtml(html?: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}