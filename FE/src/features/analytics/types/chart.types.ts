
// src/features/analytics/types/chart.types.ts

/* -------------------------------------------------------------------------- */
/* CORE CHART CONTRACT (STRICT + SAFE)                                       */
/* -------------------------------------------------------------------------- */

/**
 * Final chart-ready format used by ALL chart components.
 * Guaranteed numeric values only.
 */
export type ChartItems = Record<string, number>;

/* -------------------------------------------------------------------------- */
/* RAW API COMPAT TYPES                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Backend may return:
 * - numbers
 * - strings (DB aggregates)
 * - null (missing aggregation)
 */
export type RawChartItems = Record<string, number | string | null | undefined>;

/* -------------------------------------------------------------------------- */
/* NORMALIZED FORMAT                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Fully cleaned + chart-safe dataset
 */
export type NormalizedChartItems = Record<string, number>;

/* -------------------------------------------------------------------------- */
/* ENTRY FORMAT (for UI mapping / charts loops)                               */
/* -------------------------------------------------------------------------- */

export type ChartEntry = {
  key: string;
  value: number;
};

/* -------------------------------------------------------------------------- */
/* TYPE GUARD                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Runtime safety check before feeding data into charts
 */
export const isChartItems = (data: unknown): data is ChartItems => {
  if (!data || typeof data !== "object") return false;

  return Object.values(data as Record<string, unknown>).every(
    (v) => typeof v === "number" && Number.isFinite(v)
  );
};

/* -------------------------------------------------------------------------- */
/* NORMALIZER (THIS FIXES YOUR TS ERRORS)                                    */
/* -------------------------------------------------------------------------- */

/**
 * Converts ANY backend breakdown object into safe chart format.
 * This is the ONLY function you should use in pages.
 */
export const toChartItems = (
  data?: RawChartItems | null
): ChartItems => {
  if (!data) return {};

  const result: ChartItems = {};

  for (const [key, value] of Object.entries(data)) {
    const num =
      typeof value === "number"
        ? value
        : Number(value);

    result[key] = Number.isFinite(num) ? num : 0;
  }

  return result;
};

/* -------------------------------------------------------------------------- */
/* EMPTY FALLBACK                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Safe fallback for UI
 */
export const EMPTY_CHART_ITEMS: ChartItems = {};