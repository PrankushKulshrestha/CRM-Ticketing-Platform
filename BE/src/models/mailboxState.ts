
import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
} from "mongoose";

/* -------------------------------------------------------------------------- */
/* Mailbox Status                                                             */
/* -------------------------------------------------------------------------- */

export const MAILBOX_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  ERROR: "error",
} as const;

export type MailboxStatus =
  (typeof MAILBOX_STATUS)[keyof typeof MAILBOX_STATUS];

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/* -------------------------------------------------------------------------- */

export interface MailboxStateEntity {
  /**
   * Tenant identifier. Defaults to "system" for single-tenant / pipeline use.
   */
  user: string;

  mailbox: string;

  /**
   * Highest successfully processed IMAP UID.
   */
  last_uid: number;

  /**
   * IMAP UIDVALIDITY value.
   * Used to detect mailbox resets.
   */
  uid_validity?: number;

  status: MailboxStatus;

  /**
   * Last successful synchronization.
   */
  last_sync_at: Date;

  /**
   * Running count of processed emails.
   */
  total_processed?: number;

  /**
   * Most recent ingestion error.
   */
  last_error?: string;

  last_error_at?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type MailboxStateDocument =
  HydratedDocument<MailboxStateEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const MailboxStateSchema =
  new Schema<MailboxStateEntity>(
    {
      user: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        immutable: true,
        default: "system",
      },

      mailbox: {
        type: String,
        required: true,
        trim: true,
        immutable: true,
      },

      last_uid: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
      },

      uid_validity: {
        type: Number,
        immutable: true,
        index: true,
      },

      status: {
        type: String,
        enum: Object.values(MAILBOX_STATUS),
        default: MAILBOX_STATUS.ACTIVE,
        index: true,
      },

      last_sync_at: {
        type: Date,
        default: Date.now,
        index: true,
      },

      total_processed: {
        type: Number,
        default: 0,
        min: 0,
      },

      last_error: {
        type: String,
        maxlength: 5000,
      },

      last_error_at: {
        type: Date,
        default: null,
      },
    },
    {
      collection: "mailbox_states",
      timestamps: true,
      versionKey: false,
      minimize: false,
      strict: true,
    },
  );

/* -------------------------------------------------------------------------- */
/* Indexes                                                                    */
/* -------------------------------------------------------------------------- */

MailboxStateSchema.index(
  {
    user: 1,
    mailbox: 1,
  },
  {
    unique: true,
    name: "uq_mailbox_user",
  },
);

MailboxStateSchema.index({
  last_sync_at: -1,
});

MailboxStateSchema.index({
  status: 1,
  last_sync_at: -1,
});

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const MailboxState: Model<MailboxStateEntity> =
  mongoose.models.MailboxState ||
  mongoose.model<MailboxStateEntity>(
    "MailboxState",
    MailboxStateSchema,
  );

export default MailboxState;