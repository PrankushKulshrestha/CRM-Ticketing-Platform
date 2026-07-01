
import User from "../models/User";
import logger from "../config/logger";

import { ApiError } from "../utils/ApiError";
import { HTTP_STATUS } from "../constants/constants";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

import type { JwtPayload } from "../types/auth.types";

/* -------------------------------------------------------------------------- */
/* Types                                                                     */
/* -------------------------------------------------------------------------- */

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface LoginResponse {
  user: {
    userId: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const normalizeEmail = (email: string) =>
  email.trim().toLowerCase();

const buildJwtPayload = (user: any): JwtPayload => ({
  userId: user._id.toString(),
  email: user.email,
  role: user.role,
});

const buildUserResponse = (user: any) => ({
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
});

/* -------------------------------------------------------------------------- */
/* Service                                                                   */
/* -------------------------------------------------------------------------- */

class AuthService {
  /* ---------------------------------------------------------------------- */
  /* REGISTER                                                              */
  /* ---------------------------------------------------------------------- */

  async register(data: RegisterInput) {
    const email = normalizeEmail(data.email);

    const exists = await User.findOne({ email });

    if (exists) {
      throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists");
    }

    const user = await User.create({
      name: data.name,
      email,
      password: data.password,
      role: "agent",
    });

    logger.info("[AUTH_REGISTER]", { userId: user._id });

    return buildUserResponse(user);
  }

  /* ---------------------------------------------------------------------- */
  /* LOGIN                                                                 */
  /* ---------------------------------------------------------------------- */

  async login(email: string, password: string): Promise<LoginResponse> {
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid credentials");
    }

    const payload = buildJwtPayload(user);

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    logger.info("[AUTH_LOGIN]", { userId: user._id });

    return {
      user: buildUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* REFRESH TOKEN                                                        */
  /* ---------------------------------------------------------------------- */

  async refreshToken(token: string) {
    let decoded: JwtPayload;

    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid refresh token"
      );
    }

    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "User not found");
    }

    return {
      accessToken: generateAccessToken(buildJwtPayload(user)),
    };
  }

  /* ---------------------------------------------------------------------- */
  /* VALIDATE USER                                                        */
  /* ---------------------------------------------------------------------- */

  async validateUser(userId: string) {
    const user = await User.findById(userId);

    if (!user || !user.isActive) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        "User not authorized"
      );
    }

    return buildUserResponse(user);
  }
}

/* -------------------------------------------------------------------------- */
/* Singleton Export                                                         */
/* -------------------------------------------------------------------------- */

export const authService = new AuthService();
export default authService;