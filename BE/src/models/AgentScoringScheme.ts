import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Agent Performance Scoring Scheme                                            */
/* -------------------------------------------------------------------------- */
/*
 * Admin-configurable scoring weights for agent performance metrics.
 * Score = sum of (metric_value * weight) capped/normalized per metric.
 *
 * Built-in metrics (always available):
 *   tickets_solved_month  — # tickets resolved in current month
 *   sla_adherence         — % of tickets resolved within SLA (0-100)
 *   mttr                  — Mean Time To Resolution (lower = better; inverted)
 *   csat                  — Customer Satisfaction avg (1-5)
 *
 * Admins can add more metrics via the `custom_metrics` array.
 */

export interface MetricDefinition {
  /** Internal key — used in scoring calculation */
  key: string;
  /** Human-readable label */
  label: string;
  /** Weight multiplier — how much this metric contributes to total score */
  weight: number;
  /** Whether higher values are better (true) or lower is better (false, e.g. MTTR) */
  higher_is_better: boolean;
  /** Max value to normalize against (e.g. 100 for %, 5 for CSAT, or custom cap) */
  max_value: number;
  /** Whether this metric is enabled */
  enabled: boolean;
  /** If true, this is a built-in metric that cannot be deleted */
  is_builtin: boolean;
}

export interface IAgentScoringScheme {
  /** Only one active scheme at a time */
  is_active: boolean;
  name: string;
  description?: string;
  metrics: MetricDefinition[];
  /** Score display: 0-100 percentage, or raw points */
  display_mode: "percentage" | "points";
  /** Period for calculation */
  period: "monthly" | "weekly" | "all_time";
  updated_by?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AgentScoringSchemeDocument = HydratedDocument<IAgentScoringScheme>;

const MetricDefinitionSchema = new Schema<MetricDefinition>(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    higher_is_better: { type: Boolean, default: true },
    max_value: { type: Number, required: true, min: 1 },
    enabled: { type: Boolean, default: true },
    is_builtin: { type: Boolean, default: false },
  },
  { _id: false }
);

const AgentScoringSchemeSchema = new Schema<IAgentScoringScheme>(
  {
    is_active: { type: Boolean, default: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    metrics: { type: [MetricDefinitionSchema], default: [] },
    display_mode: {
      type: String,
      enum: ["percentage", "points"],
      default: "percentage",
    },
    period: {
      type: String,
      enum: ["monthly", "weekly", "all_time"],
      default: "monthly",
    },
    updated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    collection: "agent_scoring_schemes",
    timestamps: true,
    versionKey: false,
  }
);

export const DEFAULT_SCORING_SCHEME: Omit<
  IAgentScoringScheme,
  "createdAt" | "updatedAt"
> = {
  is_active: true,
  name: "Default Scoring Scheme",
  description: "Standard agent performance scoring",
  display_mode: "percentage",
  period: "monthly",
  updated_by: null,
  metrics: [
    {
      key: "tickets_solved_month",
      label: "Tickets Solved (Month)",
      weight: 30,
      higher_is_better: true,
      max_value: 100,
      enabled: true,
      is_builtin: true,
    },
    {
      key: "sla_adherence",
      label: "SLA Adherence (%)",
      weight: 30,
      higher_is_better: true,
      max_value: 100,
      enabled: true,
      is_builtin: true,
    },
    {
      key: "mttr",
      label: "Mean Time To Resolution",
      weight: 20,
      higher_is_better: false,
      max_value: 480,
      enabled: true,
      is_builtin: true,
    },
    {
      key: "csat",
      label: "Customer Satisfaction (CSAT)",
      weight: 20,
      higher_is_better: true,
      max_value: 5,
      enabled: true,
      is_builtin: true,
    },
  ],
};

const AgentScoringSchemeModel: Model<IAgentScoringScheme> =
  (mongoose.models.AgentScoringScheme as Model<IAgentScoringScheme>) ||
  mongoose.model<IAgentScoringScheme>(
    "AgentScoringScheme",
    AgentScoringSchemeSchema
  );

export default AgentScoringSchemeModel;
