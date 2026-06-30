
import type { Request, Response } from "express";
import mongoose from "mongoose";

import logger from "../config/logger";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import { env } from "../config/env";

/* -------------------------------------------------------------------------- */

type DatabaseStatus =
  | "connected"
  | "connecting"
  | "disconnecting"
  | "disconnected";

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

interface SystemHealthData {
  application: {
    status: "healthy";
    uptime: number;
    timestamp: string;
    environment: string;
  };

  database: {
    status: DatabaseStatus;
    readyState: number;
  };

  server: {
    platform: NodeJS.Platform;
    architecture: string;
    nodeVersion: string;
    pid: number;
    memoryUsage: MemoryUsage;
  };
}

/* -------------------------------------------------------------------------- */

const now = () => new Date().toISOString();

const uptime = () => Number(process.uptime().toFixed(2));

const getDatabaseStatus = (): DatabaseStatus => {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
};

const getMemoryUsage = (): MemoryUsage => {
  const mem = process.memoryUsage();

  return {
    rss: mem.rss,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers,
  };
};

/* -------------------------------------------------------------------------- */

export const healthCheckController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const start = Date.now();

    logger.info("[HEALTH_CHECK_REQUEST]", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Server is healthy",
      data: {
        status: "healthy",
        uptime: uptime(),
        apiVersion: "v1",
      },
      timestamp: now(),
    });

    logger.info("[HEALTH_CHECK_SUCCESS]", {
      durationMs: Date.now() - start,
    });
  }
);

/* -------------------------------------------------------------------------- */

export const systemHealthController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const start = Date.now();

    const dbStatus = getDatabaseStatus();

    logger.info("[SYSTEM_HEALTH_REQUEST]", {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      databaseStatus: dbStatus,
    });

    const data: SystemHealthData = {
      application: {
        status: "healthy",
        uptime: uptime(),
        timestamp: now(),
        environment: env.app.env,
      },

      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
      },

      server: {
        platform: process.platform,
        architecture: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        memoryUsage: getMemoryUsage(),
      },
    };

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "System health fetched successfully",
      data,
      timestamp: now(),
    });

    logger.info("[SYSTEM_HEALTH_SUCCESS]", {
      durationMs: Date.now() - start,
      databaseStatus: dbStatus,
    });
  }
);