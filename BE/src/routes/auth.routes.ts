
import { Router } from "express";

import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
} from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { rateLimitMiddleware } from "../middlewares/rateLimit.middleware";

// SECURITY: the global app-wide rate limiter (1000 req / 15 min) is far too
// loose to stop credential-stuffing / brute-force attempts against a single
// account. Apply a tight, endpoint-specific limit here.
const authRateLimit = rateLimitMiddleware({
  windowMs: 60 * 1000,
  maxRequests: 10,
  message: "Too many attempts, please try again in a minute.",
});

/*
|--------------------------------------------------------------------------
| Auth Router
|--------------------------------------------------------------------------
| Mounted at: /auth
|--------------------------------------------------------------------------
*/

const router = Router();

/*
|--------------------------------------------------------------------------
| Middleware Aliases
|--------------------------------------------------------------------------
*/

const requireAuth = authenticate;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  authRateLimit,
  validateRequest({ body: registerSchema }),
  register,
);

router.post(
  "/login",
  authRateLimit,
  validateRequest({ body: loginSchema }),
  login,
);

router.post("/refresh", refreshToken);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout", requireAuth, logout);

export default router;