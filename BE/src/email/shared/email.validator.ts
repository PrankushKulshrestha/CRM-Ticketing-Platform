
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  ALLOWED_ATTACHMENT_TYPES,
  AUTO_REPLY_HEADERS,
} from "./email.constants";
import { isAutoReply } from "./email.utils";
import type { InboundEmail } from "./email.types";

/* -------------------------------------------------------------------------- */
/* FIX: File was empty                                                        */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* RESULT TYPE                                                                */
/* -------------------------------------------------------------------------- */

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/* -------------------------------------------------------------------------- */
/* INBOUND EMAIL VALIDATORS                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Gate check run before enqueuing an inbound email.
 * Returns early on first failure to avoid unnecessary work.
 */
export function validateInboundEmail(
  email: InboundEmail,
  headers?: Record<string, string>,
): ValidationResult {
  /* ── Required fields ───────────────────────────────────────────────────── */
  if (!email.from || !email.subject) {
    return { valid: false, reason: "MISSING_REQUIRED_FIELDS" };
  }

  /* ── Valid sender address ──────────────────────────────────────────────── */
  if (!isValidEmailAddress(email.from)) {
    return { valid: false, reason: "INVALID_SENDER_ADDRESS" };
  }

  /* ── Auto-reply detection ──────────────────────────────────────────────── */
  if (isAutoReply(email)) {
    return { valid: false, reason: "AUTO_REPLY_DETECTED" };
  }

  /* ── Auto-reply headers ────────────────────────────────────────────────── */
  if (headers && hasAutoReplyHeader(headers)) {
    return { valid: false, reason: "AUTO_REPLY_HEADER_DETECTED" };
  }

  return { valid: true };
}

/* -------------------------------------------------------------------------- */
/* ATTACHMENT VALIDATORS                                                      */
/* -------------------------------------------------------------------------- */

export function validateAttachment(
  filename: string,
  contentType: string,
  sizeBytes: number,
): ValidationResult {
  if (sizeBytes > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      reason: `ATTACHMENT_TOO_LARGE: ${sizeBytes} > ${MAX_ATTACHMENT_SIZE_BYTES}`,
    };
  }

  const allowed = ALLOWED_ATTACHMENT_TYPES as readonly string[];
  if (!allowed.includes(contentType)) {
    return {
      valid: false,
      reason: `ATTACHMENT_TYPE_NOT_ALLOWED: ${contentType}`,
    };
  }

  return { valid: true };
}

/* -------------------------------------------------------------------------- */
/* OUTBOUND VALIDATORS                                                        */
/* -------------------------------------------------------------------------- */

export function validateOutboundRecipients(recipients: string[]): ValidationResult {
  if (!recipients.length) {
    return { valid: false, reason: "NO_RECIPIENTS" };
  }

  const invalid = recipients.filter((r) => !isValidEmailAddress(r));
  if (invalid.length) {
    return { valid: false, reason: `INVALID_RECIPIENTS: ${invalid.join(", ")}` };
  }

  return { valid: true };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmailAddress(address: string): boolean {
  return EMAIL_RE.test(address.trim());
}

function hasAutoReplyHeader(headers: Record<string, string>): boolean {
  return Object.entries(AUTO_REPLY_HEADERS).some(([key, val]) => {
    const headerVal = headers[key.toLowerCase()];
    return headerVal?.toLowerCase().includes(val);
  });
}