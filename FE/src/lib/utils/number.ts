
/**
 * Clamp a number between min and max (inclusive).
 * Previously inlined in SLAIndicator.tsx.
 */
export function clamp(n: number, min = 0, max = 1): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Coerce any value to a finite number, returning fallback (default 0) if not.
 * Useful for API payloads where a field may be string | number | undefined.
 */
export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Round to a given number of decimal places.
 */
export function round(n: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/**
 * Convert a ratio (0–1) to a percentage string, e.g. 0.856 → "85.6%"
 */
export function toPercent(ratio: number, decimals = 1): string {
  return `${round(ratio * 100, decimals)}%`;
}