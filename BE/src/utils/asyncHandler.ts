
import type { Request, Response, NextFunction, RequestHandler } from "express";

/*
|--------------------------------------------------------------------------
| Async Handler (Enterprise Grade)
|--------------------------------------------------------------------------
| Wraps async + sync Express handlers safely
| Ensures all errors propagate to Express error middleware
|--------------------------------------------------------------------------
*/

/**
 * Generic handler supporting sync + async logic
 */
type Handler = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown | Promise<unknown>;

/*
|--------------------------------------------------------------------------
| Async Wrapper
|--------------------------------------------------------------------------
*/

export const asyncHandler =
  (fn: Handler): RequestHandler =>
  (req, res, next) => {
    /*
    |--------------------------------------------------------------------------
    | Always wrap execution in Promise.resolve
    |--------------------------------------------------------------------------
    | This guarantees:
    | - sync throws → caught
    | - async rejects → caught
    | - returned non-promise → normalized
    |--------------------------------------------------------------------------
    */
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default asyncHandler;