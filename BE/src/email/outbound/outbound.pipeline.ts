
import logger from "@/config/logger";
import { renderTemplate } from "./smtp/smtp.templates";
import { dispatchEmail } from "./email.worker";
import type { EmailTemplateName, TemplateContext } from "./smtp/smtp.templates";

/* -------------------------------------------------------------------------- */
/*
 * FIX: Previously was a two-line stub (enqueueEmail + processEmailQueue no-ops).
 * Now orchestrates: template render → queue dispatch → structured logging.
 */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface OutboundEmailRequest {
  to: string | string[];
  templateName: EmailTemplateName;
  context: TemplateContext;
  from?: string;
  replyTo?: string;
  meta?: {
    ticketId?: string;
    userId?: string;
    source?: "ticket" | "system" | "manual" | "automation";
  };
}

/* -------------------------------------------------------------------------- */
/* PIPELINE                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Main entry point for all outbound email.
 * Called by ticket.service, auth.service, etc.
 */
export function sendOutboundEmail(request: OutboundEmailRequest): void {
  let rendered: { subject: string; html: string };

  try {
    rendered = renderTemplate(request.templateName, request.context);
  } catch (err) {
    logger.error("[OUTBOUND_PIPELINE_TEMPLATE_FAILED]", {
      template: request.templateName,
      err,
    });
    return;
  }

  const recipients = Array.isArray(request.to) ? request.to : [request.to];

  dispatchEmail({
    to: recipients,
    subject: rendered.subject,
    html: rendered.html,
    from: request.from,
    replyTo: request.replyTo,
    meta: request.meta,
  });

  logger.info("[OUTBOUND_PIPELINE_DISPATCHED]", {
    to: recipients,
    template: request.templateName,
    meta: request.meta,
  });
}

/**
 * Convenience: send a raw email without a template (e.g. ticket reply body).
 */
export function sendRawOutboundEmail(payload: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  meta?: OutboundEmailRequest["meta"];
}): void {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

  dispatchEmail({
    to: recipients,
    subject: payload.subject,
    html: payload.html,
    from: payload.from,
    meta: payload.meta,
  });

  logger.info("[OUTBOUND_PIPELINE_RAW_DISPATCHED]", {
    to: recipients,
    subject: payload.subject,
    meta: payload.meta,
  });
}