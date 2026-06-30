import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import { getScheme, updateScheme, getScores } from "../controllers/agentScoring.controller";

const router = Router();
const auth = [authenticate, requirePermissions([PERMISSIONS.ANALYTICS_READ])] as const;
const adminAuth = [authenticate, requirePermissions([PERMISSIONS.SETTINGS_MANAGE])] as const;

router.get("/scheme", ...auth, getScheme);
router.put("/scheme", ...adminAuth, updateScheme);
router.get("/scores", ...auth, getScores);

export default router;
