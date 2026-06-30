
import type { Request, Response, NextFunction } from "express";

import logger from "../config/logger";
import { HTTP_STATUS } from "../constants/constants";

type NotFoundErrorCode = "ROUTE_NOT_FOUND";

interface NotFoundResponse {
  success: false;
  message: string;
  errorCode: NotFoundErrorCode;
  path: string;
  method: string;
  timestamp: string;
}

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();

  const response: NotFoundResponse = {
    success: false,
    message: "Route not found",
    errorCode: "ROUTE_NOT_FOUND",
    path: req.originalUrl,
    method: req.method,
    timestamp,
  };

  logger.warn("[ROUTE_NOT_FOUND]", {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    timestamp,
  });

  res.status(HTTP_STATUS.NOT_FOUND).json(response);
}