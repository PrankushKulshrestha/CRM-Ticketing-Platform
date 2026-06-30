
import jwt, { type SignOptions, type JwtPayload as JWTPayloadLib } from "jsonwebtoken";

import { env } from "../config/env";
import type { JwtPayload } from "../types/auth.types";
import { ApiError } from "../utils/ApiError";

/*
|--------------------------------------------------------------------------
| JWT Utilities (SINGLE SOURCE OF TRUTH)
|--------------------------------------------------------------------------
| All token creation + verification must pass through this module.
| Ensures consistent payload shape and secure defaults.
|--------------------------------------------------------------------------
*/

type TokenType = "access" | "refresh";

/*
|--------------------------------------------------------------------------
| Shared Sign Options
|--------------------------------------------------------------------------
*/

function getSignOptions(type: TokenType): SignOptions {
  return {
    expiresIn:
      type === "access"
        ? (env.jwt.accessExpiresIn as SignOptions["expiresIn"])
        : (env.jwt.refreshExpiresIn as SignOptions["expiresIn"]),

    // Strong security baseline (prevents algorithm confusion attacks)
    algorithm: "HS256",
  };
}

/*
|--------------------------------------------------------------------------
| Token Generators
|--------------------------------------------------------------------------
*/

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.accessSecret, getSignOptions("access"));
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwt.refreshSecret, getSignOptions("refresh"));
}

/*
|--------------------------------------------------------------------------
| Unified Verification (SAFE CORE)
|--------------------------------------------------------------------------
*/

function verifyToken<T extends JwtPayload>(
  token: string,
  secret: string
): T {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as JWTPayloadLib;

    return decoded as T;
  } catch (err: unknown){
    throw new ApiError({
      statusCode: 401,
      message: "Invalid or expired token",
      code: "JWT_INVALID",
      isOperational: true,
      details: err,
    });
  }
}

/*
|--------------------------------------------------------------------------
| Public Verifiers
|--------------------------------------------------------------------------
*/

export function verifyAccessToken(token: string): JwtPayload {
  return verifyToken<JwtPayload>(token, env.jwt.accessSecret);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyToken<JwtPayload>(token, env.jwt.refreshSecret);
}