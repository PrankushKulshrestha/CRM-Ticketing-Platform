import http from "http";
import app from "./app";

import { env } from "./config/env";
import { connectDB, disconnectDB } from "./config/db";
import logger from "./config/logger";

import { initSocket, shutdownSocket } from "./socket";

/* -------------------------------------------------------------------------- */
/* EMAIL SYSTEM (SINGLE ENTRY POINT)                                          */
/* -------------------------------------------------------------------------- */

import { initEmailSystem, shutdownEmailSystem } from "./email";

/* -------------------------------------------------------------------------- */
/* OUTBOUND EMAIL WORKER                                                      */
/* -------------------------------------------------------------------------- */

import {
  startEmailWorker,
  stopEmailWorker,
} from "./email/outbound/email.worker";

/* -------------------------------------------------------------------------- */
/* HTTP SERVER                                                                */
/* -------------------------------------------------------------------------- */

const server = http.createServer(app);

/* -------------------------------------------------------------------------- */
/* SOCKET INIT                                                                */
/* -------------------------------------------------------------------------- */

initSocket(server);

/* -------------------------------------------------------------------------- */
/* UTIL                                                                       */
/* -------------------------------------------------------------------------- */

function logBanner(title: string, lines: string[]): void {
  console.log(`
==================================================
${title}
==================================================
${lines.join("\n")}
==================================================
  `);
}

/* -------------------------------------------------------------------------- */
/* STATE                                                                      */
/* -------------------------------------------------------------------------- */

let shuttingDown = false;

/* -------------------------------------------------------------------------- */
/* SERVER STOP                                                                */
/* -------------------------------------------------------------------------- */

function closeHttpServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/* -------------------------------------------------------------------------- */
/* BOOTSTRAP                                                                  */
/* -------------------------------------------------------------------------- */

async function bootstrap(): Promise<void> {
  try {
    /* 1. DB */
    await connectDB();

    /* 1b. REPAIR: ensure all users have isActive=true unless explicitly false */
    try {
      const { User } = await import("./models/User");
      const repaired = await User.updateMany(
        { isActive: { $in: [null, undefined] } },
        { $set: { isActive: true } },
      );
      if (repaired.modifiedCount > 0) {
        logger.info(`[STARTUP_REPAIR] Set isActive=true on ${repaired.modifiedCount} user(s) that had null/missing isActive`);
      }
    } catch (repairErr) {
      logger.warn("[STARTUP_REPAIR_FAILED]", { repairErr });
    }

    /* 1c. REPAIR: ensure valid active SLA policy exists with correct string-keyed byPriority */
    try {
      const SLAPolicyModel = (await import("./models/SLAPolicy")).default;
      const { DEFAULT_SLA_POLICY } = await import("./models/SLAPolicy");
      const existingPolicy = await SLAPolicyModel.findOne({ isActive: true }).lean();
      if (!existingPolicy) {
        // Create a fresh default policy — DEFAULT_SLA_POLICY now uses string keys
        await SLAPolicyModel.create({ isActive: true, ...DEFAULT_SLA_POLICY });
        logger.info("[STARTUP_REPAIR] Created default SLA policy");
      } else {
        // Verify byPriority Map has string keys (low/medium/high/critical)
        const bp = existingPolicy.byPriority as unknown as Map<string, unknown> | Record<string, unknown>;
        const hasMedium = bp instanceof Map ? bp.has("medium") : Boolean((bp as Record<string,unknown>)["medium"]);
        if (!hasMedium) {
          // Policy is corrupted (numeric keys) — replace with string-keyed version
          await SLAPolicyModel.updateOne(
            { _id: existingPolicy._id },
            { $set: { byPriority: DEFAULT_SLA_POLICY.byPriority, escalationMinutes: DEFAULT_SLA_POLICY.escalationMinutes } },
          );
          logger.info("[STARTUP_REPAIR] Repaired SLA policy byPriority to use string keys");
        }
      }
    } catch (slaRepairErr) {
      logger.warn("[STARTUP_SLA_POLICY_REPAIR_FAILED]", { slaRepairErr });
    }

    /* 2. OUTBOUND EMAIL WORKER */
    await startEmailWorker();

    /* 3. EMAIL SYSTEM (IMAP + PIPELINE INIT) */
    await initEmailSystem();

    /* 4. HTTP SERVER */
    server.listen(env.app.port, () => {
      logBanner("CRM HELPDESK SERVER STARTED", [
        `Environment : ${env.app.env}`,
        `Port        : ${env.app.port}`,
        `API Prefix  : ${env.app.apiPrefix}`,
        `Client URL  : ${env.app.clientUrl}`,
        `Socket      : enabled`,
        `DB          : connected`,
        `EMAIL       : IMAP + pipeline active`,
        `WORKERS     : outbound email worker running`,
      ]);
    });

    server.on("error", (err) => {
      console.error("[SERVER_ERROR]", err);
    });
  } catch (err) {
    console.error("[BOOTSTRAP_FAILED]", err);
    process.exit(1);
  }
}

/* -------------------------------------------------------------------------- */
/* SHUTDOWN                                                                   */
/* -------------------------------------------------------------------------- */

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logBanner(`${signal} RECEIVED`, ["Shutting down gracefully"]);

  const forceExit = setTimeout(() => {
    console.error("[FORCED_EXIT]");
    process.exit(1);
  }, 10_000);

  try {
    /* 1. HTTP */
    await closeHttpServer();

    /* 2. SOCKET */
    shutdownSocket();

    /* 3. EMAIL SYSTEM (IMAP listener + pipeline) */
    await shutdownEmailSystem();

    /* 4. EMAIL WORKER (flush outbound queue) */
    await stopEmailWorker();

    /* 5. DB */
    await disconnectDB();

    clearTimeout(forceExit);

    logBanner("SHUTDOWN COMPLETE", ["All systems stopped cleanly"]);

    process.exit(0);
  } catch (err) {
    console.error("[SHUTDOWN_ERROR]", err);
    process.exit(1);
  }
}

/* -------------------------------------------------------------------------- */
/* SIGNALS                                                                    */
/* -------------------------------------------------------------------------- */

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

/* -------------------------------------------------------------------------- */
/* START                                                                      */
/* -------------------------------------------------------------------------- */

void bootstrap();