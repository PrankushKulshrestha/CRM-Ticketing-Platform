
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/* -------------------------------------------------------------------------- */

export interface TicketCommentEntity {
  ticketId: mongoose.Types.ObjectId;

  message: string;

  /**
   * Author fields are snapshotted at write time (not just an ObjectId ref)
   * so comment history still reads correctly if the user is later renamed
   * or deleted — the same pattern AuditLog uses for actor metadata.
   */
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;

  /**
   * Internal notes are agent-only and never count as a customer-facing
   * response — CommentService excludes them from first_response_at.
   */
  isInternal: boolean;

  /**
   * Channel that originated this message.
   * "agent_reply"   — agent composed this in the ticket UI
   * "email_inbound" — customer replied by email; threaded into the ticket
   * "note"          — internal note (redundant with isInternal but explicit)
   */
  source: "agent_reply" | "email_inbound" | "note";

  /** True when the message came from the customer (email_inbound), not an agent. */
  fromCustomer: boolean;

  /** Customer email address, populated for email_inbound messages. */
  fromEmail?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type TicketCommentDocument = HydratedDocument<TicketCommentEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const TicketCommentSchema = new Schema<TicketCommentEntity>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10_000,
    },

    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorName: {
      type: String,
      required: true,
      trim: true,
    },

    authorRole: {
      type: String,
      required: true,
      trim: true,
    },

    isInternal: {
      type: Boolean,
      default: false,
    },

    source: {
      type: String,
      enum: ["agent_reply", "email_inbound", "note"],
      default: "agent_reply",
    },

    fromCustomer: {
      type: Boolean,
      default: false,
    },

    fromEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  {
    collection: "ticket_comments",
    timestamps: true,
    versionKey: false,
  },
);

/* Comment list for a ticket, oldest-first, is the primary read pattern. */
TicketCommentSchema.index({ ticketId: 1, createdAt: 1 });

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const TicketComment: Model<TicketCommentEntity> =
  (mongoose.models.TicketComment as Model<TicketCommentEntity>) ||
  mongoose.model<TicketCommentEntity>("TicketComment", TicketCommentSchema);

export default TicketComment;
