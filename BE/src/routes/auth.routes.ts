
import { Router } from "express";

import {
  // register, // disabled — see commented-out route below
  login,
  logout,
  getCurrentUser,
  refreshToken,
} from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validation.middleware";
import { loginSchema } from "../validators/auth.validator";
// import { registerSchema } from "../validators/auth.validator"; // disabled with route above
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

// SECURITY: Public self-registration is disabled. User accounts are now
// created exclusively by admins via the authenticated, RBAC-gated
// POST /users endpoint (requires USERS_CREATE permission). Route and
// controller are kept in place but commented out rather than deleted,
// in case a future product decision reintroduces public sign-up.
// router.post(
//   "/register",
//   authRateLimit,
//   validateRequest({ body: registerSchema }),
//   register,
// );

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