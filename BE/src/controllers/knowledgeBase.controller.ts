// src/controllers/knowledgeBase.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HTTP_STATUS } from "../constants/constants";
import * as KBService from "../services/knowledgeBase.service";
import { ApiError } from "../utils/ApiError";

export const listArticles = asyncHandler(async (req: Request, res: Response) => {
  const { query, category, article_type, tags, page, limit } = req.query;
  const result = await KBService.searchArticles({
    query: query as string,
    category: category as string,
    article_type: article_type as string,
    tags: tags ? String(tags).split(",") : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await KBService.getArticleById(req.params.id);
  if (!article) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Article not found");
  res.status(HTTP_STATUS.OK).json({ success: true, data: article });
});

export const createArticle = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const article = await KBService.createArticle({
    ...req.body,
    created_by: user?.id,
  });
  res.status(HTTP_STATUS.CREATED).json({ success: true, data: article });
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as Request & { user?: { id?: string } }).user;
  const article = await KBService.updateArticle(req.params.id, {
    ...req.body,
    updated_by: user?.id,
  });
  if (!article) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Article not found");
  res.status(HTTP_STATUS.OK).json({ success: true, data: article });
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = await KBService.deleteArticle(req.params.id);
  if (!article) throw new ApiError(HTTP_STATUS.NOT_FOUND, "Article not found");
  res.status(HTTP_STATUS.OK).json({ success: true, message: "Article deleted" });
});

export const voteArticle = asyncHandler(async (req: Request, res: Response) => {
  const { vote } = req.body as { vote: "helpful" | "not_helpful" };
  const article = await KBService.voteArticle(req.params.id, vote);
  res.status(HTTP_STATUS.OK).json({ success: true, data: article });
});

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await KBService.getCategories();
  res.status(HTTP_STATUS.OK).json({ success: true, data: categories });
});

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await KBService.getStats();
  res.status(HTTP_STATUS.OK).json({ success: true, data: stats });
});
