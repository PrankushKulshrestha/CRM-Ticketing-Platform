import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate,
} from "../controllers/emailTemplate.controller";

const router = Router();
const auth = [authenticate] as const;
const manage = [authenticate, requirePermissions([PERMISSIONS.SETTINGS_MANAGE])] as const;

router.get("/", ...auth, listTemplates);
router.get("/:id", ...auth, getTemplate);
router.post("/", ...manage, createTemplate);
router.put("/:id", ...manage, updateTemplate);
router.delete("/:id", ...manage, deleteTemplate);
router.post("/:id/use", ...auth, useTemplate);

export default router;
