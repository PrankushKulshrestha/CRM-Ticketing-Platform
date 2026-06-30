
import logger from "@/config/logger";
import { processInboundEmail, type InboundEmailJob } from "./inbound.worker";

/* -------------------------------------------------------------------------- */
/* CONFIG                                                                    */
/* -------------------------------------------------------------------------- */

const MAX_QUEUE_SIZE = 5000; // safety cap (prevents memory explosion)

/* -------------------------------------------------------------------------- */
/* IN-MEMORY QUEUE STATE                                                    */
/* -------------------------------------------------------------------------- */

const queue: InboundEmailJob[] = [];

/**
 * True single-flight lock
 */
let processing = false;

/**
 * Prevent overlapping flush + ingestion
 */
let draining = false;

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Enqueue inbound email job
 */
export function enqueueInboundEmail(job: InboundEmailJob): void {
  if (queue.length >= MAX_QUEUE_SIZE) {
    logger.warn("[INBOUND_QUEUE_OVERFLOW_DROP]", {
      uid: job.uid,
      size: queue.length,
    });
    return;
  }

  queue.push(job);

  logger.info("[INBOUND_QUEUE_ENQUEUED]", {
    uid: job.uid,
    size: queue.length,
  });

  void processQueue();
}

/* -------------------------------------------------------------------------- */
/* CORE PROCESSOR                                                           */
/* -------------------------------------------------------------------------- */

async function processQueue(): Promise<void> {
  if (processing || draining) return;

  processing = true;

  try {
    logger.info("[INBOUND_QUEUE_PROCESSOR_STARTED]");

    while (queue.length > 0) {
      const job = queue.shift();
      if (!job) continue;

      try {
        await processInboundEmail(job);

        logger.info("[INBOUND_QUEUE_PROCESSED]", {
          uid: job.uid,
        });
      } catch (err) {
        logger.error("[INBOUND_QUEUE_JOB_ERROR]", {
          uid: job.uid,
          err,
        });

        /**
         * Future-safe hook:
         * could requeue or send to DLQ
         */
      }
    }
  } finally {
    processing = false;

    logger.info("[INBOUND_QUEUE_PROCESSOR_STOPPED]");
  }
}

/* -------------------------------------------------------------------------- */
/* MONITORING                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Current queue depth
 */
export function getInboundQueueSize(): number {
  return queue.length;
}

/* -------------------------------------------------------------------------- */
/* SAFE FLUSH (SHUTDOWN SAFE)                                                */
/* -------------------------------------------------------------------------- */

export async function flushInboundQueue(): Promise<void> {
  if (draining) return;

  draining = true;

  try {
    logger.info("[INBOUND_QUEUE_FLUSH_STARTED]");

    // wait for current processor to finish
    while (processing) {
      await new Promise((r) => setTimeout(r, 50));
    }

    // process remaining items deterministically
    await processQueue();

    logger.info("[INBOUND_QUEUE_FLUSH_COMPLETE]");
  } finally {
    draining = false;
  }
}