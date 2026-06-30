
import logger from "@/config/logger";
import { getSMTPTransport, verifySMTPConnection } from "./smtp.client";
import { env } from "@/config/env";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  meta?: {
    ticketId?: string;
    userId?: string;
    source?: "system" | "ticket" | "manual" | "automation";
  };
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
}

/* -------------------------------------------------------------------------- */
/* SERVICE                                                                    */
/* -------------------------------------------------------------------------- */

export class SMTPService {
  static async init(): Promise<void> {
    try {
      await verifySMTPConnection();
      logger.info("[SMTP_SERVICE_READY]");
    } catch (err) {
      logger.error("[SMTP_SERVICE_INIT_FAILED]", err);
      throw err;
    }
  }

  static async send(payload: SendEmailRequest): Promise<SendEmailResult> {
    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];

    const from = payload.from ?? env.smtp.user;

    try {
      /*
       * FIX: Previously called the module-level sendEmail() which returns void,
       * then tried to read .messageId off the result (always undefined).
       * Now we call the transporter directly to get the real SentMessageInfo.
       */
      const transport = await getSMTPTransport();
      const info = await transport.sendMail({
        from,
        to: recipients.join(","),
        subject: payload.subject.trim(),
        text: payload.text,
        html: payload.html,
        replyTo: payload.replyTo,
      });

      logger.info("[SMTP_SERVICE_EMAIL_SENT]", {
        to: recipients,
        subject: payload.subject,
        messageId: info.messageId,
        meta: payload.meta,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error("[SMTP_SERVICE_SEND_FAILED]", {
        to: recipients,
        subject: payload.subject,
        meta: payload.meta,
        err,
      });
      throw err;
    }
  }

  // static async sendBulk(emails: SendEmailRequest[]): Promise<SendEmailResult[]> {
  //   const results: SendEmailResult[] = [];

  //   for (const email of emails) {
  //     try {
  //       results.push(await this.send(email));
  //     } catch {
  //       results.push({ success: false });
  //     }
  //   }

  //   return results;
  // }
}