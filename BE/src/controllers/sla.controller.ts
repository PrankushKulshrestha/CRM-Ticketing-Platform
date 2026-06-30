
import type { Request, Response } from "express";

import { HTTP_STATUS } from "../constants/constants";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import SLAPolicyModel, {
  DEFAULT_SLA_POLICY,
  type PriorityLimits,
} from "../models/SLAPolicy";
import { getActiveSLAPolicy, invalidatePolicyCache } from "../services/sla.service";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

/* -------------------------------------------------------------------------- */
/* Response Builder — matches the rest of the codebase's controller shape    */
/* -------------------------------------------------------------------------- */

const buildResponse = <T>(message: string, data: T) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString(),
});

const VALID_PRIORITY_KEYS = ["low", "medium", "high", "critical"];
const VALID_ESCALATION_LEVELS = [2, 3, 4, 5];

/* -------------------------------------------------------------------------- */
/* GET /sla/policy                                                           */
/* -------------------------------------------------------------------------- */

export const getSLAPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const policy = await getActiveSLAPolicy();

  res.status(HTTP_STATUS.OK).json(
    buildResponse("SLA policy fetched successfully", policy),
  );
});

/* -------------------------------------------------------------------------- */
/* PATCH /sla/policy — admin-only, gated by PERMISSIONS.TICKETS_SLA           */
/* -------------------------------------------------------------------------- */

interface UpdatePolicyBody {
  byPriority?: Record<string, PriorityLimits>;
  escalationMinutes?: Record<string, number>;
}

export const updateSLAPolicy = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const body = req.body as UpdatePolicyBody;

    if (body.byPriority) {
      for (const key of Object.keys(body.byPriority)) {
        if (!VALID_PRIORITY_KEYS.includes(key)) {
          throw new ApiError(400, `Invalid priority key: ${key}. Must be one of: ${VALID_PRIORITY_KEYS.join(", ")}`);
        }
        const limits = body.byPriority[key];
        if (
          !limits ||
          !Number.isFinite(limits.responseMinutes) ||
          !Number.isFinite(limits.resolutionMinutes) ||
          limits.responseMinutes < 1 ||
          limits.resolutionMinutes < 1
        ) {
          throw new ApiError(400, `Invalid time limits for priority: ${key}`);
        }
      }
    }

    if (body.escalationMinutes) {
      for (const key of Object.keys(body.escalationMinutes)) {
        if (!VALID_ESCALATION_LEVELS.includes(Number(key))) {
          throw new ApiError(400, `Invalid escalation level: ${key}`);
        }
        const minutes = body.escalationMinutes[key];
        if (!Number.isFinite(minutes) || minutes < 1) {
          throw new ApiError(400, `Invalid escalation minutes for level: ${key}`);
        }
      }
    }

    const current = await getActiveSLAPolicy();

    const merged = {
      byPriority: { ...current.byPriority, ...body.byPriority },
      escalationMinutes: { ...current.escalationMinutes, ...body.escalationMinutes },
    };

    await SLAPolicyModel.updateMany({ isActive: true }, { $set: { isActive: false } });

    const created = await SLAPolicyModel.create({
      isActive: true,
      byPriority: merged.byPriority ?? DEFAULT_SLA_POLICY.byPriority,
      escalationMinutes: merged.escalationMinutes ?? DEFAULT_SLA_POLICY.escalationMinutes,
      updatedBy: req.user?.userId,
    });

    invalidatePolicyCache();

    res.status(HTTP_STATUS.OK).json(
      buildResponse("SLA policy updated successfully", created),
    );
  },
);
