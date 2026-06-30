import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import { getSystemSettings, updateSystemSettings } from "../controllers/systemSettings.controller";

const router = Router();

// Any authenticated user can read settings (FE needs new_ticket_window_hours)
router.get("/", authenticate, getSystemSettings);

// Only admins can change settings
router.put(
  "/",
  authenticate,
  requirePermissions([PERMISSIONS.SETTINGS_MANAGE]),
  updateSystemSettings
);

export default router;
