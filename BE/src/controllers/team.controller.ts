
import type { Request, Response } from "express";

import {
  HTTP_STATUS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "../constants/constants";
import { TeamService } from "../services/team.service";
import { asyncHandler } from "../utils/asyncHandler";

import type { TeamFilters } from "../types/team.types";

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

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v.length ? v : undefined;
};

/* -------------------------------------------------------------------------- */
/* Filter Builder                                                             */
/* -------------------------------------------------------------------------- */

const buildFilters = (query: Request["query"]): TeamFilters => ({
  page: toNumber(query.page, DEFAULT_PAGE),
  limit: Math.min(toNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  search: toOptionalString(query.search),
});

/* -------------------------------------------------------------------------- */
/* Controllers                                                                */
/* -------------------------------------------------------------------------- */

export const getTeams = asyncHandler(async (req: Request, res: Response) => {
  const filters = buildFilters(req.query);
  const result = await TeamService.getTeams(filters);

  res
    .status(HTTP_STATUS.OK)
    .json(
      buildResponse("Teams fetched successfully", result.data, result.meta),
    );
});

export const getTeamById = asyncHandler(
  async (req: Request, res: Response) => {
    const team = await TeamService.getTeamById(req.params.id);

    res
      .status(HTTP_STATUS.OK)
      .json(buildResponse("Team fetched successfully", team));
  },
);

export const createTeam = asyncHandler(
  async (req: Request, res: Response) => {
    const team = await TeamService.createTeam(req.body);

    res
      .status(HTTP_STATUS.CREATED)
      .json(buildResponse("Team created successfully", team));
  },
);

export const updateTeamMembers = asyncHandler(
  async (req: Request, res: Response) => {
    const team = await TeamService.updateTeamMembers(req.params.id, req.body);

    res
      .status(HTTP_STATUS.OK)
      .json(buildResponse("Team members updated successfully", team));
  },
);