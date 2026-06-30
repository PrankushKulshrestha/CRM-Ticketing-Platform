
import mongoose, {
  Schema,
  type HydratedDocument,
  type Model,
  type CallbackError,
} from "mongoose";
import bcrypt from "bcryptjs";

/* -------------------------------------------------------------------------- */
/* User Roles                                                                 */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;

export type UserRole =
  (typeof USER_ROLES)[keyof typeof USER_ROLES];

/* -------------------------------------------------------------------------- */
/* Base Fields                                                                */
/* -------------------------------------------------------------------------- */

interface UserBase {
  name: string;
  email: string;
  password: string;

  role: UserRole;

  avatar?: string | null;

  isActive: boolean;

  lastLoginAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

/* -------------------------------------------------------------------------- */
/* Instance Methods                                                           */
/* -------------------------------------------------------------------------- */

interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/* -------------------------------------------------------------------------- */
/* Final User Type (Document + Methods)                                       */
/* -------------------------------------------------------------------------- */

export type UserEntity = UserBase & UserMethods;

export type UserDocument = HydratedDocument<UserEntity>;

export type UserModel = Model<UserEntity>;

/* -------------------------------------------------------------------------- */
/* Schema                                                                     */
/* -------------------------------------------------------------------------- */

const UserSchema = new Schema<UserEntity>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.AGENT,
      index: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "users",
  }
);

/* -------------------------------------------------------------------------- */
/* Pre-save Hook                                                             */
/* -------------------------------------------------------------------------- */

UserSchema.pre<UserDocument>("save", async function (next) {
  try {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }

    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    return next();
  } catch (error) {
    return next(error as CallbackError);
  }
});

/* -------------------------------------------------------------------------- */
/* Instance Methods                                                          */
/* -------------------------------------------------------------------------- */

UserSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/* -------------------------------------------------------------------------- */
/* JSON Transform                                                            */
/* -------------------------------------------------------------------------- */

UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,

  transform: (_doc, ret: any) => {
    ret.id = ret._id?.toString();

    delete ret._id;
    delete ret.password;

    return ret;
  },
});

/* -------------------------------------------------------------------------- */
/* Model                                                                     */
/* -------------------------------------------------------------------------- */

export const User: UserModel =
  (mongoose.models.User as UserModel) ||
  mongoose.model<UserEntity>("User", UserSchema);

export default User;