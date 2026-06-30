import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Email Template                                                              */
/* -------------------------------------------------------------------------- */
/*
 * Templates can include placeholders for ticket/customer fields.
 * Supported placeholders (inserted via "<" trigger in UI):
 *   {{ticket.tkt_number}}       — Ticket number
 *   {{ticket.email_subject}}    — Subject
 *   {{ticket.description}}      — Description
 *   {{ticket.tkt_status}}       — Status
 *   {{ticket.tkt_type}}         — Type
 *   {{ticket.tkt_custom1}}      — Custom field 1
 *   {{ticket.tkt_custom2}}      — Custom field 2
 *   {{ticket.tkt_custom3}}      — Custom field 3
 *   {{ticket.tkt_custom4}}      — Custom field 4
 *   {{ticket.tkt_custom5}}      — Custom field 5
 *   {{customer.name}}           — Customer name
 *   {{customer.email}}          — Customer email
 *   {{customer.mobile}}         — Customer mobile
 *   {{agent.name}}              — Assigned agent name
 *   {{agent.email}}             — Assigned agent email
 */

export interface IEmailTemplate {
  name: string;
  subject: string;
  /** HTML/Markdown body with {{placeholder}} syntax */
  body: string;
  /** Quick description of when to use this template */
  description?: string;
  category: "reply" | "resolution" | "escalation" | "follow-up" | "custom";
  is_active: boolean;
  created_by?: mongoose.Types.ObjectId | null;
  updated_by?: mongoose.Types.ObjectId | null;
  use_count: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailTemplateDocument = HydratedDocument<IEmailTemplate>;

const EmailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    subject: { type: String, required: true, trim: true, maxlength: 500 },
    body: { type: String, required: true },
    description: { type: String, trim: true, maxlength: 500 },
    category: {
      type: String,
      enum: ["reply", "resolution", "escalation", "follow-up", "custom"],
      default: "custom",
      index: true,
    },
    is_active: { type: Boolean, default: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    use_count: { type: Number, default: 0 },
  },
  {
    collection: "email_templates",
    timestamps: true,
    versionKey: false,
  }
);

EmailTemplateSchema.index({ name: 1 }, { unique: true });
EmailTemplateSchema.index({ category: 1, is_active: 1 });

const EmailTemplateModel: Model<IEmailTemplate> =
  (mongoose.models.EmailTemplate as Model<IEmailTemplate>) ||
  mongoose.model<IEmailTemplate>("EmailTemplate", EmailTemplateSchema);

export default EmailTemplateModel;
