
import type { MailboxObject, ImapFlow } from "imapflow";

/* -------------------------------------------------------------------------- */
/* GENERIC UTIL TYPES                                                         */
/* -------------------------------------------------------------------------- */

export type Maybe<T> = T | null | undefined;

/* -------------------------------------------------------------------------- */
/* RAW IMAP RESPONSES (IMAPFLOW BOUNDARY LAYER)                               */
/* -------------------------------------------------------------------------- */

export type RawMailbox = MailboxObject | false;
export type RawSearchResult = number[] | false;

/**
 * IMAP fetch yields an async stream; individual messages are unsafe at runtime.
 */
export type RawFetchItem<T> = T | null | undefined;

/* -------------------------------------------------------------------------- */
/* SAFE DOMAIN TYPES                                                          */
/* -------------------------------------------------------------------------- */

export type SafeMailbox = MailboxObject;
export type SafeSearchResult = number[];

/* -------------------------------------------------------------------------- */
/* CONTEXT (SERVICE BOUNDARY ONLY)                                            */
/* -------------------------------------------------------------------------- */

export interface ImapClientContext {
  client: ImapFlow;
  userId: string;
  mailbox?: string;
}

/* -------------------------------------------------------------------------- */
/* NORMALIZED EMAIL (STRICT INGESTION CONTRACT)                               */
/* -------------------------------------------------------------------------- */

export interface NormalizedEmail {
  /**
   * IMAP UID (PRIMARY DEDUP KEY - MUST NEVER CHANGE)
   */
  uid: number;

  /**
   * RFC Message-ID (secondary identity key)
   */
  messageId?: string;

  from: string;
  /** FIX #2: Display name extracted from the From header (e.g. "John Smith"). Empty string if not present. */
  fromName: string;
  to: string[];

  subject: string;

  /**
   * ALWAYS normalized to Date at boundary layer
   */
  date: Date;

  body?: string;
  snippet?: string;

  /* ---------------------------------------------------------------------- */
  /* THREADING (BEST-EFFORT ONLY - IMAP DOES NOT GUARANTEE THESE)           */
  /* ---------------------------------------------------------------------- */

  inReplyTo?: string;

  /**
   * Not reliably supported by ImapFlow envelope types.
   * Must be extracted carefully from raw headers if needed.
   */
  references?: string[];

  /* ---------------------------------------------------------------------- */
  /* FALLBACK DEDUP (ONLY IF UID BREAKS OR MAILBOX RESET OCCURS)           */
  /* ---------------------------------------------------------------------- */

  emailFingerprint?: string;
}

/* -------------------------------------------------------------------------- */
/* MAILBOX SYNC STATE (LAST_UID SOURCE OF TRUTH)                             */
/* -------------------------------------------------------------------------- */

export interface MailboxSyncState {
  _id?: string;

  /**
   * Tenant / CRM user
   */
  user: string;

  mailbox: string;

  /**
   * CRITICAL: last processed IMAP UID (dedup anchor)
   */
  last_uid: number;

  status: "active" | "paused" | "error";

  last_sync_at?: Date;
  last_error_at?: Date | null;

  total_processed: number;
}

/* -------------------------------------------------------------------------- */
/* INGESTION METRICS                                                          */
/* -------------------------------------------------------------------------- */

export interface EmailIngestionStats {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

/* -------------------------------------------------------------------------- */
/* IMAP ERROR CODES                                                           */
/* -------------------------------------------------------------------------- */

export type ImapErrorCode =
  | "MAILBOX_OPEN_FAILED"
  | "SEARCH_FAILED"
  | "FETCH_FAILED"
  | "AUTH_FAILED"
  | "CONNECTION_LOST"
  | "UNKNOWN_ERROR";