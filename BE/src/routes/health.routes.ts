
import { Router } from "express";

const router = Router();

/*
|--------------------------------------------------------------------------
| Health Check - Root Endpoint
|--------------------------------------------------------------------------
*/

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is healthy",
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Number(process.uptime().toFixed(2)),
    environment: process.env.NODE_ENV ?? "development",
  });
});

/*
|--------------------------------------------------------------------------
| Future Observability Endpoints
|--------------------------------------------------------------------------
*/

// router.get("/ready", readinessCheck);
// router.get("/live", livenessCheck);
// router.get("/version", versionInfo);

export default router;