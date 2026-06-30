
type DateInput = Date | string | number;

/*
|--------------------------------------------------------------------------
| Date Utilities (Enterprise Grade)
|--------------------------------------------------------------------------
| Safe, consistent, timezone-agnostic helpers for backend systems
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Core Normalization
|--------------------------------------------------------------------------
*/

/**
 * Returns current timestamp
 */
export function now(): Date {
  return new Date();
}

/**
 * Normalizes any input into a valid Date instance
 */
export function toDate(input: DateInput): Date {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new Error(`Invalid Date instance`);
    }
    return input;
  }

  const date = new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input: ${String(input)}`);
  }

  return date;
}

/**
 * Safely converts to ISO string
 */
export function toISO(date: DateInput): string {
  return toDate(date).toISOString();
}

/*
|--------------------------------------------------------------------------
| Date Math (pure + safe)
|--------------------------------------------------------------------------
*/

export function addMinutes(date: DateInput, minutes: number): Date {
  const base = toDate(date).getTime();
  return new Date(base + minutes * 60_000);
}

export function addHours(date: DateInput, hours: number): Date {
  const base = toDate(date).getTime();
  return new Date(base + hours * 3_600_000);
}

export function addDays(date: DateInput, days: number): Date {
  const base = toDate(date).getTime();
  return new Date(base + days * 86_400_000);
}

/*
|--------------------------------------------------------------------------
| Comparisons
|--------------------------------------------------------------------------
*/

/**
 * Checks if a date is in the past
 */
export function isExpired(date: DateInput): boolean {
  return toDate(date).getTime() < Date.now();
}

/*
|--------------------------------------------------------------------------
| Differences (safe math layer)
|--------------------------------------------------------------------------
*/

function diffMs(start: DateInput, end: DateInput): number {
  return toDate(end).getTime() - toDate(start).getTime();
}

export function differenceInMinutes(start: DateInput, end: DateInput): number {
  return Math.floor(diffMs(start, end) / 60_000);
}

export function differenceInHours(start: DateInput, end: DateInput): number {
  return Math.floor(diffMs(start, end) / 3_600_000);
}

export function differenceInDays(start: DateInput, end: DateInput): number {
  return Math.floor(diffMs(start, end) / 86_400_000);
}