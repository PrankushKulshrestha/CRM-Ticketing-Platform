
import { Ticket } from "../models/Ticket";
import { TICKET_STATUS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface MonthlyResponsePoint {
  /** "YYYY-MM" */
  month: string;

  /** Average First Response Time, in minutes. null if no data for the month. */
  avgFirstResponseMinutes: number | null;
  /** Ticket count contributing to avgFirstResponseMinutes. */
  firstResponseSampleSize: number;

  /** Average First Contact Resolution time, in minutes. null if no data. */
  avgFirstResolutionMinutes: number | null;
  /** Ticket count contributing to avgFirstResolutionMinutes. */
  firstResolutionSampleSize: number;

  /** FCR rate: % of resolved tickets in the month resolved without reopen. */
  fcrRate: number | null;
}

export interface ResponseTimeReport {
  /** Oldest-first, one point per calendar month in range. */
  months: MonthlyResponsePoint[];
}

interface RawFrtPoint {
  _id: string;
  avgMinutes: number;
  count: number;
}

interface RawFcrPoint {
  _id: string;
  avgMinutes: number;
  resolvedCount: number;
  firstContactCount: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

/** Oldest-first list of "YYYY-MM" strings, `count` months ending this month. */
function lastNMonths(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setUTCMonth(d.getUTCMonth() - i);
    out.push(monthKey(d));
  }
  return out;
}

const round1 = (n: number): number => Math.round(n * 10) / 10;

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

const DEFAULT_MONTHS = 12 as const;

export async function getMonthlyResponseTimes(
  months: number = DEFAULT_MONTHS,
): Promise<ResponseTimeReport> {
  const monthKeys = lastNMonths(Math.min(Math.max(months, 1), 36));
  const windowStart = new Date(`${monthKeys[0]}-01T00:00:00.000Z`);

  /*
   * First Response Time: created_date -> first_response_at, grouped by the
   * month the ticket was CREATED (so "this month's FRT" answers "how fast
   * did we respond to tickets that came in this month", which is the
   * standard framing — grouping by response month instead would blend in
   * response speed for tickets that came in long before the window).
   */
  const frtRows = await Ticket.aggregate<RawFrtPoint>([
    {
      $match: {
        created_date: { $gte: windowStart },
        first_response_at: { $ne: null },
      },
    },
    {
      $project: {
        month: { $dateToString: { format: "%Y-%m", date: "$created_date" } },
        responseMinutes: {
          $divide: [
            { $subtract: ["$first_response_at", "$created_date"] },
            60000,
          ],
        },
      },
    },
    // Negative durations would only occur from clock skew / bad data —
    // exclude rather than let them drag the average down.
    { $match: { responseMinutes: { $gte: 0 } } },
    {
      $group: {
        _id: "$month",
        avgMinutes: { $avg: "$responseMinutes" },
        count: { $sum: 1 },
      },
    },
  ]);

  /*
   * First Contact Resolution: created_date -> resolved_date, but ONLY for
   * tickets that were resolved AND never reopened (was_reopened: false/
   * unset). This is the genuine FCR definition — resolved on the first
   * interaction, no back-and-forth. Tickets that bounced back via reopen
   * are excluded from both the time average and (implicitly, since the
   * denominator below is "all resolved tickets that month") the rate.
   *
   * Grouped by the month the ticket was RESOLVED, since FCR is fundamentally
   * about resolution-event throughput/quality for that period, not
   * intake volume.
   */
  const fcrRows = await Ticket.aggregate<RawFcrPoint>([
    {
      $match: {
        resolved_date: { $gte: windowStart, $ne: null },
        tkt_status: { $in: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
      },
    },
    {
      $project: {
        month: {
          $dateToString: { format: "%Y-%m", date: "$resolved_date" },
        },
        resolutionMinutes: {
          $divide: [
            { $subtract: ["$resolved_date", "$created_date"] },
            60000,
          ],
        },
        firstContact: { $ne: ["$was_reopened", true] },
      },
    },
    { $match: { resolutionMinutes: { $gte: 0 } } },
    {
      $group: {
        _id: "$month",
        avgMinutes: {
          $avg: {
            $cond: ["$firstContact", "$resolutionMinutes", null],
          },
        },
        resolvedCount: { $sum: 1 },
        firstContactCount: { $sum: { $cond: ["$firstContact", 1, 0] } },
      },
    },
  ]);

  const frtMap = new Map(frtRows.map((r) => [r._id, r]));
  const fcrMap = new Map(fcrRows.map((r) => [r._id, r]));

  const months_: MonthlyResponsePoint[] = monthKeys.map((month) => {
    const frt = frtMap.get(month);
    const fcr = fcrMap.get(month);

    return {
      month,
      avgFirstResponseMinutes:
        frt && Number.isFinite(frt.avgMinutes) ? round1(frt.avgMinutes) : null,
      firstResponseSampleSize: frt?.count ?? 0,

      avgFirstResolutionMinutes:
        fcr && Number.isFinite(fcr.avgMinutes) ? round1(fcr.avgMinutes) : null,
      firstResolutionSampleSize: fcr?.firstContactCount ?? 0,

      fcrRate:
        fcr && fcr.resolvedCount > 0
          ? round1((fcr.firstContactCount / fcr.resolvedCount) * 100)
          : null,
    };
  });

  return { months: months_ };
}
