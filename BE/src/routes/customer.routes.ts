
import { Router, RequestHandler } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import {
  requirePermissions,
  PERMISSIONS,
} from "../middlewares/rbac.middleware";

import {
  getCustomers,
  getCustomerById,
} from "../controllers/customer.controller";

const router = Router();

/* -------------------------------------------------------------------------- */
/* Middleware Chains                                                          */
/* -------------------------------------------------------------------------- */

const readAccess: RequestHandler[] = [
  authenticate,
  requirePermissions([PERMISSIONS.CUSTOMERS_READ]),
];

/* -------------------------------------------------------------------------- */
/* Routes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * GET /customers
 */
router.get("/", ...readAccess, getCustomers);

/**
 * GET /customers/:id
 */
router.get("/:id", ...readAccess, getCustomerById);

export default router;