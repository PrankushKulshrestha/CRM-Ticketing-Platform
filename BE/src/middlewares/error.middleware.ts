
import type { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

import logger from "../config/logger";
import { env } from "../config/env";
import { HTTP_STATUS, type HttpStatusCode } from "../constants/constants";
import { ApiError } from "../utils/ApiError";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AppError extends Error {
  statusCode?: HttpStatusCode | number;
  errorCode?: string;
}

interface ErrorResponse {
  success: false;
  message: string;
  errorCode?: string;
  stack?: string;
}

/* -------------------------------------------------------------------------- */
/* Normalized Error                                                          */
/* -------------------------------------------------------------------------- */

type NormalizedError = {
  statusCode: number;
  message: string;
  errorCode?: string;
  stack?: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isHttpError(err: unknown): err is HttpError {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in (err as Record<string, unknown>)
  );
}

function normalizeError(err: unknown): NormalizedError {
  const fallback: NormalizedError = {
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Internal Server Error",
  };

  if (err instanceof ApiError) {
    return {
      statusCode: err.statusCode ?? fallback.statusCode,
      message: err.message || fallback.message,
      errorCode: err.code,
      stack: err.stack,
    };
  }

  if (isHttpError(err)) {
    const e = err as unknown as HttpError;

    return {
      statusCode: (e.statusCode as number) ?? fallback.statusCode,
      message: e.message,
      stack: e.stack,
    };
  }

  if (err instanceof Error) {
    const appError = err as AppError;

    return {
      statusCode:
        typeof appError.statusCode === "number"
          ? appError.statusCode
          : fallback.statusCode,

      message: appError.message || fallback.message,
      errorCode: appError.errorCode,
      stack: appError.stack,
    };
  }

  return fallback;
}

/* -------------------------------------------------------------------------- */
/* GLOBAL ERROR HANDLER                                                      */
/* -------------------------------------------------------------------------- */

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const normalized = normalizeError(err);

  logger.error("[GLOBAL_ERROR]", {
    message: normalized.message,
    errorCode: normalized.errorCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: normalized.stack,
    timestamp: new Date().toISOString(),
  });

  const response: ErrorResponse = {
    success: false,
    message: normalized.message,
    ...(normalized.errorCode ? { errorCode: normalized.errorCode } : {}),
    ...(env.app.env === "development" && normalized.stack
      ? { stack: normalized.stack }
      : {}),
  };

  res.status(normalized.statusCode).json(response);
}