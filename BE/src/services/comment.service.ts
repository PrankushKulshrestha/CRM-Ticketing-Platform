
import mongoose from "mongoose";
import TicketCommentModel from "../models/TicketComment";
import TicketModel from "../models/Ticket";
import UserModel from "../models/User";
import { ApiError } from "../utils/ApiError";
import { AuditLog } from "../models/AuditLog";
import { AUDIT_ACTIONS } from "../constants/constants";
import logger from "../config/logger";
import { sendRawOutboundEmail } from "../email/outbound/outbound.pipeline";

/* -------------------------------------------------------------------------- */
/* Domain shape                                                              */
/* -------------------------------------------------------------------------- */

export interface CommentAuthor {
  userId: string;
  role: string;
}

export interface TicketCommentDTO {
  id: string;
  ticketId: string;
  message: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  isInternal: boolean;
  source: "agent_reply" | "email_inbound" | "note";
  fromCustomer: boolean;
  fromEmail?: string;
  createdAt: string;
  updatedAt: string;
}

type LeanComment = {
  _id: mongoose.Types.ObjectId;
  ticketId: mongoose.Types.ObjectId;
  message: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  isInternal: boolean;
  source?: string;
  fromCustomer?: boolean;
  fromEmail?: string;
  createdAt: Date;
  updatedAt: Date;
};

const toDTO = (doc: LeanComment): TicketCommentDTO => ({
  id: doc._id.toString(),
  ticketId: doc.ticketId.toString(),
  message: doc.message,
  authorId: doc.authorId.toString(),
  authorName: doc.authorName,
  authorRole: doc.authorRole,
  isInternal: doc.isInternal,
  source: (doc.source as TicketCommentDTO["source"]) ?? (doc.isInternal ? "note" : "agent_reply"),
  fromCustomer: doc.fromCustomer ?? false,
  fromEmail: doc.fromEmail,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export class CommentService {
  /* ---------------------------------------------------------------------- */
  /* LIST — oldest first, the natural reading order for a reply thread      */
  /* ---------------------------------------------------------------------- */

  static async getCommentsForTicket(
    ticketId: string,
  ): Promise<TicketCommentDTO[]> {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new ApiError(400, "Invalid ticket id");
    }

    const docs = await TicketCommentModel.find({ ticketId })
      .sort({ createdAt: 1 })
      .lean<LeanComment[]>();

    return docs.map(toDTO);
  }

  /* ---------------------------------------------------------------------- */
  /* CREATE                                                                 */
  /* ---------------------------------------------------------------------- */

  static async addComment(
    ticketId: string,
    message: string,
    isInternal: boolean,
    author: CommentAuthor,
  ): Promise<TicketCommentDTO> {
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      throw new ApiError(400, "Invalid ticket id");
    }

    const trimmed = message.trim();
    if (!trimmed) {
      throw new ApiError(400, "Comment message cannot be empty");
    }

    const ticket = await TicketModel.findById(ticketId).select({
      first_response_at: 1,
      eml_ticket_created_for: 1,
      email_subject: 1,
      tkt_number: 1,
      message_id: 1,
    });

    if (!ticket) throw new ApiError(404, "Ticket not found");

    const authorUser = await UserModel.findById(author.userId).select({
      name: 1,
    });

    if (!authorUser) throw new ApiError(404, "Author user not found");

    const created = await TicketCommentModel.create({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      message: trimmed,
      authorId: new mongoose.Types.ObjectId(author.userId),
      authorName: authorUser.name,
      authorRole: author.role,
      isInternal,
    });

    /*
     * First Response Time (FRT): stamp first_response_at the first time a
     * non-internal (customer-facing) agent comment lands on this ticket.
     * Internal notes are agent-to-agent and don't count — they don't
     * communicate anything to the customer, so they shouldn't move the
     * metric. Written once, immutably: a ticket's FRT reflects the first
     * reply ever, even across reopen/resolve cycles.
     */
    if (!isInternal && !ticket.get("first_response_at")) {
      try {
        const updateResult = await TicketModel.updateOne(
          { _id: ticketId },
          { $set: { first_response_at: created.createdAt } },
        );
        logger.info("[FIRST_RESPONSE_AT_SET]", {
          ticketId,
          matched: updateResult.matchedCount,
          modified: updateResult.modifiedCount,
          value: created.createdAt,
        });
      } catch (err) {
        // Best-effort — the comment itself already succeeded above, and
        // FRT is an analytics signal, not a transactional requirement.
        logger.error("[FIRST_RESPONSE_AT_UPDATE_FAILED]", {
          ticketId,
          err,
        });
      }
    }

    /*
     * Outbound reply: a non-internal comment IS the customer-facing reply.
     * Previously this only wrote to ticket_comments — nothing was ever
     * dispatched to the customer's inbox. dispatchEmail enqueues onto the
     * existing outbound worker, so this is fire-and-forget and won't block
     * the API response.
     */
    if (!isInternal) {
      const customerEmail = ticket.get("eml_ticket_created_for") as
        | string
        | undefined;

      if (customerEmail) {
        const subject = (ticket.get("email_subject") as string | undefined) ||
          "Update on your ticket";
        const tktNumber = ticket.get("tkt_number") as string | undefined;
        const originalMessageId = ticket.get("message_id") as
          | string
          | undefined;

        try {
          sendRawOutboundEmail({
            to: customerEmail,
            subject: subject.toLowerCase().startsWith("re:")
              ? subject
              : `Re: ${subject}`,
            html: `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${trimmed
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</div>`,
            meta: {
              ticketId,
              userId: author.userId,
              source: "ticket",
            },
          });
          logger.info("[TICKET_REPLY_EMAIL_QUEUED]", {
            ticketId,
            to: customerEmail,
            commentId: created._id.toString(),
            inReplyTo: originalMessageId,
            tktNumber,
          });
        } catch (err) {
          // Best-effort — the comment itself already succeeded. A failed
          // dispatch shouldn't fail the API request.
          logger.error("[TICKET_REPLY_EMAIL_FAILED]", { ticketId, err });
        }
      } else {
        logger.warn("[TICKET_REPLY_EMAIL_SKIPPED_NO_CUSTOMER_EMAIL]", {
          ticketId,
        });
      }
    }

    try {
      await AuditLog.create({
        userId: new mongoose.Types.ObjectId(author.userId),
        action: AUDIT_ACTIONS.COMMENT,
        entity: "Ticket",
        entityId: created.ticketId,
        message: isInternal
          ? "Internal note added"
          : "Reply sent to customer",
        metadata: { commentId: created._id.toString(), isInternal },
      });
    } catch (err) {
      logger.error("[COMMENT_AUDIT_LOG_FAILED]", { ticketId, err });
    }

    return toDTO(created.toObject() as LeanComment);
  }

  /* ---------------------------------------------------------------------- */
  /* CREATE FROM EMAIL — threads an inbound customer email into the ticket   */
  /* as a conversation entry rather than creating a new ticket.              */
  /* ---------------------------------------------------------------------- */

  static async createFromEmail(
    ticketId: string,
    params: {
      fromEmail: string;
      fromName: string;
      message: string;
    },
  ): Promise<TicketCommentDTO> {
    // Use a dummy ObjectId for customer-originated messages — they have no
    // User document. The authorName/fromEmail carry the identity.
    const CUSTOMER_AUTHOR_ID = new mongoose.Types.ObjectId("000000000000000000000000");

    const created = await TicketCommentModel.create({
      ticketId: new mongoose.Types.ObjectId(ticketId),
      message: params.message,
      authorId: CUSTOMER_AUTHOR_ID,
      authorName: params.fromName || params.fromEmail,
      authorRole: "customer",
      isInternal: false,
      source: "email_inbound",
      fromCustomer: true,
      fromEmail: params.fromEmail,
    });

    return toDTO(created.toObject() as LeanComment);
  }
}
