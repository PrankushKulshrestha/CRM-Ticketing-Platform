
/* -------------------------------------------------------------------------- */
/* EMAIL SYSTEM CONSTANTS                                                     */
/* FIX: File was empty                                                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* MAILBOX                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_MAILBOX = "INBOX";

/* -------------------------------------------------------------------------- */
/* QUEUE                                                                      */
/* -------------------------------------------------------------------------- */

export const INBOUND_QUEUE_MAX_SIZE  = 5000;
export const OUTBOUND_QUEUE_MAX_SIZE = 2000;
export const INBOUND_CONCURRENCY     = 5;

/* -------------------------------------------------------------------------- */
/* IMAP                                                                       */
/* -------------------------------------------------------------------------- */

/** Debounce window (ms) before triggering sync on EXISTS burst */
export const IMAP_SYNC_DEBOUNCE_MS  = 1500;

/** How long to wait for the ImapFlow client to connect (ms) */
export const IMAP_CONNECT_TIMEOUT_MS = 15_000;

/* -------------------------------------------------------------------------- */
/* DEDUP / FINGERPRINT                                                        */
/* -------------------------------------------------------------------------- */

export const FINGERPRINT_ALGO = "sha256" as const;

/* -------------------------------------------------------------------------- */
/* SMTP                                                                       */
/* -------------------------------------------------------------------------- */

export const SMTP_MAX_CONNECTIONS = 5;
export const SMTP_MAX_MESSAGES    = 100;

/* -------------------------------------------------------------------------- */
/* LIMITS                                                                     */
/* -------------------------------------------------------------------------- */

/** Hard reject attachments over this size (10 MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

/* -------------------------------------------------------------------------- */
/* AUTO-REPLY DETECTION                                                       */
/* -------------------------------------------------------------------------- */

export const AUTO_REPLY_SUBJECTS = [
  "out of office",
  "auto-reply",
  "automatic reply",
  "auto reply",
  "vacation",
] as const;

export const AUTO_REPLY_HEADERS: Record<string, string> = {
  "x-auto-reply": "yes",
  "auto-submitted": "auto-replied",
  "precedence": "bulk",
} as const;