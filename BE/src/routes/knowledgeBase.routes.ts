import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermissions, PERMISSIONS } from "../middlewares/rbac.middleware";
import {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  voteArticle,
  getCategories,
  getStats,
} from "../controllers/knowledgeBase.controller";

const router = Router();

const authMiddleware = [authenticate] as const;
const manageMiddleware = [authenticate, requirePermissions([PERMISSIONS.SETTINGS_MANAGE])] as const;

router.get("/", ...authMiddleware, listArticles);
router.get("/categories", ...authMiddleware, getCategories);
router.get("/stats", ...authMiddleware, getStats);
router.get("/:id", ...authMiddleware, getArticle);
router.post("/", ...authMiddleware, createArticle);
router.put("/:id", ...authMiddleware, updateArticle);
router.delete("/:id", ...manageMiddleware, deleteArticle);
router.post("/:id/vote", ...authMiddleware, voteArticle);

export default router;
