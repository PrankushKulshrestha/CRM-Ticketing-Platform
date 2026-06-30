
import type { ImapFlow } from "imapflow";
import logger from "@/config/logger";
import { triggerInboundSync } from "../inbound.pipeline";

/* -------------------------------------------------------------------------- */
/* STATE                                                                      */
/* -------------------------------------------------------------------------- */

let clientRef: ImapFlow | null = null;
let initialized = false;

/* -------------------------------------------------------------------------- */
/* INIT (CALLED AFTER INTERNAL IMAP CONNECTOR SETS CLIENT)                   */
/* -------------------------------------------------------------------------- */

export async function initImapService(): Promise<void> {
  if (initialized) return;

  logger.info("[IMAP:SERVICE:INIT]");

  if (!clientRef) {
    logger.error("[IMAP_SERVICE_INIT_FAILED_NO_CLIENT]");
    return;
  }

  initialized = true;

  try {
    await triggerInboundSync(clientRef);
    logger.info("[IMAP_SERVICE_INITIAL_SYNC_COMPLETE]");
  } catch (err) {
    logger.error("[IMAP_SERVICE_INITIAL_SYNC_FAILED]", err);
  }

  logger.info("[IMAP:SERVICE:READY]");
}

/* -------------------------------------------------------------------------- */
/* INTERNAL HOOK (USED BY SAFE IMAP CONNECTOR)                               */
/* -------------------------------------------------------------------------- */

export function setImapClient(client: ImapFlow): void {
  clientRef = client;
}

/* -------------------------------------------------------------------------- */
/* SYNC                                                                       */
/* -------------------------------------------------------------------------- */

export async function runImapSync(): Promise<void> {
  if (!clientRef) {
    logger.warn("[IMAP_SYNC_SKIPPED_NO_CLIENT]");
    return;
  }


  try {
    await triggerInboundSync(clientRef);
  } catch (err) {
    logger.error("[IMAP:SYNC:FAILED]", err);
  }
}

/* -------------------------------------------------------------------------- */
/* STOP                                                                       */
/* -------------------------------------------------------------------------- */

export async function stopImapService(): Promise<void> {
  if (!initialized) return;

  initialized = false;
  clientRef = null;

  logger.info("[IMAP_SERVICE_STOPPED]");
}

/* -------------------------------------------------------------------------- */
/* GETTERS                                                                    */
/* -------------------------------------------------------------------------- */

export function getImapClient(): ImapFlow | null {
  return clientRef;
}

export function isImapInitialized(): boolean {
  return initialized;
}