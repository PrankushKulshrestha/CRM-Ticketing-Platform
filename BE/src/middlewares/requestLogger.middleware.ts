
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import logger from "../config/logger";

/* -------------------------------------------------------------------------- */
/* Extended Request Type                                                      */
/* -------------------------------------------------------------------------- */

export interface LoggedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function createRequestId(): string {
  return crypto.randomUUID();
}

function getStartTime(): number {
  return Date.now();
}

/**
 * Safer header filtering (prevents sensitive leaks)
 */
function getSafeHeaders(headers: Request["headers"]) {
  return {
    "user-agent": headers["user-agent"],
    host: headers.host,
    origin: headers.origin,

    authorization: headers.authorization ? "[REDACTED]" : undefined,
    cookie: headers.cookie ? "[REDACTED]" : undefined,
    "set-cookie": headers["set-cookie"] ? "[REDACTED]" : undefined,
  };
}

function getLogLevel(statusCode: number): "info" | "warn" | "error" {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/* -------------------------------------------------------------------------- */
/* Middleware                                                                 */
/* -------------------------------------------------------------------------- */

export function requestLogger(
  req: LoggedRequest,
  res: Response,
  next: NextFunction
): void {
  const requestId = createRequestId();
  const startTime = getStartTime();
  const timestamp = new Date().toISOString();

  req.requestId = requestId;
  req.startTime = startTime;

  /* -------------------------- Correlation ID -------------------------- */

  res.setHeader("X-Request-Id", requestId);

  /* -------------------------- Request Start Log ----------------------- */

  logger.info("[HTTP_REQUEST_START]", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    headers: getSafeHeaders(req.headers),
    timestamp,
  });

  /* -------------------------- Response Finish ------------------------- */

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    const level = getLogLevel(res.statusCode);

    logger[level]("[HTTP_REQUEST_END]", {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      timestamp: new Date().toISOString(),
    });
  });

  /* -------------------------- Abort Handling (safe) ------------------- */

  if (typeof req.on === "function") {
    req.on("aborted", () => {
      const durationMs = Date.now() - startTime;

      logger.warn("[HTTP_REQUEST_ABORTED]", {
        requestId,
        method: req.method,
        url: req.originalUrl,
        durationMs,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      });
    });
  }

  next();
}

export default requestLogger;