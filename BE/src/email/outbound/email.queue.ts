
import logger from "@/config/logger";
import { SMTPService } from "./smtp/smtp.service";
import type { SendEmailRequest } from "./smtp/smtp.service";

/* -------------------------------------------------------------------------- */
/*
 * FIX: This file previously contained type definitions copied from smtp.types.ts.
 * It should be an in-memory outbound email queue mirroring the inbound pattern.
 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                     */
/* -------------------------------------------------------------------------- */

const MAX_QUEUE_SIZE = 2000;

/* -------------------------------------------------------------------------- */
/* STATE                                                                      */
/* -------------------------------------------------------------------------- */

const queue: SendEmailRequest[] = [];
let processing = false;
let draining = false;

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export function enqueueEmail(job: SendEmailRequest): void {
  if (queue.length >= MAX_QUEUE_SIZE) {
    logger.warn("[OUTBOUND_QUEUE_OVERFLOW_DROP]", {
      to: job.to,
      size: queue.length,
    });
    return;
  }

  queue.push(job);
  logger.info("[OUTBOUND_QUEUE_ENQUEUED]", {
    to: job.to,
    subject: job.subject,
    size: queue.length,
  });

  void processQueue();
}

export function getOutboundQueueSize(): number {
  return queue.length;
}

export async function flushOutboundQueue(): Promise<void> {
  if (draining) return;
  draining = true;

  try {
    logger.info("[OUTBOUND_QUEUE_FLUSH_STARTED]");

    while (processing) {
      await new Promise((r) => setTimeout(r, 50));
    }

    await processQueue();
    logger.info("[OUTBOUND_QUEUE_FLUSH_COMPLETE]");
  } finally {
    draining = false;
  }
}

/* -------------------------------------------------------------------------- */
/* PROCESSOR                                                                  */
/* -------------------------------------------------------------------------- */

async function processQueue(): Promise<void> {
  if (processing || draining) return;
  processing = true;

  try {
    logger.info("[OUTBOUND_QUEUE_PROCESSOR_STARTED]");

    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) continue;

      try {
        await SMTPService.send(job);
        logger.info("[OUTBOUND_QUEUE_SENT]", {
          to: job.to,
          subject: job.subject,
        });
      } catch (err) {
        logger.error("[OUTBOUND_QUEUE_JOB_ERROR]", {
          to: job.to,
          subject: job.subject,
          err,
        });
        // Future: push to DLQ / retry with backoff
      }
    }
  } finally {
    processing = false;
    logger.info("[OUTBOUND_QUEUE_PROCESSOR_STOPPED]");
  }
}