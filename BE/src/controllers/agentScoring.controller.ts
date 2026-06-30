// src/controllers/agentScoring.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import * as ScoringService from "../services/agentScoring.service";

export const getScheme = asyncHandler(async (_req: Request, res: Response) => {
  const scheme = await ScoringService.getActiveScheme();
  res.status(HTTP_STATUS.OK).json({ success: true, data: scheme });
});

export const updateScheme = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const scheme = await ScoringService.updateScheme(
    req.body,
    user?.id as unknown as import("mongoose").Types.ObjectId
  );
  res.status(HTTP_STATUS.OK).json({ success: true, data: scheme });
});

export const getScores = asyncHandler(async (req: Request, res: Response) => {
  const { period } = req.query as { period?: "monthly" | "weekly" | "all_time" };
  const scores = await ScoringService.computeAgentScores(period);
  res.status(HTTP_STATUS.OK).json({ success: true, data: scores });
});
