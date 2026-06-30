
import dotenv from "dotenv";
import path from "path";
import type { SignOptions } from "jsonwebtoken";

/* -------------------------------------------------------------------------- */
/* LOAD ENV                                                                 */
/* -------------------------------------------------------------------------- */

let envLoaded = false;

export function loadEnv(): void {
  if (envLoaded) return;

  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
  });

  envLoaded = true;
}

loadEnv();

/* -------------------------------------------------------------------------- */
/* TYPES                                                                    */
/* -------------------------------------------------------------------------- */

export type NodeEnvironment = "development" | "production" | "test";

export interface EnvConfig {
  app: {
    name: string;
    env: NodeEnvironment;
    port: number;
    apiPrefix: string;
    clientUrl: string;
  };

  database: {
    mongoUri: string;
  };

  imap: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };

  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };

  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: NonNullable<SignOptions["expiresIn"]>;
    refreshExpiresIn: NonNullable<SignOptions["expiresIn"]>;
  };

  security: {
    bcryptSaltRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
  };

  logging: {
    level: "debug" | "info" | "warn" | "error";
  };

  features: {
    enableMorgan: boolean;
    enableSwagger: boolean;
  };
}

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

const required = (key: string): string => {
  const v = process.env[key];
  if (!v) throw new Error(`[ENV_MISSING] ${key}`);
  return v.trim();
};

const optional = (key: string, fallback: string): string =>
  process.env[key]?.trim() || fallback;

const number = (key: string, fallback?: number): number => {
  const v = process.env[key];
  if (!v) {
    if (fallback !== undefined) return fallback;
    throw new Error(`[ENV_MISSING_NUMBER] ${key}`);
  }

  const n = Number(v);
  if (!Number.isFinite(n)) {
    throw new Error(`[ENV_INVALID_NUMBER] ${key}`);
  }

  return n;
};

const boolean = (key: string, fallback: boolean): boolean => {
  const v = process.env[key];
  if (!v) return fallback;
  return ["true", "1", "yes", "on"].includes(v.toLowerCase());
};

const nodeEnv = (): NodeEnvironment => {
  const v = process.env.NODE_ENV ?? "development";
  if (v !== "development" && v !== "production" && v !== "test") {
    throw new Error(`[ENV_INVALID_NODE_ENV] ${v}`);
  }
  return v;
};

/* -------------------------------------------------------------------------- */
/* CONFIG BUILD                                                            */
/* -------------------------------------------------------------------------- */

const rawConfig: EnvConfig = {
  app: {
    name: optional("APP_NAME", "CRM Helpdesk Platform"),
    env: nodeEnv(),
    port: number("PORT", 5000),
    apiPrefix: optional("API_PREFIX", "/api/v1"),
    clientUrl: optional("CLIENT_URL", "http://localhost:5173"),
  },

  database: {
    mongoUri: required("MONGO_URI"),
  },

  imap: {
    host:   required("IMAP_HOST"),
    port:   number("IMAP_PORT", 993),
    secure: boolean("IMAP_SECURE", true),
    user:   required("IMAP_USER"),
    pass:   required("IMAP_PASS"),
  },

  smtp: {
    host: required("SMTP_HOST"),
    port: number("SMTP_PORT", 587),
    secure: boolean("SMTP_SECURE", false),
    user: required("SMTP_USER"),
    pass: required("SMTP_PASS"),
  },

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),

    accessExpiresIn: optional(
      "JWT_ACCESS_EXPIRES_IN",
      "15m",
    ) as unknown as NonNullable<SignOptions["expiresIn"]>,

    refreshExpiresIn: optional(
      "JWT_REFRESH_EXPIRES_IN",
      "30d",
    ) as unknown as NonNullable<SignOptions["expiresIn"]>,
  },

  security: {
    bcryptSaltRounds: number("BCRYPT_SALT_ROUNDS", 12),
    rateLimitWindowMs: number("RATE_LIMIT_WINDOW_MS", 900000),
    rateLimitMaxRequests: number("RATE_LIMIT_MAX_REQUESTS", 1000),
  },

  logging: {
    level: optional("LOG_LEVEL", "info") as EnvConfig["logging"]["level"],
  },

  features: {
    enableMorgan: boolean("ENABLE_MORGAN", true),
    enableSwagger: boolean("ENABLE_SWAGGER", true),
  },
};

/* -------------------------------------------------------------------------- */
/* DEEP FREEZE                                                              */
/* -------------------------------------------------------------------------- */

function deepFreeze<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  Object.freeze(obj);

  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return obj;
}

/* -------------------------------------------------------------------------- */
/* EXPORT                                                                 */
/* -------------------------------------------------------------------------- */

export const env = deepFreeze(rawConfig);

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* -------------------------------------------------------------------------- */

export const isDevelopment = env.app.env === "development";
export const isProduction = env.app.env === "production";
export const isTest = env.app.env === "test";

export default env;