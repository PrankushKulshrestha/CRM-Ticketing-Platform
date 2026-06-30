// src/controllers/emailTemplate.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import * as TemplateService from "../services/emailTemplate.service";
import { ApiError } from "../utils/ApiError";

export const listTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.query;
  const templates = await TemplateService.listTemplates(category as string);
  res.status(HTTP_STATUS.OK).json({ success: true, data: templates });
});

export const getTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await TemplateService.getTemplateById(req.params.id);
  if (!template) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Template not found");
  res.status(HTTP_STATUS.OK).json({ success: true, data: template });
});

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const template = await TemplateService.createTemplate(req.body, user?.id as unknown as import("mongoose").Types.ObjectId);
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: template });
});

export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const template = await TemplateService.updateTemplate(
    req.params.id,
    req.body,
    user?.id as unknown as import("mongoose").Types.ObjectId
  );
  if (!template) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Template not found");
  res.status(HTTP_STATUS.OK).json({ success: true, data: template });
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const t = await TemplateService.deleteTemplate(req.params.id);
  if (!t) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Template not found");
  res.status(HTTP_STATUS.OK).json({ success: true, message: "Template deleted" });
});

export const useTemplate = asyncHandler(async (req: Request, res: Response) => {
  const template = await TemplateService.getTemplateById(req.params.id);
  if (!template) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Template not found");
  await TemplateService.incrementUseCount(req.params.id);
  const context = req.body ?? {};
  const resolved = TemplateService.resolveTemplate(template, context);
  res.status(HTTP_STATUS.OK).json({ success: true, data: resolved });
});
