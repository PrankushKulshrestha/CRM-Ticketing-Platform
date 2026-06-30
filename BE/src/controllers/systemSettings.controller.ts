import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import { getSettings, updateSettings } from "../services/systemSettings.service";

export const getSystemSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await getSettings();
  res.status(HTTP_STATUS.OK).json({ success: true, data: settings });
});

export const updateSystemSettings = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const { new_ticket_window_hours } = req.body as { new_ticket_window_hours?: number };

  const settings = await updateSettings(
    { new_ticket_window_hours },
    user?.id as unknown as import("mongoose").Types.ObjectId
  );

  res.status(HTTP_STATUS.OK).json({ success: true, data: settings });
});
