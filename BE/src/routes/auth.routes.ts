
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
import { registerSchema } from "../validators/auth.validator";

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

router.post("/register", validateRequest({ body: registerSchema }), register);

router.post("/login", login);

router.post("/refresh", refreshToken);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

router.get("/me", requireAuth, getCurrentUser);

router.post("/logout", requireAuth, logout);

export default router;