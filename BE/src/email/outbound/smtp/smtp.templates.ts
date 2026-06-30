
import logger from "@/config/logger";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                     */
/* -------------------------------------------------------------------------- */

export type EmailTemplateName =
  | "ticket_created"
  | "ticket_updated"
  | "ticket_closed"
  | "password_reset"
  | "generic_notification"
  | "feedback_request";

export interface TemplateContext {
  [key: string]: string | number | boolean | undefined | null;
}

/* -------------------------------------------------------------------------- */
/* SAFE HTML ESCAPER                                                         */
/* -------------------------------------------------------------------------- */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------------------------------------------------------- */
/* TEMPLATE ENGINE                                                           */
/* -------------------------------------------------------------------------- */

function render(template: string, ctx: TemplateContext): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key: string) => {
    const value = ctx[key.trim()];
    if (value === undefined || value === null) return "";
    return escapeHtml(String(value));
  });
}

/* -------------------------------------------------------------------------- */
/* TEMPLATE DEFINITIONS                                                      */
/* -------------------------------------------------------------------------- */

const templates: Record<EmailTemplateName, { subject: string; html: string }> =
  {
    ticket_created: {
      subject: "Ticket #{{tkt_number}} Created",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Ticket Created</h2>
          <p>Hello {{name}},</p>
          <p>Your ticket has been successfully created.</p>

          <hr />

          <p><b>Ticket Number:</b> {{tkt_number}}</p>
          <p><b>Subject:</b> {{subject}}</p>
          <p><b>Status:</b> {{status}}</p>

          <p style="margin-top:20px;">We will get back to you shortly.</p>
        </div>
      `,
    },

    ticket_updated: {
      subject: "Ticket #{{tkt_number}} Updated",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Ticket Updated</h2>

          <p>Hello {{name}},</p>

          <p>Your ticket has been updated.</p>

          <hr />

          <p><b>Ticket Number:</b> {{tkt_number}}</p>
          <p><b>Update:</b> {{update_message}}</p>
          <p><b>Status:</b> {{status}}</p>
        </div>
      `,
    },

    ticket_closed: {
      subject: "Ticket #{{tkt_number}} Closed",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Ticket Closed</h2>

          <p>Hello {{name}},</p>

          <p>Your ticket has been resolved and closed.</p>

          <hr />

          <p><b>Ticket Number:</b> {{tkt_number}}</p>
          <p>Thank you for your patience.</p>
        </div>
      `,
    },

    password_reset: {
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Password Reset</h2>

          <p>Hello {{name}},</p>

          <p>Click below to reset your password:</p>

          <a href="{{reset_link}}" target="_blank">Reset Password</a>
        </div>
      `,
    },

    generic_notification: {
      subject: "{{subject}}",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>{{message}}</p>
        </div>
      `,
    },

    feedback_request: {
      subject: "How did we do? Ticket #{{tkt_number}}",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>We'd love your feedback</h2>

          <p>Hello {{name}},</p>

          <p>Your ticket <b>#{{tkt_number}}</b> ({{subject}}) has been marked as resolved.</p>

          <p>Please reply to this email with a rating from <b>1 to 5</b> and a short
          comment about your experience. For example:</p>

          <blockquote style="border-left: 3px solid #ccc; margin: 12px 0; padding-left: 12px; color: #555;">
            5 — Quick and helpful, thank you!
          </blockquote>

          <p>Just put the number anywhere in your reply along with your comments —
          we'll take it from there.</p>

          <p style="margin-top:20px;">Thank you for choosing us.</p>
        </div>
      `,
    },
  };

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                */
/* -------------------------------------------------------------------------- */

export function renderTemplate(
  name: EmailTemplateName,
  ctx: TemplateContext,
): { subject: string; html: string } {
  const template = templates[name];

  if (!template) {
    logger.error("[EMAIL_TEMPLATE_NOT_FOUND]", { name });
    throw new Error(`Template not found: ${name}`);
  }

  return {
    subject: render(template.subject, ctx),
    html: render(template.html, ctx),
  };
}

/* -------------------------------------------------------------------------- */
/* OPTIONAL: EXTENDABLE HOOK                                                 */
/* -------------------------------------------------------------------------- */

export function registerTemplate(
  name: string,
  template: { subject: string; html: string },
): void {
  (templates as any)[name] = template;

  logger.info("[EMAIL_TEMPLATE_REGISTERED]", { name });
}