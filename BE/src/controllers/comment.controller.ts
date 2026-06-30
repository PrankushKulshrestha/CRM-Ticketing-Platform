
import type { Response } from "express";

import { HTTP_STATUS } from "../constants/constants";
import { CommentService } from "../services/comment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";

import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

/* -------------------------------------------------------------------------- */
/* Response Builder — matches ticket.controller.ts's shape                   */
/* -------------------------------------------------------------------------- */

const buildResponse = <T>(message: string, data: T, meta?: unknown) => ({
  success: true,
  message,
  data,
  meta,
  timestamp: new Date().toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Controllers                                                               */
/* -------------------------------------------------------------------------- */

export const getTicketComments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const comments = await CommentService.getCommentsForTicket(
      req.params.id,
    );

    res.status(HTTP_STATUS.OK).json(
      buildResponse("Comments fetched successfully", comments),
    );
  },
);

export const addTicketComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    const { message, isInternal } = req.body as {
      message?: string;
      isInternal?: boolean;
    };

    if (!message || typeof message !== "string" || !message.trim()) {
      throw new ApiError(400, "message is required");
    }

    const comment = await CommentService.addComment(
      req.params.id,
      message,
      Boolean(isInternal),
      {
        userId: req.user.userId,
        role: req.user.role,
      },
    );

    res.status(HTTP_STATUS.CREATED).json(
      buildResponse("Comment added successfully", comment),
    );
  },
);
