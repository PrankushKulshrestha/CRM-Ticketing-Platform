
import winston from "winston";
import fs from "fs";
import path from "path";
import { env, isDevelopment, isProduction } from "./env";

/* -------------------------------------------------------------------------- */
/* Log Directory (safe singleton init)                                        */
/* -------------------------------------------------------------------------- */

const logDir = path.resolve(process.cwd(), "logs");

let logDirInitialized = false;

function ensureLogDir(): void {
  if (logDirInitialized) return;

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  logDirInitialized = true;
}

ensureLogDir();

/* -------------------------------------------------------------------------- */
/* Log Level                                                                  */
/* -------------------------------------------------------------------------- */

const logLevel = env.logging.level;

/* -------------------------------------------------------------------------- */
/* Safe Serialization                                                         */
/* -------------------------------------------------------------------------- */

const safeStringify = (value: unknown): string => {
  try {
    return typeof value === "string"
      ? value
      : JSON.stringify(value);
  } catch {
    return "[UNSERIALIZABLE]";
  }
};

/* -------------------------------------------------------------------------- */
/* Formats                                                                    */
/* -------------------------------------------------------------------------- */

const timestamp = winston.format.timestamp({
  format: "YYYY-MM-DD HH:mm:ss",
});

const errorStack = winston.format.errors({ stack: true });

/* -------------------------------------------------------------------------- */
/* DEV FORMAT                                                                 */
/* -------------------------------------------------------------------------- */

const devFormat = winston.format.combine(
  winston.format.colorize(),
  timestamp,
  errorStack,
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    const extra = Object.keys(meta).length
      ? ` ${safeStringify(meta)}`
      : "";

    return `[${timestamp}] ${level}: ${stack || message}${extra}`;
  })
);

/* -------------------------------------------------------------------------- */
/* PROD FORMAT (structured JSON safe)                                         */
/* -------------------------------------------------------------------------- */

const prodFormat = winston.format.combine(
  timestamp,
  errorStack,
  winston.format.json()
);

/* -------------------------------------------------------------------------- */
/* Console Transport                                                          */
/* -------------------------------------------------------------------------- */

const consoleTransport = new winston.transports.Console({
  format: isDevelopment ? devFormat : prodFormat,
});

/* -------------------------------------------------------------------------- */
/* File Transports (ONLY production)                                          */
/* -------------------------------------------------------------------------- */

const fileTransports: winston.transport[] = isProduction
  ? [
      new winston.transports.File({
        filename: path.join(logDir, "error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(logDir, "combined.log"),
      }),
    ]
  : [];

/* -------------------------------------------------------------------------- */
/* Logger Instance                                                            */
/* -------------------------------------------------------------------------- */

export const logger = winston.createLogger({
  level: logLevel,

  defaultMeta: {
    service: env.app.name,
    environment: env.app.env,
  },

  format: prodFormat,

  transports: [consoleTransport, ...fileTransports],

  exceptionHandlers: [
    consoleTransport,
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: path.join(logDir, "exceptions.log"),
          }),
        ]
      : []),
  ],

  rejectionHandlers: [
    consoleTransport,
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: path.join(logDir, "rejections.log"),
          }),
        ]
      : []),
  ],

  exitOnError: false,
});

/* -------------------------------------------------------------------------- */
/* Morgan Stream                                                              */
/* -------------------------------------------------------------------------- */

export const loggerStream = {
  write(message: string) {
    logger.info(message.trim());
  },
};

/* -------------------------------------------------------------------------- */
/* Child Logger                                                               */
/* -------------------------------------------------------------------------- */

export function createChildLogger(metadata: Record<string, unknown>) {
  return logger.child(metadata);
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export default logger;