
import logger from "@/config/logger";
import { ImapFlow } from "imapflow";
import { env } from "@/config/env";
import { setImapClient, initImapService, stopImapService, runImapSync } from "./inbound/imap/imap.service";
import { ImapListener } from "./inbound/imap/imap.listener";
import { SMTPService } from "./outbound/smtp/smtp.service";
import { flushOutboundQueue } from "./outbound/email.queue";

/* -------------------------------------------------------------------------- */
/* MODULE STATE                                                               */
/* -------------------------------------------------------------------------- */

let initialized = false;
let imapListener: ImapListener | null = null;
let imapFlowClient: ImapFlow | null = null;
let imapPollTimer: ReturnType<typeof setInterval> | null = null;

/*
 * FIX: the IMAP client connects and ImapListener attaches an `exists`
 * handler, but imapflow only delivers `exists` push events while the
 * connection is in IDLE mode — and nothing here ever calls client.idle().
 * Without it the connection just sits authenticated but passive, so new
 * mail was only ever picked up by the one-time initial sync at startup —
 * matching exactly what was reported (a restart was the only way to fetch
 * new email). Rather than manage IDLE's reconnect/timeout edge cases
 * directly, poll on an interval using the same runImapSync() path the
 * initial sync already uses — simple, reuses tested code, and bounds the
 * worst-case delay to POLL_INTERVAL_MS instead of "until restart".
 */
const IMAP_POLL_INTERVAL_MS = 60_000;

/* -------------------------------------------------------------------------- */
/* INIT EMAIL SYSTEM                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Call once at server startup (after DB is ready).
 *
 * FIX: Previously this polled for a client that was never created anywhere.
 * Now we create the ImapFlow client here, register it with imap.service,
 * then start the listener — correct deterministic order.
 */
export async function initEmailSystem(): Promise<void> {
  if (initialized) return;

  logger.info("[EMAIL_SYSTEM_INIT_START]");

  /* ── SMTP ─────────────────────────────────────────────────────────────── */
  try {
    await SMTPService.init();
  } catch (err) {
    // Non-fatal: inbound still works without outbound
    logger.error("[EMAIL_SYSTEM_SMTP_INIT_FAILED]", err);
  }

  /* ── IMAP ─────────────────────────────────────────────────────────────── */
  try {
    imapFlowClient = new ImapFlow({
      host: env.imap.host,
      port: env.imap.port,
      secure: env.imap.secure ?? true,
      auth: {
        user: env.imap.user,
        pass: env.imap.pass,
      },
      logger: false,
    });

    // Register client BEFORE initImapService reads it
    setImapClient(imapFlowClient);

    await imapFlowClient.connect();

    // Run initial sync for missed emails since last_uid
    await initImapService();

    // Start live listener for new mail events
    imapListener = new ImapListener(imapFlowClient);
    await imapListener.start();

    // Polling fallback — see IMAP_POLL_INTERVAL_MS comment above for why
    // this exists alongside the event listener.
    imapPollTimer = setInterval(() => {
      void runImapSync();
    }, IMAP_POLL_INTERVAL_MS);

    logger.info("[EMAIL_SYSTEM_IMAP_READY]");
  } catch (err) {
    logger.error("[EMAIL_SYSTEM_IMAP_INIT_FAILED]", err);
    // Non-fatal: outbound still works
  }

  initialized = true;
  logger.info("[EMAIL_SYSTEM_READY]");
}

/* -------------------------------------------------------------------------- */
/* GRACEFUL SHUTDOWN                                                          */
/* -------------------------------------------------------------------------- */

export async function shutdownEmailSystem(): Promise<void> {
  if (!initialized) return;

  logger.info("[EMAIL_SYSTEM_SHUTDOWN_START]");

  if (imapPollTimer) {
    clearInterval(imapPollTimer);
    imapPollTimer = null;
  }

  await imapListener?.shutdown().catch((err) =>
    logger.error("[EMAIL_LISTENER_SHUTDOWN_ERROR]", err),
  );

  await stopImapService();

  await flushOutboundQueue();

  if (imapFlowClient) {
    await imapFlowClient.logout().catch(() => {});
    imapFlowClient = null;
  }

  initialized = false;
  logger.info("[EMAIL_SYSTEM_SHUTDOWN_COMPLETE]");
}