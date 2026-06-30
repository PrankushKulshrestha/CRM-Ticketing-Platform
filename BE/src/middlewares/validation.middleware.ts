
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodError } from "zod";
import { HTTP_STATUS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type ValidationSource = "body" | "query" | "params";

interface ValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

interface ValidationErrorResponse {
  success: false;
  message: string;
  errorCode: "VALIDATION_ERROR";
  source: ValidationSource;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatZodError(
  error: ZodError,
  source: ValidationSource
): ValidationErrorResponse {
  return {
    success: false,
    message: "Validation failed",
    errorCode: "VALIDATION_ERROR",
    source,
    errors: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}

function sendError(
  res: Response,
  payload: ValidationErrorResponse
): void {
  res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json(payload);
}

/* -------------------------------------------------------------------------- */
/* Middleware Factory                                                         */
/* -------------------------------------------------------------------------- */

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      /* ----------------------------- BODY ----------------------------- */
      if (schema.body) {
        const result = schema.body.safeParse(req.body);

        if (!result.success) {
          return sendError(
            res,
            formatZodError(result.error, "body")
          );
        }

        req.body = result.data;
      }

      /* ----------------------------- QUERY ---------------------------- */
      if (schema.query) {
        const result = schema.query.safeParse(req.query);

        if (!result.success) {
          return sendError(
            res,
            formatZodError(result.error, "query")
          );
        }

        // safer assignment (avoid direct overwrite typing issues)
        Object.assign(req.query, result.data);
      }

      /* ----------------------------- PARAMS --------------------------- */
      if (schema.params) {
        const result = schema.params.safeParse(req.params);

        if (!result.success) {
          return sendError(
            res,
            formatZodError(result.error, "params")
          );
        }

        Object.assign(req.params, result.data);
      }

      next();
    } catch {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Validation middleware crashed unexpectedly",
        errorCode: "VALIDATION_INTERNAL_ERROR",
      });
    }
  };
}

/* -------------------------------------------------------------------------- */
/* Alias                                                                      */
/* -------------------------------------------------------------------------- */

export const validate = validateRequest;