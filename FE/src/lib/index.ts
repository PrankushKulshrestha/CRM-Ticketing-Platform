
/**
 * @/lib/utils — master barrel
 *
 * All utility functions are exported from here.
 * Import anything with:
 *   import { cn, clamp, getInitials, formatTimestamp } from "@/lib/utils"
 *
 * Sub-modules can still be imported directly if you want to keep
 * tree-shaking explicit, but the barrel is preferred for conciseness.
 */

// Tailwind class merging
export { cn } from "@/lib/utils/cn";

// Time & date helpers
export {
  toDate,
  formatDuration,
  formatDurationHours,
  formatTimestamp,
  formatRelative,
  getSLATone,
  getSLAToneClass,
  formatSLACountdown,
} from "@/lib/utils/time";

// String helpers
export {
  getInitials,
  hashString,
  formatLabel,
  truncate,
  normalise,
} from "@/lib/utils/string";

// Number helpers
export {
  clamp,
  safeNumber,
  round,
  toPercent,
} from "@/lib/utils/number";

// URL / query helpers
export { buildParams } from "@/lib/utils/query";