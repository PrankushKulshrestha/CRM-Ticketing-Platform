
import type { Response, NextFunction, Request } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

import { env } from "../config/env";
import logger from "../config/logger";
import { HTTP_STATUS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(" ");

  if (parts.length !== 2) return null;

  const [type, token] = parts;

  if (type !== "Bearer" || !token) return null;

  return token.trim();
}

function respondError(
  res: Response,
  statusCode: number,
  message: string,
  errorCode: string
): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
  });
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                */
/* -------------------------------------------------------------------------- */

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    respondError(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      "Authentication token missing",
      "AUTH_TOKEN_MISSING"
    );
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      env.jwt.accessSecret,
      { algorithms: ["HS256"] }
    ) as JwtPayload;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      respondError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Authentication token expired",
        "AUTH_TOKEN_EXPIRED"
      );
      return;
    }

    if (error instanceof JsonWebTokenError) {
      respondError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        "Invalid authentication token",
        "AUTH_TOKEN_INVALID"
      );
      return;
    }

    logger.error("[AUTH_MIDDLEWARE_ERROR]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    respondError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      "Authentication failed",
      "AUTH_INTERNAL_ERROR"
    );
  }
}

export default authenticate;