
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/*                                                                            */
/* Feedback is requested by email when a ticket is marked Resolved, and       */
/* recorded from the customer's reply: a 1-5 rating plus free-text comments.  */
/* `source` is kept so future channels (a public survey link, in-app widget)  */
/* can write into the same collection without a schema change.                */
/* -------------------------------------------------------------------------- */

export const FEEDBACK_SOURCES = {
  EMAIL_REPLY: "email_reply",
  MANUAL: "manual",
} as const;

export type FeedbackSource = (typeof FEEDBACK_SOURCES)[keyof typeof FEEDBACK_SOURCES];

export interface IFeedback {
  ticketId: mongoose.Types.ObjectId;
  ticketNumber: string;

  rating: number; // 1-5
  description?: string;

  customerEmail: string;
  source: FeedbackSource;

  /** Raw reply body, kept for audit/debugging the parser. */
  rawReplyText?: string;

  requestedAt: Date;
  respondedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackDocument = HydratedDocument<IFeedback>;

const FeedbackSchema = new Schema<IFeedback>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
      index: true,
    },

    ticketNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    source: {
      type: String,
      enum: Object.values(FEEDBACK_SOURCES),
      default: FEEDBACK_SOURCES.EMAIL_REPLY,
    },

    rawReplyText: {
      type: String,
      maxlength: 20_000,
    },

    requestedAt: {
      type: Date,
      required: true,
    },

    respondedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "feedback",
    timestamps: true,
    versionKey: false,
  },
);

FeedbackSchema.index({ ticketId: 1, createdAt: -1 });

const FeedbackModel: Model<IFeedback> =
  (mongoose.models.Feedback as Model<IFeedback>) ||
  mongoose.model<IFeedback>("Feedback", FeedbackSchema);

export default FeedbackModel;
