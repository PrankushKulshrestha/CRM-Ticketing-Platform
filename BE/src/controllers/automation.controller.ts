
import type { Request, Response } from "express";

import {
  HTTP_STATUS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "../constants/constants";
import { AutomationService } from "../services/automation.service";
import { asyncHandler } from "../utils/asyncHandler";

import type { AutomationFilters } from "../types/automation.types";

/* -------------------------------------------------------------------------- */
/* Response Builder                                                           */
/* -------------------------------------------------------------------------- */

const buildResponse = <T>(message: string, data: T, meta?: unknown) => ({
  success: true,
  message,
  data,
  meta,
  timestamp: new Date().toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Safe Parsers                                                               */
/* -------------------------------------------------------------------------- */

const toNumber = (value: unknown, fallback: number): number => {
  if (typeof value !== "string") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

/* -------------------------------------------------------------------------- */
/* Filter Builder                                                             */
/* -------------------------------------------------------------------------- */

const buildFilters = (query: Request["query"]): AutomationFilters => ({
  page: toNumber(query.page, DEFAULT_PAGE),
  limit: Math.min(toNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  enabled: toOptionalBoolean(query.enabled),
});

/* -------------------------------------------------------------------------- */
/* Controllers                                                                */
/* -------------------------------------------------------------------------- */

export const getRules = asyncHandler(async (req: Request, res: Response) => {
  const filters = buildFilters(req.query);
  const result = await AutomationService.getRules(filters);

  res
    .status(HTTP_STATUS.OK)
    .json(
      buildResponse(
        "Automation rules fetched successfully",
        result.data,
        result.meta,
      ),
    );
});

export const toggleRule = asyncHandler(
  async (req: Request, res: Response) => {
    const { enabled } = req.body as { enabled: boolean };
    const rule = await AutomationService.toggleRule(req.params.id, enabled);

    res
      .status(HTTP_STATUS.OK)
      .json(buildResponse("Automation rule updated successfully", rule));
  },
);

export const createRule = asyncHandler(
  async (req: Request, res: Response) => {
    const rule = await AutomationService.createRule(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(buildResponse("Automation rule created successfully", rule));
  },
);