
import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/* -------------------------------------------------------------------------- */
/* SLA Constants (Single Source of Truth)                                     */
/* -------------------------------------------------------------------------- */

export const SLA_STATUSES = {
  ACTIVE: "active",
  BREACHED: "breached",
  PAUSED: "paused",
  RESOLVED: "resolved",
  CANCELLED: "cancelled",
  /** Final level (5) breached — escalation has nowhere further to go. */
  SLA_VIOLATED: "sla_violated",
} as const;

export type SLAStatus =
  (typeof SLA_STATUSES)[keyof typeof SLA_STATUSES];

export const SLA_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;

export type SLAPriority =
  (typeof SLA_PRIORITIES)[keyof typeof SLA_PRIORITIES];

/* -------------------------------------------------------------------------- */
/* Interface                                                                  */
/* -------------------------------------------------------------------------- */

export interface ISLA {
  ticketId: mongoose.Types.ObjectId;

  priority: SLAPriority;

  /**
   * Multi-level escalation tracker. 1 = the ticket's original priority-based
   * window; 2-5 = successive escalation budgets from SLAPolicy once the
   * prior level's resolution window breached without resolution.
   */
  currentLevel: 1 | 2 | 3 | 4 | 5;

  /** When the *current* level's clock started — resets on each escalation. */
  levelStartedAt: Date;

  responseTimeLimit: number;
  resolutionTimeLimit: number;

  responseTimeElapsed: number;
  resolutionTimeElapsed: number;

  isResponseBreached: boolean;
  isResolutionBreached: boolean;

  status: SLAStatus;

  startedAt: Date;
  responseDueAt: Date;
  resolutionDueAt: Date;

  respondedAt?: Date | null;
  resolvedAt?: Date | null;

  pausedAt?: Date | null;
  resumedAt?: Date | null;

  breachReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const SLASchema = new Schema<ISLA>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    priority: {
      type: String,
      enum: Object.values(SLA_PRIORITIES),
      required: true,
      index: true,
    },

    currentLevel: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: 1,
      index: true,
    },

    levelStartedAt: {
      type: Date,
      default: Date.now,
    },

    responseTimeLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    resolutionTimeLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    responseTimeElapsed: {
      type: Number,
      default: 0,
    },

    resolutionTimeElapsed: {
      type: Number,
      default: 0,
    },

    isResponseBreached: {
      type: Boolean,
      default: false,
      index: true,
    },

    isResolutionBreached: {
      type: Boolean,
      default: false,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(SLA_STATUSES),
      default: SLA_STATUSES.ACTIVE,
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    responseDueAt: {
      type: Date,
      required: true,
    },

    resolutionDueAt: {
      type: Date,
      required: true,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    pausedAt: {
      type: Date,
      default: null,
    },

    resumedAt: {
      type: Date,
      default: null,
    },

    breachReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    strict: true,
  },
);

/* -------------------------------------------------------------------------- */
/* Index Strategy                                                             */
/* -------------------------------------------------------------------------- */

SLASchema.index({ ticketId: 1 });

SLASchema.index({ status: 1, startedAt: -1 });

SLASchema.index({ priority: 1, status: 1 });

SLASchema.index({ isResponseBreached: 1, isResolutionBreached: 1 });

SLASchema.index({ responseDueAt: 1 });
SLASchema.index({ resolutionDueAt: 1 });

SLASchema.index({
  status: 1,
  isResolutionBreached: 1,
  resolutionDueAt: 1,
});

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export type SLADocument = HydratedDocument<ISLA>;

const SLAModel: Model<ISLA> =
  (mongoose.models.SLA as Model<ISLA>) ||
  mongoose.model<ISLA>("SLA", SLASchema);

export default SLAModel;