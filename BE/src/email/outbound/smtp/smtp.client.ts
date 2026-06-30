
import nodemailer, { Transporter } from "nodemailer";
import { env } from "../../../config/env";
import logger from "../../../config/logger";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                     */
/* -------------------------------------------------------------------------- */

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

/* -------------------------------------------------------------------------- */
/* SINGLETON STATE                                                          */
/* -------------------------------------------------------------------------- */

let transporter: Transporter | null = null;
let initializing: Promise<Transporter> | null = null;

/* -------------------------------------------------------------------------- */
/* VALIDATION                                                                */
/* -------------------------------------------------------------------------- */

function assertSMTPConfig(): void {
  if (!env.smtp?.host || !env.smtp?.user || !env.smtp?.pass) {
    throw new Error("[SMTP_CONFIG_INVALID] Missing SMTP configuration");
  }
}

/* -------------------------------------------------------------------------- */
/* INIT TRANSPORT (SAFE SINGLETON + RACE PROTECTION)                         */
/* -------------------------------------------------------------------------- */

async function createTransport(): Promise<Transporter> {
  assertSMTPConfig();

  const t = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,

    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },

    pool: true,
    maxConnections: 5,
    maxMessages: 100,

    logger: false,
    debug: false,
  });

  await t.verify();
  logger.info("[SMTP_TRANSPORT_READY]");

  return t;
}

/* -------------------------------------------------------------------------- */
/* GET TRANSPORT (SAFE LAZY INIT)                                           */
/* -------------------------------------------------------------------------- */

export async function getSMTPTransport(): Promise<Transporter> {
  if (transporter) return transporter;

  if (initializing) return initializing;

  initializing = createTransport()
    .then((t) => {
      transporter = t;
      initializing = null;
      return t;
    })
    .catch((err) => {
      initializing = null;
      logger.error("[SMTP_INIT_FAILED]", err);
      throw err;
    });

  return initializing;
}

/* -------------------------------------------------------------------------- */
/* VERIFY CONNECTION                                                         */
/* -------------------------------------------------------------------------- */

export async function verifySMTPConnection(): Promise<void> {
  try {
    const t = await getSMTPTransport();
    await t.verify();
    logger.info("[SMTP_CONNECTED]");
  } catch (err) {
    logger.error("[SMTP_CONNECTION_FAILED]", err);
    throw new Error("[SMTP_FATAL] SMTP verification failed");
  }
}

/* -------------------------------------------------------------------------- */
/* SEND EMAIL (PRODUCTION SAFE)                                              */
/* -------------------------------------------------------------------------- */

// export async function sendEmail(payload: EmailPayload): Promise<void> {
//   const t = await getSMTPTransport();
//   const fromAddress = env.smtp.user;

//   const mail = {
//     from: fromAddress,
//     to: payload.to,
//     subject: payload.subject,
//     text: payload.text,
//     html: payload.html,
//   };

//   try {
//     await t.sendMail(mail);
//     logger.info("[SMTP_EMAIL_SENT]", {
//       to: payload.to,
//       subject: payload.subject,
//     });
//   } catch (err) {
//     logger.error("[SMTP_SEND_FAILED]", {
//       to: payload.to,
//       err,
//     });

//     throw err;
//   }
// }

/* -------------------------------------------------------------------------- */
/* OPTIONAL: GRACEFUL SHUTDOWN                                               */
/* -------------------------------------------------------------------------- */

export async function closeSMTP(): Promise<void> {
  try {
    if (transporter && "close" in transporter) {
      await (transporter as any).close();
    }
  } finally {
    transporter = null;
    initializing = null;
    logger.info("[SMTP_CLOSED]");
  }
}