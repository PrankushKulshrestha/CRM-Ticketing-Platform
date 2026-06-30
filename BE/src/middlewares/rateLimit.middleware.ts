
import type { Request, Response, NextFunction } from "express";
import logger from "../config/logger";
import { HTTP_STATUS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

type Store = Map<string, RateLimitRecord>;

/* -------------------------------------------------------------------------- */
/* In-memory store                                                           */
/* -------------------------------------------------------------------------- */

const store: Store = new Map();

/* -------------------------------------------------------------------------- */
/* Defaults                                                                  */
/* -------------------------------------------------------------------------- */

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: "Too many requests, please try again later.",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getNow(): number {
  return Date.now();
}

/**
 * Prefer real client IP (proxy-safe)
 */
function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.toString().split(",")[0]) ||
    req.ip ||
    "unknown";

  return ip;
}

function isExpired(record: RateLimitRecord): boolean {
  return getNow() > record.resetTime;
}

function createRecord(windowMs: number): RateLimitRecord {
  return {
    count: 1,
    resetTime: getNow() + windowMs,
  };
}

/* -------------------------------------------------------------------------- */
/* Cleanup (prevents memory leak)                                            */
/* -------------------------------------------------------------------------- */

setInterval(() => {
  const now = getNow();

  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key);
    }
  }
}, 60 * 1000);

/* -------------------------------------------------------------------------- */
/* Response builder                                                          */
/* -------------------------------------------------------------------------- */

function buildRateLimitResponse(message: string, retryAfter: number) {
  return {
    success: false,
    message,
    errorCode: "RATE_LIMIT_EXCEEDED",
    retryAfter,
    timestamp: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Middleware Factory                                                       */
/* -------------------------------------------------------------------------- */

export function rateLimitMiddleware(options?: Partial<RateLimitOptions>) {
  const config: RateLimitOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getClientKey(req);
    const now = getNow();

    const record = store.get(key);

    /* ---------------------------------------------------------------------- */
    /* New window                                                            */
    /* ---------------------------------------------------------------------- */

    if (!record || isExpired(record)) {
      store.set(key, createRecord(config.windowMs));
      return next();
    }

    /* ---------------------------------------------------------------------- */
    /* Check BEFORE increment (clean logic)                                  */
    /* ---------------------------------------------------------------------- */

    if (record.count >= config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      logger.warn("[RATE_LIMIT_EXCEEDED]", {
        ip: key,
        path: req.originalUrl,
        method: req.method,
        count: record.count,
      });

      res
        .status(HTTP_STATUS.TOO_MANY_REQUESTS)
        .json(buildRateLimitResponse(config.message!, retryAfter));

      return;
    }

    /* ---------------------------------------------------------------------- */
    /* Increment safely                                                      */
    /* ---------------------------------------------------------------------- */

    record.count += 1;
    store.set(key, record);

    next();
  };
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                  */
/* -------------------------------------------------------------------------- */

export const strictRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

export const moderateRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

export const looseRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 300,
});

export default rateLimitMiddleware;