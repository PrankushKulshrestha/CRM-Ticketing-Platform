
import type { Request, Response } from "express";

import logger from "../config/logger";
import User from "../models/User";

import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

import { HTTP_STATUS, USER_ROLES } from "../constants/constants";

/*
 * FIX (duplication reduction): AuthenticatedRequest was duplicated in
 * auth.types.ts as { user?: JwtPayload } — structurally identical to but
 * a separate type from the one in auth.middleware.ts ({ user?: AuthUser }),
 * which is what ticket.controller.ts and rbac.middleware.ts actually use.
 * Two different types with the same name across the codebase risks silent
 * mismatches. Now imported from the single canonical source.
 */
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

import type {
  JwtPayload,
  UserRole,
} from "../types/auth.types";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();

const validatePassword = (password: string): void => {
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      "Password must be at least 8 characters long",
    );
  }
};

const sanitizeUser = (user: any) => {
  if (!user) return null;

  // handles mongoose doc safely
  const obj = typeof user.toObject === "function" ? user.toObject() : user;

  const { password, __v, ...safe } = obj;
  return safe;
};

const buildJwtPayload = (user: any): JwtPayload => ({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
});

const generateTokens = (payload: JwtPayload) => ({
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
});

const buildAuthResponse = (user: any) => {
  const payload = buildJwtPayload(user);
  const tokens = generateTokens(payload);

  return {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

/* -------------------------------------------------------------------------- */
/* REGISTER                                                                   */
/* -------------------------------------------------------------------------- */

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Name, email and password are required",
      );
    }

    validatePassword(password);

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists");
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role ?? USER_ROLES.AGENT,
    });

    logger.info("[AUTH_REGISTER]", {
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "User registered successfully",
      ...buildAuthResponse(user),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* LOGIN                                                                      */
/* -------------------------------------------------------------------------- */

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Email and password are required",
      );
    }

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    // Bug fix: previously only /auth/refresh checked isActive, so a
    // deactivated user could still log in and obtain valid tokens — every
    // subsequent /auth/refresh would then fail with "Invalid session" in
    // an endless loop (login 200, refresh 401, repeat). Reject here too,
    // immediately, with a clear message instead of a silent token issue.
    if (user.isActive === false) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        "This account has been deactivated. Contact an administrator.",
      );
    }

    user.lastLoginAt = new Date();
    await user.save();

    logger.info("[AUTH_LOGIN]", {
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Login successful",
      ...buildAuthResponse(user),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* CURRENT USER                                                               */
/* -------------------------------------------------------------------------- */

export const getCurrentUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Unauthorized");
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found");
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      user: sanitizeUser(user),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* REFRESH TOKEN                                                             */
/* -------------------------------------------------------------------------- */

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.body?.refreshToken;

    if (!token || typeof token !== "string") {
      throw new ApiError(
        HTTP_STATUS.BAD_REQUEST,
        "Refresh token is required",
      );
    }

    let payload: JwtPayload;

    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid refresh token");
    }

    const user = await User.findById(payload.userId);

    if (!user || user.isActive === false) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid session");
    }

    logger.info("[AUTH_REFRESH]", {
      userId: user._id.toString(),
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Token refreshed successfully",
      ...buildAuthResponse(user),
    });
  },
);

/* -------------------------------------------------------------------------- */
/* LOGOUT                                                                    */
/* -------------------------------------------------------------------------- */

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    logger.info("[AUTH_LOGOUT]", {
      userId: req.user?.userId,
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Logout successful",
    });
  },
);