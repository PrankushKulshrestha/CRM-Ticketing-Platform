// src/controllers/slaAnalytics.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import * as SLAAnalytics from "../services/slaAnalytics.service";
import type { TimeFrame } from "../services/slaAnalytics.service";

function parseFrame(q: unknown): TimeFrame {
  const valid = ["1h", "24h", "7d", "30d", "all", "custom"];
  return valid.includes(String(q)) ? (String(q) as TimeFrame) : "24h";
}

export const violations = asyncHandler(async (req: Request, res: Response) => {
  const { frame, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getSLAViolations(parseFrame(frame), start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const adherenceVsViolated = asyncHandler(async (req: Request, res: Response) => {
  const { frame, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getSLAAdherenceVsViolated(parseFrame(frame), start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const violationsByAgent = asyncHandler(async (req: Request, res: Response) => {
  const { frame, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getViolationsByAgent(parseFrame(frame), start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const violationsBySLA = asyncHandler(async (req: Request, res: Response) => {
  const { frame, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getViolationsBySLA(parseFrame(frame), start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const complianceByTeam = asyncHandler(async (req: Request, res: Response) => {
  const { frame, team, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getComplianceByTeam(parseFrame(frame), team, start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});

export const violationsByStatus = asyncHandler(async (req: Request, res: Response) => {
  const { frame, start, end } = req.query as Record<string, string>;
  const data = await SLAAnalytics.getViolationsByStatus(parseFrame(frame), start, end);
  res.status(HTTP_STATUS.OK).json({ success: true, data });
});
