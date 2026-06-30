
import logger from "@/config/logger";
import type { ImapFlow } from "imapflow";
import { triggerInboundSync } from "../inbound.pipeline";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * FIX: ImapFlow fires an `exists` event for EVERY message in a bulk delivery.
 * Without debounce, 50 new emails = 50 concurrent syncs.
 * 1500ms covers typical burst windows before triggering a single sync.
 */
const DEBOUNCE_MS = 1500;

/* -------------------------------------------------------------------------- */
/* IMAP LISTENER                                                              */
/* -------------------------------------------------------------------------- */

export class ImapListener {
  private readonly client: ImapFlow;
  private isRunning = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(client: ImapFlow) {
    this.client = client;
  }

  /* -------------------------------------------------------------------------- */
  /* START                                                                     */
  /* -------------------------------------------------------------------------- */

  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    logger.info("[IMAP_LISTENER_STARTED]");
    this.attachHandlers();
  }

  /* -------------------------------------------------------------------------- */
  /* EVENT BINDING                                                            */
  /* -------------------------------------------------------------------------- */

  private attachHandlers(): void {
    this.client.on("exists", () => {
      this.scheduleSync();
    });

    this.client.on("expunge", (seq?: unknown) => {
      logger.info("[IMAP_EXPUNGE_EVENT]", { seq });
    });

    this.client.on("close", () => {
      this.isRunning = false;
      logger.warn("[IMAP_CONNECTION_CLOSED]");
    });

    this.client.on("error", (err: Error) => {
      logger.error("[IMAP_ERROR]", err);
    });
  }

  /* -------------------------------------------------------------------------- */
  /* DEBOUNCED SYNC                                                            */
  /* -------------------------------------------------------------------------- */

  private scheduleSync(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.onNewMail();
    }, DEBOUNCE_MS);
  }

  /* -------------------------------------------------------------------------- */
  /* SYNC HANDLER                                                              */
  /* -------------------------------------------------------------------------- */

  private async onNewMail(): Promise<void> {
    try {
      logger.info("[IMAP:SYNC:START]");
      await triggerInboundSync(this.client);
      logger.info("[IMAP:SYNC:COMPLETE]");
    } catch (err) {
      logger.error("[IMAP:SYNC:FAILED]", err);
    }
  }

  /* -------------------------------------------------------------------------- */
  /* SHUTDOWN                                                                 */
  /* -------------------------------------------------------------------------- */

  async shutdown(): Promise<void> {
    this.isRunning = false;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    try {
      await this.client.logout().catch(() => {});
    } catch (err) {
      logger.error("[IMAP_LOGOUT_ERROR]", err);
    }

    logger.info("[IMAP_LISTENER_STOPPED]");
  }
}