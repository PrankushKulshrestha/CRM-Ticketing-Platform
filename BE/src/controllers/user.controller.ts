
import type { Request, Response } from "express";
import mongoose from "mongoose";

import User from "../models/User";
import logger from "../config/logger";

import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { getPagination } from "../utils/pagination";
import { HTTP_STATUS, USER_ROLES } from "../constants/constants";
import { ROLES } from "../middlewares/rbac.middleware";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UserStatus = "active" | "inactive" | "suspended";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

interface UserQuery {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  status?: string;
}

type SafeUser = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const now = () => new Date().toISOString();

const isValidObjectId = (id: string) =>
  mongoose.Types.ObjectId.isValid(id);

const assertValidId = (id: string) => {
  if (!isValidObjectId(id)) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid user ID");
  }
};

const normalizeEmail = (email: string) =>
  email.trim().toLowerCase();

const sanitizeUser = (user: any): SafeUser => {
  const obj = user?.toObject?.() ?? user;
  const { password, __v, ...safe } = obj;
  return safe;
};

const buildResponse = <T>(
  message: string,
  data: T,
  meta?: unknown
) => ({
  success: true,
  message,
  data,
  meta,
  timestamp: now(),
});

/* -------------------------------------------------------------------------- */
/* GET ASSIGNABLE USERS (ticket-assignment dropdown)                         */
/* -------------------------------------------------------------------------- */

/*
 * Deliberately separate from getUsers/USERS_READ: assigning a ticket to a
 * teammate is everyday ticket-handling, not user management, so it's
 * gated by TICKETS_READ instead — every role except none has that,
 * whereas USERS_READ is admin/manager only and would leave agents and
 * team leads unable to populate the assignee dropdown at all.
 *
 * Returns only the minimal fields the dropdown needs, for every role
 * capable of having a ticket assigned to them (everything except
 * "viewer", which is read-only).
 */
export const getAssignableUsers = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const ASSIGNABLE_ROLES = [
      ROLES.ADMIN,
      ROLES.MANAGER,
      ROLES.TEAM_LEAD,
      ROLES.AGENT,
    ];

    const users = await User.find({ role: { $in: ASSIGNABLE_ROLES } })
      .select({ name: 1, email: 1, role: 1 })
      .sort({ name: 1 })
      .lean();

    res
      .status(HTTP_STATUS.OK)
      .json(buildResponse("Assignable users fetched successfully", users));

    return;
  },
);

/* -------------------------------------------------------------------------- */
/* GET USERS                                                                  */
/* -------------------------------------------------------------------------- */

export const getUsers = asyncHandler(
  async (req: Request<{}, {}, {}, UserQuery>, res: Response): Promise<void> => {
    const { page, limit, skip } = getPagination(req.query, {
      defaultLimit: 10,
      maxLimit: 100,
    });

    const search = req.query.search?.trim();

    const filters: Record<string, unknown> = {};

    if (search) {
      const regex = { $regex: search, $options: "i" };
      filters.$or = [{ name: regex }, { email: regex }];
    }

    if (req.query.role && req.query.role !== "all") {
      filters.role = req.query.role;
    }

    if (req.query.status && req.query.status !== "all") {
      // Bug fix: schema has no "status" field, only "isActive: boolean".
      // Map the human-readable status query param to the real field so
      // filtering by Active/Inactive in the Users list actually works.
      if (req.query.status === "active") {
        filters.isActive = true;
      } else if (req.query.status === "inactive" || req.query.status === "suspended") {
        filters.isActive = false;
      }
    }

    const [users, total] = await Promise.all([
      User.find(filters)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(filters),
    ]);

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Users fetched successfully", users, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      })
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* GET USER BY ID                                                             */
/* -------------------------------------------------------------------------- */

export const getUserById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    assertValidId(req.params.id);

    const user = await User.findById(req.params.id)
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    res.status(HTTP_STATUS.OK).json(
      buildResponse("User fetched successfully", user)
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* CREATE USER                                                                */
/* -------------------------------------------------------------------------- */

export const createUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Name, email, and password are required"
      );
    }

    const normalizedEmail = normalizeEmail(email);

    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role ?? USER_ROLES.AGENT,
    });

    logger.info("[USER_CREATED]", { userId: user._id });

    res.status(HTTP_STATUS.CREATED).json(
      buildResponse("User created successfully", sanitizeUser(user))
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* UPDATE USER                                                                */
/* -------------------------------------------------------------------------- */

export const updateUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    assertValidId(req.params.id);

    const { password, role, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.info("[USER_UPDATED]", { userId: req.params.id });

    res.status(HTTP_STATUS.OK).json(
      buildResponse("User updated successfully", user)
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* DELETE USER                                                                */
/* -------------------------------------------------------------------------- */

export const deleteUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    assertValidId(req.params.id);

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.warn("[USER_DELETED]", { userId: req.params.id });

    res.status(HTTP_STATUS.OK).json(
      buildResponse("User deleted successfully", null)
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* CURRENT USER                                                               */
/* -------------------------------------------------------------------------- */

export const getCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const user = await User.findById(req.user.id)
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Current user fetched successfully", user)
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* UPDATE CURRENT USER                                                        */
/* -------------------------------------------------------------------------- */

export const updateCurrentUser = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user?.id) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const { password, role, ...safeBody } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: safeBody },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.info("[PROFILE_UPDATED]", { userId: req.user.id });

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Profile updated successfully", user)
    );

    return;
  }
);

/* -------------------------------------------------------------------------- */
/* CHANGE USER STATUS                                                         */
/* -------------------------------------------------------------------------- */

export const changeUserStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    assertValidId(req.params.id);

    const { status } = req.body as { status: UserStatus };

    const allowed: UserStatus[] = ["active", "inactive", "suspended"];

    if (!allowed.includes(status)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid status value");
    }

    // Bug fix: the schema has no "status" field — only "isActive: boolean".
    // Writing { $set: { status } } was a silent no-op: the document gained
    // an orphan "status" key (or nothing, depending on strict mode) while
    // isActive never changed, so "deactivated" users could still log in
    // and obtain tokens (which then failed downstream at /auth/refresh).
    // Map the human status to the real field here.
    const isActive = status === "active";

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    logger.info("[USER_STATUS_CHANGED]", {
      userId: req.params.id,
      status,
      isActive,
    });

    res.status(HTTP_STATUS.OK).json(
      buildResponse("User status updated successfully", user)
    );

    return;
  }
);