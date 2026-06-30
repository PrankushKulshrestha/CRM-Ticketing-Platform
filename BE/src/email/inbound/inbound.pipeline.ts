
import type { ImapFlow } from "imapflow";
import logger from "@/config/logger";
import MailboxState from "@/models/mailboxState";
import { processInboundEmail } from "./inbound.worker";
import type { InboundEmail } from "../shared/email.types";

const MAILBOX            = "INBOX";
const CONCURRENCY        = 5;
const ENVELOPE_BATCH     = 200;
const BODY_FETCH_TIMEOUT = 8_000;

/* -------------------------------------------------------------------------- */
/* BODY EXTRACTION                                                            */
/* -------------------------------------------------------------------------- */

function extractBody(bodyParts?: Map<string, Buffer> | null): {
  text?: string;
  html?: string;
} {
  if (!bodyParts?.size) return {};

  const textBuf = bodyParts.get("TEXT") ?? bodyParts.get("text");
  if (textBuf) {
    const text = textBuf.toString("utf8").trim();
    return text ? { text } : {};
  }

  const firstBuf = bodyParts.values().next().value as Buffer | undefined;
  if (firstBuf) {
    const content = firstBuf.toString("utf8").trim();
    if (!content) return {};
    const isHtml = content.startsWith("<") || content.includes("<html");
    return isHtml ? { html: content } : { text: content };
  }

  return {};
}

/* -------------------------------------------------------------------------- */
/* SINGLE-MESSAGE BODY FETCH (TIMEOUT-GUARDED)                               */
/* -------------------------------------------------------------------------- */

async function fetchBodyForUid(
  client: ImapFlow,
  uid: number,
): Promise<{ text?: string; html?: string }> {
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), BODY_FETCH_TIMEOUT),
  );

  const fetch = (async () => {
    for await (const msg of client.fetch(
      { uid: String(uid) },
      { uid: true, bodyParts: ["TEXT", "1"] },
      { uid: true },
    )) {
      return extractBody(msg.bodyParts as Map<string, Buffer> | undefined);
    }
    return {};
  })();

  const result = await Promise.race([fetch, timeout]);

  if (result === null) {
    logger.warn("[INBOUND_BODY_FETCH_TIMEOUT]", { uid });
    return {};
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* CHECKPOINT                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * FIX: Persist last_uid after every processed batch so a server restart
 * resumes from the last completed batch, not from the beginning.
 */
async function checkpoint(
  batchMaxUid: number,
  processedCount: number,
): Promise<void> {
  await MailboxState.updateOne(
    { mailbox: MAILBOX },
    {
      $set:  { last_uid: batchMaxUid, last_sync_at: new Date() },
      $inc:  { total_processed: processedCount },
      $setOnInsert: { user: "system", status: "active" },
    },
    { upsert: true },
  );
}

/* -------------------------------------------------------------------------- */
/* PROCESS ONE ENVELOPE BATCH                                                 */
/* -------------------------------------------------------------------------- */

async function processEnvelopeBatch(
  client: ImapFlow,
  batchStart: number,
  batchEnd: number,
): Promise<{ processed: number; maxUid: number }> {
  const uidRange = `${batchStart}:${batchEnd}`;

  logger.info("[INBOUND_ENVELOPE_BATCH]", {
    uidRange,
    batchSize: batchEnd - batchStart + 1,
  });

  const emails: InboundEmail[] = [];

  for await (const msg of client.fetch(
    { uid: uidRange },
    { uid: true, envelope: true, internalDate: true },
  )) {
    const from    = msg.envelope?.from?.[0]?.address;
    const fromName = (msg.envelope?.from?.[0]?.name?.trim()) || from || "";
    const subject = msg.envelope?.subject;
    if (!msg?.uid || !from || !subject) continue;

    emails.push({
      uid:     msg.uid,
      from:    from.trim().toLowerCase(),
      fromName: fromName,
      subject: subject.trim(),
      text:    undefined,
      html:    undefined,
      date:
        msg.internalDate instanceof Date
          ? msg.internalDate
          : new Date((msg.internalDate as string | undefined) ?? Date.now()),
    });
  }

  if (!emails.length) return { processed: 0, maxUid: batchEnd };

  /* ── Body fetch + process concurrently ─────────────────────────────────── */

  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const i     = cursor++;
      const email = emails[i];
      if (!email) return;

      try {
        const body  = await fetchBodyForUid(client, email.uid);
        email.text  = body.text;
        email.html  = body.html;
        await processInboundEmail(email);
      } catch (err) {
        logger.error("[INBOUND_PROCESS_ERROR]", { uid: email.uid, err });
      }
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const maxUid = emails.reduce((m, e) => Math.max(m, e.uid), batchStart);

  return { processed: emails.length, maxUid };
}

/* -------------------------------------------------------------------------- */
/* SYNC                                                                       */
/* -------------------------------------------------------------------------- */

export async function triggerInboundSync(client: ImapFlow): Promise<void> {
  logger.info("[INBOUND_PIPELINE_START]");

  const lock = await client.getMailboxLock(MAILBOX);

  try {
    const state = await MailboxState.findOne({ mailbox: MAILBOX })
      .select({ last_uid: 1 })
      .lean<{ last_uid?: number }>();

    const lastUid = state?.last_uid ?? 0;

    /*
     * FIX: previously read maxAvailableUid from client.mailbox.uidNext —
     * but client.mailbox is a SNAPSHOT captured whenever the mailbox was
     * last actually SELECTed, not a live value. Since this client opens
     * the mailbox once via getMailboxLock() and keeps it open across every
     * poll, that snapshot never advances on its own; new mail arriving
     * after the snapshot was taken stayed permanently invisible to every
     * subsequent sync (matching exactly what was reported: nothing showed
     * up no matter how long the server ran). client.status() issues a real
     * IMAP STATUS command and returns the server's current uidNext on
     * every call, regardless of what's cached on the open connection.
     */
    const liveStatus = await client.status(MAILBOX, { uidNext: true });
    const maxAvailableUid: number =
      typeof liveStatus.uidNext === "number" ? liveStatus.uidNext - 1 : 999_999_999;

    const startUid = lastUid > 0 ? lastUid + 1 : 1;

    if (startUid > maxAvailableUid) {
      logger.info("[INBOUND_NO_EMAILS]");
      return;
    }

    logger.info("[INBOUND_PIPELINE_UID_RANGE]", {
      startUid,
      maxAvailableUid,
      gap: maxAvailableUid - startUid + 1,
    });

    let totalProcessed = 0;
    let batchStart     = startUid;

    while (batchStart <= maxAvailableUid) {
      const batchEnd = Math.min(batchStart + ENVELOPE_BATCH - 1, maxAvailableUid);

      const { processed, maxUid } = await processEnvelopeBatch(
        client,
        batchStart,
        batchEnd,
      );

      totalProcessed += processed;

      /*
       * FIX: Checkpoint after every batch.
       * If the server restarts, the next sync resumes from batchEnd
       * rather than replaying from the original lastUid.
       * We always advance to batchEnd (not just maxUid of found emails)
       * so gaps from deleted messages don't cause replays either.
       */
      await checkpoint(batchEnd, processed);

      batchStart = batchEnd + 1;
    }

    logger.info("[INBOUND_PIPELINE_DONE]", {
      totalProcessed,
      finalUid: maxAvailableUid,
    });
  } catch (err) {
    logger.error("[PIPELINE_FATAL]", err);
  } finally {
    lock.release();
  }
}