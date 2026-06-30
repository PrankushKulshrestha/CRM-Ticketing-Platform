
import type { Request, Response } from "express";

import {
  HTTP_STATUS,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
} from "../constants/constants";
import { CustomerService } from "../services/customer.service";
import { asyncHandler } from "../utils/asyncHandler";

import type { CustomerFilters } from "../types/customer.types";

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

const buildFilters = (query: Request["query"]): CustomerFilters => ({
  page: toNumber(query.page, DEFAULT_PAGE),
  limit: Math.min(toNumber(query.limit, DEFAULT_LIMIT), MAX_LIMIT),
  search: toOptionalString(query.search),
});

/* -------------------------------------------------------------------------- */
/* Controllers                                                                */
/* -------------------------------------------------------------------------- */

export const getCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const filters = buildFilters(req.query);
    const result = await CustomerService.getCustomers(filters);

    res
      .status(HTTP_STATUS.OK)
      .json(
        buildResponse(
          "Customers fetched successfully",
          result.data,
          result.meta,
        ),
      );
  },
);

export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const customer = await CustomerService.getCustomerById(req.params.id);

    res
      .status(HTTP_STATUS.OK)
      .json(buildResponse("Customer fetched successfully", customer));
  },
);