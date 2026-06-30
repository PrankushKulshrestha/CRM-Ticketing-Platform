
import { createHash } from "crypto";
import { FINGERPRINT_ALGO, AUTO_REPLY_SUBJECTS } from "./email.constants";
import type { InboundEmail, EmailFingerprintInput } from "./email.types";

/* -------------------------------------------------------------------------- */
/* FIX: File was empty                                                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* FINGERPRINT                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Stable dedup key for an email.
 * Uses from + subject + ISO date so re-deliveries are caught.
 */
export function buildEmailFingerprint(input: EmailFingerprintInput): string {
  return createHash(FINGERPRINT_ALGO)
    .update(`${input.from}::${input.subject}::${input.date.toISOString()}`)
    .digest("hex");
}

/* -------------------------------------------------------------------------- */
/* HTML UTILITIES                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Strip HTML tags for plain-text extraction (classification, snippets).
 * NOT for safe display — use a proper sanitizer for that.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Remove quoted reply sections ("> wrote:", "--- Original Message ---").
 * Keeps only the freshest reply text.
 */
export function stripQuotedReply(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* -------------------------------------------------------------------------- */
/* THREAD UTILITIES                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Build a thread ID from the In-Reply-To header or fall back to Message-ID.
 * Normalises angle brackets so "< id@example.com >" → "id@example.com".
 */
export function buildThreadId(
  inReplyTo?: string,
  messageId?: string,
): string | undefined {
  const raw = inReplyTo || messageId;
  if (!raw) return undefined;
  return raw.replace(/[<>\s]/g, "");
}

/* -------------------------------------------------------------------------- */
/* AUTO-REPLY DETECTION                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Returns true if the email looks like an auto-reply / OOO message.
 * Prevents ticket storms from bounce loops.
 */
export function isAutoReply(email: Pick<InboundEmail, "subject">): boolean {
  const lower = email.subject.toLowerCase();
  return AUTO_REPLY_SUBJECTS.some((pattern) => lower.includes(pattern));
}

/* -------------------------------------------------------------------------- */
/* ADDRESS UTILITIES                                                          */
/* -------------------------------------------------------------------------- */

export function extractEmailDomain(address: string): string {
  const atIndex = address.lastIndexOf("@");
  return atIndex >= 0 ? address.slice(atIndex + 1).toLowerCase() : "";
}

export function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}