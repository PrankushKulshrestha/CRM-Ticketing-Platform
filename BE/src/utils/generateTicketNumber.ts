
import crypto from "crypto";

/* -------------------------------------------------------------------------- */
/* Ticket Number Generator                                                    */
/* -------------------------------------------------------------------------- */
/*
 * Example:
 * TKT-20260617-A1B2C3
 *
 * Characteristics:
 * - Human readable
 * - Sortable by date
 * - Cryptographically random suffix
 * - Extremely low collision probability
 * - No database dependency
 */

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

export interface TicketNumberConfig {
  prefix?: string;
  includeDate?: boolean;
  separator?: string;
  randomLength?: number;
}

const DEFAULT_CONFIG = Object.freeze({
  prefix: "TKT",
  includeDate: true,
  separator: "-",
  randomLength: 6,
} satisfies Required<TicketNumberConfig>);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getDateStamp(): string {
  const now = new Date();

  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
  ].join("");
}

function getRandomString(length: number): string {
  if (length <= 0) {
    throw new Error("randomLength must be greater than 0");
  }

  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
}

function resolveConfig(
  config?: TicketNumberConfig,
): Required<TicketNumberConfig> {
  return {
    prefix:
      config?.prefix?.trim() ||
      DEFAULT_CONFIG.prefix,

    includeDate:
      config?.includeDate ??
      DEFAULT_CONFIG.includeDate,

    separator:
      config?.separator ??
      DEFAULT_CONFIG.separator,

    randomLength:
      typeof config?.randomLength === "number" &&
      Number.isInteger(config.randomLength) &&
      config.randomLength > 0
        ? Math.min(config.randomLength, 32)
        : DEFAULT_CONFIG.randomLength,
  };
}

/* -------------------------------------------------------------------------- */
/* Main Generator                                                             */
/* -------------------------------------------------------------------------- */

export function generateTicketNumber(
  config?: TicketNumberConfig,
): string {
  const cfg = resolveConfig(config);

  const segments: string[] = [];

  if (cfg.prefix.length > 0) {
    segments.push(cfg.prefix);
  }

  if (cfg.includeDate) {
    segments.push(getDateStamp());
  }

  segments.push(
    getRandomString(cfg.randomLength),
  );

  return segments.join(cfg.separator);
}

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

export function generateStrictTicketNumber(): string {
  return generateTicketNumber({
    prefix: "TICKET",
    includeDate: true,
    randomLength: 8,
  });
}

export function generateCompactTicketNumber(): string {
  return generateTicketNumber({
    prefix: "",
    includeDate: true,
    separator: "",
    randomLength: 6,
  });
}