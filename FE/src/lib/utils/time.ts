
import { formatDistanceToNowStrict } from "date-fns";

// ---------------------------------------------------------------------------
// Date coercion
// ---------------------------------------------------------------------------

/**
 * Coerce a string | Date | undefined to a Date, returning null if invalid.
 * Previously inlined in SLAIndicator.tsx.
 */
export function toDate(value?: string | Date): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Duration formatting
// ---------------------------------------------------------------------------

/**
 * Format a number of hours into a human-readable "Xh Ym" string.
 * Moved from lib/utils/time.utils.ts.
 */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours)) return "0m";

  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/** @alias formatDuration — kept for back-compat while migrating */
export const formatDurationHours = formatDuration;

// ---------------------------------------------------------------------------
// Timestamp formatting
// ---------------------------------------------------------------------------

/**
 * Format a date string into a locale-aware timestamp.
 * Previously inlined in TicketDetailsPage.tsx.
 */
export function formatTimestamp(value?: string | Date | null): string {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Relative "X ago" label.
 * Uses date-fns under the hood.
 */
export function formatRelative(value?: string | Date | null): string {
  if (!value) return "—";
  const d = toDate(value);
  if (!d) return "—";
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

// ---------------------------------------------------------------------------
// SLA countdown helpers
// Previously inlined inside TicketDetailsPage.tsx
// ---------------------------------------------------------------------------

type SLATone = "danger" | "warning" | "ok";

export function getSLATone(remainingMinutes: number): SLATone {
  if (remainingMinutes < 0) return "danger";
  if (remainingMinutes < 30) return "warning";
  return "ok";
}

const SLA_TONE_CLASSES: Record<SLATone, string> = {
  danger:  "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/10 text-warning",
  ok:      "border-success/30 bg-success/10 text-success",
};

export function getSLAToneClass(remainingMinutes: number): string {
  return SLA_TONE_CLASSES[getSLATone(remainingMinutes)];
}

export function formatSLACountdown(remainingMinutes: number): string {
  if (remainingMinutes < 0) {
    const abs = Math.abs(remainingMinutes);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return h > 0 ? `Overdue by ${h}h ${m}m` : `Overdue by ${m}m`;
  }
  const h = Math.floor(remainingMinutes / 60);
  const m = remainingMinutes % 60;
  return h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`;
}