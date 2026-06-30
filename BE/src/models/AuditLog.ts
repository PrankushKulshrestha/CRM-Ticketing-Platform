
import mongoose, { Schema, type Model } from "mongoose";
import { AUDIT_ACTIONS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Unified Audit Action                                                      */
/* -------------------------------------------------------------------------- */

export type AuditAction =
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

/* -------------------------------------------------------------------------- */
/* Unified Audit Document                                                    */
/* -------------------------------------------------------------------------- */

export interface AuditLogDocument {
  userId?: mongoose.Types.ObjectId;

  action: AuditAction;

  entity: string; // Ticket, User, Email, etc.
  entityId: mongoose.Types.ObjectId;

  message?: string;

  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const AuditSchema = new Schema<AuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: Object.values(AUDIT_ACTIONS),
      index: true,
    },

    entity: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "audit_logs",
  },
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

AuditSchema.index({ entity: 1, entityId: 1, createdAt: -1 });
AuditSchema.index({ userId: 1, createdAt: -1 });
AuditSchema.index({ action: 1, createdAt: -1 });

export const AuditLog =
  (mongoose.models.AuditLog as Model<AuditLogDocument>) ||
  mongoose.model<AuditLogDocument>("AuditLog", AuditSchema);  