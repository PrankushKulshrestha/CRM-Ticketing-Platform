
import type { InboundEmail } from "./email.types";
import type { NormalizedEmail } from "../inbound/imap/imap.types";
import { buildEmailFingerprint } from "./email.utils";
import { PRIORITY, type TicketPriority } from "@/constants/constants";
import { TICKET_PRIORITY } from "@/models/Ticket";

/* -------------------------------------------------------------------------- */
/* FIX: File was empty                                                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* IMAP → INBOUND JOB                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Maps an ImapFlow NormalizedEmail (from imap.client) to the InboundEmail
 * contract used by inbound.worker and the pipeline.
 */
export function normalizedEmailToInbound(msg: NormalizedEmail): InboundEmail {
  return {
    uid: msg.uid,
    from: msg.from,
    fromName: msg.fromName,
    subject: msg.subject,
    text: msg.body,
    html: undefined,
    date: msg.date,
  };
}

/* -------------------------------------------------------------------------- */
/* INBOUND EMAIL → FINGERPRINT INPUT                                         */
/* -------------------------------------------------------------------------- */

export function inboundEmailToFingerprintInput(
  email: Pick<InboundEmail, "from" | "subject" | "date">,
) {
  return {
    from: email.from,
    subject: email.subject,
    date: email.date,
  };
}

/* -------------------------------------------------------------------------- */
/* INBOUND EMAIL → TICKET CREATE PAYLOAD                                     */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* STRING PRIORITY -> NUMERIC color_code                                     */
/* -------------------------------------------------------------------------- */

/*
 * FIX: this previously wrote opts.priority straight onto a `tkt_priority`
 * field that doesn't exist on the Ticket schema — the real field is
 * `color_code`, and it's numeric (1-4), not the string union here. Map
 * through the same PRIORITY -> TICKET_PRIORITY conversion used by
 * inbound.worker.ts's classify()/PRIORITY_TO_COLOR_CODE.
 */
const PRIORITY_TO_COLOR_CODE: Record<TicketPriority, number> = {
  [PRIORITY.LOW]: TICKET_PRIORITY.LOW,
  [PRIORITY.MEDIUM]: TICKET_PRIORITY.MEDIUM,
  [PRIORITY.HIGH]: TICKET_PRIORITY.HIGH,
  [PRIORITY.URGENT]: TICKET_PRIORITY.URGENT,
};

export function inboundEmailToTicketPayload(
  email: InboundEmail,
  opts: {
    category: string;
    priority: TicketPriority;
  },
) {
  return {
    email_subject: email.subject,
    description: email.text || "(no content)",
    // FIX #2: use the sender's display name if available, otherwise fall back to email address
    tkt_customer_name: email.fromName || email.from,
    eml_ticket_created_for: email.from,
    tkt_type: opts.category,
    tkt_status: "open",
    color_code: PRIORITY_TO_COLOR_CODE[opts.priority] ?? TICKET_PRIORITY.MEDIUM,
    email_fingerprint: buildEmailFingerprint(email),
    source: "email" as const,
  };
}