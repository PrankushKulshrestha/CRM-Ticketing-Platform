
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Ticket Status                                                              */
/* -------------------------------------------------------------------------- */

export const TICKET_STATUS = {
  NEW: "new",
  OPEN: "open",
  PENDING: "pending",
  REOPENED: "reopened",
  REQUEST_CLARIFICATION: "request_clarification",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];

/* -------------------------------------------------------------------------- */
/* Ticket Type                                                                */
/* -------------------------------------------------------------------------- */

export const TICKET_TYPE = {
  GENERAL: "General",
  COMPLAINT: "Complaint",
  REQUEST: "Request",
  INCIDENT: "Incident",
  SERVICE: "Service",
} as const;

export type TicketType = (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE];

/* -------------------------------------------------------------------------- */
/* Ticket Priority                                                            */
/* -------------------------------------------------------------------------- */

export const TICKET_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
} as const;

export type TicketPriority =
  (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY];

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/* -------------------------------------------------------------------------- */

export interface TicketEntity {
  tkt_number: string;

  eml_ticket_created_by?: string;
  eml_ticket_created_for?: string;

  email_date?: Date | null;
  update_date?: Date | null;

  email_subject?: string;

  created_date: Date;

  tkt_status: TicketStatus;

  description?: string;

  tkt_user?: string;

  tkt_eml_id?: number;

  tkt_custom1?: string;
  tkt_custom2?: string;
  tkt_custom3?: string;
  tkt_custom4?: string;
  tkt_custom5?: string;

  /**
   * Reply thread history.
   * Email replies are appended here by emailIngestion.service.ts
   */
  remarks_n?: string;

  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;

  /**
   * Original email Message-ID.
   */

  message_id?: string;

  /**
   * Deterministic dedupe key.
   */
  email_fingerprint?: string;

  /**
   * IMAP UID used by ingestion service.
   */
  email_uid?: number;

  /**
   * Email threading metadata.
   */
  in_reply_to?: string;

  references?: readonly string[];
  assigned_date?: Date | null;
  reopened_date?: Date | null;
  resolved_date?: Date | null;
  closed_date?: Date | null;

  /**
   * Timestamp of the first non-internal agent comment on this ticket.
   * Set once, immutably, by CommentService.addComment() — this is the
   * canonical First Response Time (FRT) event. Internal notes do not
   * count, since they're not customer-facing.
   */
  first_response_at?: Date | null;

  /**
   * Set once (never cleared back to false) the first time a ticket that
   * had already been resolved/closed gets reopened. Used to compute First
   * Contact Resolution (FCR) — a ticket resolved cleanly without ever
   * being reopened counts toward FCR; one that bounced back doesn't.
   */
  was_reopened?: boolean;

  /**
   * Customer satisfaction rating, 1-5. Recorded by an agent on behalf of
   * the customer (e.g. relayed over phone/email) since there is no
   * public customer-facing survey flow yet — see CSAT integration notes
   * in analytics.service.ts. Null/unset until a rating is recorded.
   */
  customer_satisfaction?: number | null;

  /** Set when a feedback-request email is sent on Resolve; cleared once answered. */
  feedback_requested_at?: Date | null;

  /**
   * If this ticket was merged INTO another, this stores the target ticket's _id.
   * Merged tickets are effectively archived — they remain for history but should
   * not appear in the main ticket list.
   */
  merged_into?: mongoose.Types.ObjectId | null;

  /** Date when this ticket was merged. */
  merged_at?: Date | null;

  tkt_customer_name?: string;
  tkt_customer_mobile?: string;

  color_code?: TicketPriority;

  tkt_type?: TicketType;

  /**
   * How this ticket was created.
   */
  source?: "email" | "manual" | "api";

  /**
   * Agent currently assigned to this ticket. References User._id.
   * FIX: field never existed, so assignment was always empty.
   */
  tkt_assigned_to?: mongoose.Types.ObjectId | null;

  /** Direct team assignment — stored so automation rules can assign_team independently. */
  tkt_team?: mongoose.Types.ObjectId | null;
}

export type TicketDocument = HydratedDocument<TicketEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const TicketSchema = new Schema<TicketEntity>(
  {
    tkt_number: {
      maxlength: 50,
      type: String,
      required: true,
      trim: true,
      immutable: true,
    },

    message_id: {
      type: String,
      trim: true,
      lowercase: true,
      immutable: true,
      set: (v?: string) => (v?.trim() ? v.trim().toLowerCase() : undefined),
    },

    email_fingerprint: {
      type: String,
    },

    email_uid: {
      type: Number,
      unique: true,
      sparse: true,
    },

    in_reply_to: {
      type: String,
      trim: true,
      lowercase: true,
      set: (v?: string) => (v?.trim() ? v.trim().toLowerCase() : undefined),
    },

    references: {
      type: [String],
      default: [],
      set: (refs?: unknown[]) =>
        Array.isArray(refs)
          ? refs
              .filter(
                (ref): ref is string =>
                  typeof ref === "string" && ref.trim().length > 0,
              )
              .map((ref) => ref.trim().toLowerCase())
          : [],
    },

    tkt_customer_name: {
      type: String,
      trim: true,
      maxlength: 255,
    },

    eml_ticket_created_for: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      immutable: true,
    },

    eml_ticket_created_by: {
      type: String,
      trim: true,
      maxlength: 254,
    },

    email_date: {
      type: Date,
      default: null,
      index: true,
      immutable: true,
    },

    update_date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    email_subject: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    created_date: {
      type: Date,
      default: Date.now,
      immutable: true,
      index: true,
    },

    tkt_status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.OPEN,
    },

    description: {
      type: String,
    },

    tkt_user: {
      type: String,
      trim: true,
      index: true,
    },

    tkt_eml_id: {
      type: Number,
      index: true,
    },

    tkt_custom1: {
      type: String,
      trim: true,
    },

    tkt_custom2: {
      type: String,
      trim: true,
    },

    tkt_custom3: {
      type: String,
      trim: true,
    },

    tkt_custom4: {
      type: String,
      trim: true,
    },

    tkt_custom5: {
      type: String,
      trim: true,
    },
    remarks_n: {
      type: String,
      default: "",
    },

    cat_id: {
      type: String,
      trim: true,
      index: true,
    },

    sub_cat_id: {
      type: String,
      trim: true,
      index: true,
    },

    sub_sub_cat_id: {
      type: String,
      trim: true,
      index: true,
    },

    assigned_date: {
      type: Date,
      default: null,
    },

    reopened_date: {
      type: Date,
      default: null,
    },    
    resolved_date: {
      type: Date,
      default: null,
    },
    closed_date: {
      type: Date,
      default: null,
    },
    first_response_at: {
      type: Date,
      default: null,
    },
    was_reopened: {
      type: Boolean,
      default: false,
      index: true,
    },
    customer_satisfaction: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },

    /**
     * Set when a feedback-request email is sent (on Resolve). Inbound mail
     * matching this ticket's number while this is set gets routed to the
     * feedback parser instead of being treated as a fresh reply/ticket.
     * Cleared once a Feedback document is recorded for the ticket.
     */
    feedback_requested_at: {
      type: Date,
      default: null,
    },

    merged_into: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      default: null,
      index: true,
    },

    merged_at: {
      type: Date,
      default: null,
    },

    tkt_customer_mobile: {
      type: String,
      trim: true,
      maxlength: 30,
    },

    color_code: {
      type: Number,
      enum: Object.values(TICKET_PRIORITY),
      index: true,
    },

    tkt_type: {
      type: String,
      enum: Object.values(TICKET_TYPE),
      index: true,
    },

    source: {
      type: String,
      enum: ["email", "manual", "api"],
      default: "manual",
      index: true,
    },

    tkt_assigned_to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /**
     * Direct team assignment — stored on the ticket so automation rules
     * can assign_team without requiring the assignee to be set first.
     * Also used as a tiebreaker when batchResolveTeams() finds the agent
     * on no team (edge-case: agent removed from team after assignment).
     */
    tkt_team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
  },
  {
    collection: "tickets",
    versionKey: false,
    minimize: false,
    timestamps: false,
  },
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */
TicketSchema.index({
  cat_id: 1,
  tkt_status: 1,
});

TicketSchema.index(
  { tkt_number: 1 },
  {
    unique: true,
  },
);

TicketSchema.index({
  in_reply_to: 1,
  created_date: -1,
});

TicketSchema.index({
  eml_ticket_created_for: 1,
  created_date: -1,
});

TicketSchema.index({
  tkt_customer_name: 1,
});

TicketSchema.index({
  tkt_status: 1,
  update_date: -1,
});

TicketSchema.index({
  tkt_user: 1,
  created_date: -1,
});

TicketSchema.index(
  {
    message_id: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

TicketSchema.index(
  {
    email_fingerprint: 1,
  },
  {
    unique: true,
    sparse: true,
  },
);

TicketSchema.index({
  references: 1,
});

TicketSchema.index({
  cat_id: 1,
  sub_cat_id: 1,
  sub_sub_cat_id: 1,
});

/*
 * FIX: dashboard.service.ts's computeOpenTrend() runs countDocuments() and
 * aggregations filtered/grouped on resolved_date / closed_date on every
 * dashboard load (e.g. { resolved_date: { $lt: ..., $ne: null } }).
 * Neither field had an index, so these were full collection scans.
 * resolvedTrend/closedTrend in the same service also $match on these
 * fields directly.
 */
TicketSchema.index({ resolved_date: 1 });
TicketSchema.index({ closed_date: 1 });

/*
 * Supports the FRT/FCR analytics aggregation (response-time.service.ts),
 * which $matches on { first_response_at: { $ne: null } } and groups by
 * month for every ticket in the selected window.
 */
TicketSchema.index({ first_response_at: 1 });

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const Ticket: Model<TicketEntity> =
  mongoose.models.Ticket ||
  mongoose.model<TicketEntity>("Ticket", TicketSchema);

export default Ticket;