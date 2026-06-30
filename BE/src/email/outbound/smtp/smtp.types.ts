
import type { SentMessageInfo } from "nodemailer";

/* -------------------------------------------------------------------------- */
/* CORE EMAIL ADDRESS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Canonical email identity inside system
 */
export interface EmailAddress {
  name?: string;
  email: string;
}

/**
 * STRICT normalized recipient format used internally BEFORE SMTP conversion
 * (keeps domain clean and consistent)
 */
export type EmailRecipient = EmailAddress;

/**
 * Final SMTP-compatible recipient format (after normalization)
 */
export type SMTPRecipient = string;

/* -------------------------------------------------------------------------- */
/* DOMAIN LAYER (SERVICE INPUT)                                              */
/* -------------------------------------------------------------------------- */

export interface SendEmailRequest {
  to: EmailRecipient[];

  subject: string;

  text?: string;
  html?: string;

  from?: EmailAddress;

  cc?: EmailAddress[];
  bcc?: EmailAddress[];

  replyTo?: EmailAddress;

  meta?: EmailMeta;
}

/* -------------------------------------------------------------------------- */
/* SMTP TRANSPORT LAYER (NODemailer SAFE CONTRACT)                           */
/* -------------------------------------------------------------------------- */

export interface SMTPEmailPayload {
  from: string;

  to: string[];
  cc?: string[];
  bcc?: string[];

  subject: string;

  text?: string;
  html?: string;

  replyTo?: string;

  attachments?: SMTPAttachment[];
}

/* -------------------------------------------------------------------------- */
/* ATTACHMENTS                                                              */
/* -------------------------------------------------------------------------- */

export interface SMTPAttachment {
  filename?: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

/* -------------------------------------------------------------------------- */
/* SEND RESULT                                                             */
/* -------------------------------------------------------------------------- */

export interface SMTPSendResult {
  success: boolean;
  messageId?: string;
  response?: string;
  raw?: SentMessageInfo;
}

/* -------------------------------------------------------------------------- */
/* METADATA                                                                */
/* -------------------------------------------------------------------------- */

export interface EmailMeta {
  ticketId?: string;
  userId?: string;

  source?: "ticket" | "system" | "manual" | "automation";

  traceId?: string;
}

/* -------------------------------------------------------------------------- */
/* TEMPLATE SYSTEM                                                         */
/* -------------------------------------------------------------------------- */

export type TemplateContext = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface EmailTemplate {
  subject: string;
  html: string;
}

export type EmailTemplateName =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_closed"
  | "password_reset"
  | "generic_notification";

/* -------------------------------------------------------------------------- */
/* SMTP CONFIG                                                             */
/* -------------------------------------------------------------------------- */

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;

  user: string;
  pass: string;

  maxConnections?: number;
  maxMessages?: number;
}

/* -------------------------------------------------------------------------- */
/* INTERNAL STATE (OBSERVABILITY)                                           */
/* -------------------------------------------------------------------------- */

export interface SMTPTransportState {
  initialized: boolean;
  healthy: boolean;
  lastVerifiedAt?: Date;
  lastError?: string;
}