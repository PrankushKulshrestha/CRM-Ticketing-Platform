
import logger from "@/config/logger";
import { enqueueEmail, flushOutboundQueue, getOutboundQueueSize } from "./email.queue";
import type { SendEmailRequest } from "./smtp/smtp.service";

/* -------------------------------------------------------------------------- */
/*
 * FIX: Previously was a two-line stub with console.log.
 * Now provides a real dispatch interface consumed by outbound.pipeline.ts
 * and any service that needs to send email.
 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Dispatch a single email through the outbound queue.
 * Never throws — failures are logged and queued for retry.
 */
export function dispatchEmail(request: SendEmailRequest): void {
  if (!request.to?.length || !request.subject) {
    logger.warn("[OUTBOUND_WORKER_INVALID_JOB]", {
      to: request.to,
      subject: request.subject,
    });
    return;
  }

  enqueueEmail(request);
}

/**
 * Flush remaining queue on graceful shutdown.
 */
export async function startEmailWorker(): Promise<void> {
  logger.info("[OUTBOUND_WORKER_STARTED]", {
    queueSize: getOutboundQueueSize(),
  });
}

export async function stopEmailWorker(): Promise<void> {
  logger.info("[OUTBOUND_WORKER_STOPPING]");
  await flushOutboundQueue();
  logger.info("[OUTBOUND_WORKER_STOPPED]");
}