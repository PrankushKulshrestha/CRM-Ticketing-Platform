
import mongoose, { Schema, type HydratedDocument, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Entity                                                                     */
/* -------------------------------------------------------------------------- */

export interface TeamEntity {
  name: string;
  description?: string;
  /** References User._id. Populated by TeamService into TeamMember shapes. */
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export type TeamDocument = HydratedDocument<TeamEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const TeamSchema = new Schema<TeamEntity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    members: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  {
    collection: "teams",
    timestamps: true,
    versionKey: false,
  },
);

TeamSchema.index({ name: 1 });

/* -------------------------------------------------------------------------- */
/* Model                                                                      */
/* -------------------------------------------------------------------------- */

export const Team: Model<TeamEntity> =
  (mongoose.models.Team as Model<TeamEntity>) ||
  mongoose.model<TeamEntity>("Team", TeamSchema);

export default Team;