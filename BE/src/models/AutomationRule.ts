
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Trigger / Action enums                                                     */
/* -------------------------------------------------------------------------- */

export const AUTOMATION_TRIGGERS = [
  "ticket_created",
  "ticket_updated",
  "ticket_assigned",
  "sla_breached",
  "status_changed",
] as const;

export type AutomationTrigger = (typeof AUTOMATION_TRIGGERS)[number];

export const AUTOMATION_ACTION_TYPES = [
  "assign_agent",
  "assign_team",
  "set_priority",
  "send_notification",
  "change_status",
  "add_tag",
] as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPES)[number];

export interface AutomationActionEntity {
  type: AutomationActionType;
  value: string;
}

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/* -------------------------------------------------------------------------- */

export interface AutomationRuleEntity {
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  /** Simple key/value match conditions, e.g. { cat_id: "billing" } */
  conditions: Record<string, string>;
  actions: AutomationActionEntity[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AutomationRuleDocument = HydratedDocument<AutomationRuleEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const AutomationActionSchema = new Schema<AutomationActionEntity>(
  {
    type: { type: String, enum: AUTOMATION_ACTION_TYPES, required: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const AutomationRuleSchema = new Schema<AutomationRuleEntity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    trigger: {
      type: String,
      enum: AUTOMATION_TRIGGERS,
      required: true,
      index: true,
    },

    conditions: {
      type: Schema.Types.Mixed,
      default: {},
    },

    actions: {
      type: [AutomationActionSchema],
      default: [],
    },

    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    collection: "automation_rules",
    timestamps: true,
    versionKey: false,
  },
);

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const AutomationRule: Model<AutomationRuleEntity> =
  (mongoose.models.AutomationRule as Model<AutomationRuleEntity>) ||
  mongoose.model<AutomationRuleEntity>("AutomationRule", AutomationRuleSchema);

export default AutomationRule;