import mongoose from "mongoose";

import User, { type UserEntity } from "../models/User";
import logger from "../config/logger";

import { ApiError } from "../utils/ApiError";
import { HTTP_STATUS, USER_ROLES } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type UserStatus = "active" | "inactive" | "suspended";


export type SafeUser = Omit<UserEntity, "password" | "comparePassword">;

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;


/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

const assertObjectId = (id: string): void => {
  if (!isValidObjectId(id)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
  }
};

const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

/* -------------------------------------------------------------------------- */
/* Query Builder                                                             */
/* -------------------------------------------------------------------------- */

function buildUserQuery(filters: UserFilters): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (filters.role && filters.role !== "all") {
    query.role = filters.role;
  }

  if (typeof filters.isActive === "boolean") {
    query.isActive = filters.isActive;
  }

  if (filters.search?.trim()) {
    const regex = {
      $regex: filters.search.trim(),
      $options: "i",
    };

    query.$or = [
      { name: regex },
      { email: regex },
      { role: regex },
    ];
  }

  return query;
}

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export class UserService {
  /* ---------------------------------------------------------------------- */
  /* GET USERS                                                              */
  /* ---------------------------------------------------------------------- */

  static async getUsers(filters: UserFilters) {
    const page = Math.max(Number(filters.page) || DEFAULT_PAGE, 1);

    const limit = Math.min(
      Math.max(Number(filters.limit) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const skip = (page - 1) * limit;

    const query = buildUserQuery(filters);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------------------------------------------------------------------- */
  /* GET USER BY ID                                                        */
  /* ---------------------------------------------------------------------- */

  static async getUserById(id: string) {
    assertObjectId(id);

    const user = await User.findById(id)
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    return user;
  }

  /* ---------------------------------------------------------------------- */
  /* CREATE USER                                                           */
  /* ---------------------------------------------------------------------- */

  static async createUser(payload: {
    name: string;
    email: string;
    password: string;
    role?: string;
    isActive?: boolean;
  }): Promise<SafeUser> {
    const email = normalizeEmail(payload.email);

    const exists = await User.findOne({ email });

    if (exists) {
      throw new ApiError(
        HTTP_STATUS.CONFLICT,
        "User already exists"
      );
    }

    const user = await User.create({
      name: payload.name,
      email,
      password: payload.password, // hashed once by the pre-save hook
      role: payload.role ?? USER_ROLES.AGENT,
      isActive: payload.isActive ?? true,
    });

    logger.info("[USER_CREATED]", { userId: user._id });

    const { password, comparePassword, ...safe } = user.toObject();
    return safe as SafeUser;
  }

  /* ---------------------------------------------------------------------- */
  /* UPDATE USER                                                           */
  /* ---------------------------------------------------------------------- */

  static async updateUser(
    id: string,
    payload: Record<string, unknown>
  ) {
    assertObjectId(id);

    // prevent unsafe mutations
    const { password, email, ...safePayload } = payload;

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          ...safePayload,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.info("[USER_UPDATED]", { userId: id });

    return user;
  }

  /* ---------------------------------------------------------------------- */
  /* DELETE USER                                                           */
  /* ---------------------------------------------------------------------- */

  static async deleteUser(id: string) {
    assertObjectId(id);

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.warn("[USER_DELETED]", { userId: id });

    return true;
  }

  /* ---------------------------------------------------------------------- */
  /* CHANGE STATUS                                                         */
  /* ---------------------------------------------------------------------- */

  static async changeStatus(id: string, status: UserStatus) {
    assertObjectId(id);

    const allowedStatuses: UserStatus[] = [
      "active",
      "inactive",
      "suspended",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Invalid status"
      );
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.info("[USER_STATUS_CHANGED]", {
      userId: id,
      status,
    });

    return user;
  }
}