import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
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

router.get("/", ...auth, listTemplates);
router.get("/:id", ...auth, getTemplate);
router.post("/", ...auth, createTemplate);
router.put("/:id", ...auth, updateTemplate);
router.delete("/:id", ...auth, deleteTemplate);
router.post("/:id/use", ...auth, useTemplate);

export default router;
