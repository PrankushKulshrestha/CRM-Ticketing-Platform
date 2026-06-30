import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* System Settings (singleton document)                                       */
/* -------------------------------------------------------------------------- */
/*
 * Only one document ever exists (enforced by the SINGLETON_KEY).
 * Use SystemSettingsService.get() / SystemSettingsService.update() —
 * never instantiate directly.
 */

export interface ISystemSettings {
  /** Sentinel key so there is only ever one doc */
  _singleton: "global";

  /**
   * Tickets created within this many hours automatically receive
   * status = "new". Older tickets (or those explicitly given a
   * different status) are left as "open".
   * Admin-changeable. Default: 24.
   */
  new_ticket_window_hours: number;

  /** Any other future admin settings can be added here */
  updated_by?: mongoose.Types.ObjectId | null;
  updatedAt: Date;
  createdAt: Date;
}

export type SystemSettingsDocument = HydratedDocument<ISystemSettings>;

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    _singleton: { type: String, default: "global", immutable: true },
    new_ticket_window_hours: {
      type: Number,
      default: 24,
      min: 1,
      max: 8760, // 1 year max
    },
    updated_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    collection: "system_settings",
    timestamps: true,
    versionKey: false,
  }
);

// Enforce singleton
SystemSettingsSchema.index({ _singleton: 1 }, { unique: true });

export const SystemSettingsModel: Model<ISystemSettings> =
  (mongoose.models.SystemSettings as Model<ISystemSettings>) ||
  mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);

export default SystemSettingsModel;
