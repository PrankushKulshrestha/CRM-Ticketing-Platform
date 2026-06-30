
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";
import type { TicketPriority } from "./Ticket";

/* -------------------------------------------------------------------------- */
/* Multi-Level SLA Policy (Corporate-level, single config for the org)        */
/*                                                                            */
/* A ticket starts at Level 1 with the resolution/response limits for its    */
/* priority. If Level 1's resolution window elapses unresolved, the ticket   */
/* escalates to Level 2 (priority bumps up one notch, a fresh time budget    */
/* from `levelMinutes[2]` starts), and so on through Level 5. Level 5        */
/* breaching is terminal: the ticket is flagged SLA-violated.                */
/* -------------------------------------------------------------------------- */

export const SLA_LEVELS = [1, 2, 3, 4, 5] as const;
export type SLALevel = (typeof SLA_LEVELS)[number];

export interface PriorityLimits {
  responseMinutes: number;
  resolutionMinutes: number;
}

export interface ISLAPolicy {
  /** Singleton-style: one active org-wide policy document. */
  isActive: boolean;

  /** Level 1 limits, keyed by the ticket's classified/admin-set priority. */
  byPriority: Record<TicketPriority, PriorityLimits>;

  /**
   * Escalation budget (minutes) granted at each level above 1 once the
   * previous level's resolution window breaches. Level 1 isn't listed here
   * — it comes from byPriority above. Levels 2-5 use these flat budgets,
   * shared across all priorities, since by the time a ticket is escalating
   * the original priority distinction matters less than urgency-now.
   */
  escalationMinutes: Record<Exclude<SLALevel, 1>, number>;

  updatedBy?: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export type SLAPolicyDocument = HydratedDocument<ISLAPolicy>;

const PriorityLimitsSchema = new Schema<PriorityLimits>(
  {
    responseMinutes: { type: Number, required: true, min: 1 },
    resolutionMinutes: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const SLAPolicySchema = new Schema<ISLAPolicy>(
  {
    isActive: { type: Boolean, default: true, index: true },

    byPriority: {
      type: Map,
      of: PriorityLimitsSchema,
      required: true,
    },

    escalationMinutes: {
      type: Map,
      of: Number,
      required: true,
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    collection: "sla_policies",
    timestamps: true,
    versionKey: false,
  },
);

/* -------------------------------------------------------------------------- */
/* Standard default — the out-of-the-box policy until an admin edits it.      */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SLA_POLICY: Pick<
  ISLAPolicy,
  "byPriority" | "escalationMinutes"
> = {
  byPriority: {
    // Mongoose Map schemas require string keys — using string SLAPriority values here.
    // sla.service.ts maps color_code (1-4) → SLAPriority ("low"/"medium"/"high"/"critical")
    // so these string keys are what getPriorityLimits will look up.
    low:      { responseMinutes: 480,  resolutionMinutes: 2880 }, // 8h / 48h
    medium:   { responseMinutes: 240,  resolutionMinutes: 1440 }, // 4h / 24h
    high:     { responseMinutes: 60,   resolutionMinutes: 480  }, // 1h / 8h
    critical: { responseMinutes: 15,   resolutionMinutes: 120  }, // 15m / 2h
  } as unknown as Record<TicketPriority, PriorityLimits>,
  escalationMinutes: {
    2: 360, // 6h budget once escalated to level 2
    3: 240, // 4h at level 3
    4: 120, // 2h at level 4
    5: 60,  // 1h at level 5 — final chance before SLA_VIOLATED
  } as Record<Exclude<SLALevel, 1>, number>,
};

const SLAPolicyModel: Model<ISLAPolicy> =
  (mongoose.models.SLAPolicy as Model<ISLAPolicy>) ||
  mongoose.model<ISLAPolicy>("SLAPolicy", SLAPolicySchema);

export default SLAPolicyModel;
