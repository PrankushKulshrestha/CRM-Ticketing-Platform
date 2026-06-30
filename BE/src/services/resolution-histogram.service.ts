
import { Ticket } from "../models/Ticket";
import { TICKET_STATUS } from "../constants/constants";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface TtrBucket {
  /** Lower bound of the bucket, in hours (inclusive). */
  minHours: number;
  /** Upper bound of the bucket, in hours (exclusive). null = open-ended. */
  maxHours: number | null;
  /** Human label, e.g. "0-1h", "8-24h", "168h+". */
  label: string;
  count: number;
}

export interface TtrHistogramReport {
  buckets: TtrBucket[];
  /** Tickets included in the histogram (resolved/closed, valid duration). */
  sampleSize: number;
  meanHours: number | null;
  medianHours: number | null;
}

/* -------------------------------------------------------------------------- */
/* Bucket Definition                                                         */
/* -------------------------------------------------------------------------- */

/*
 * Hour-based buckets. Fine-grained near zero (where most tickets land,
 * since support tickets skew toward fast resolution) and progressively
 * wider further out, since the long tail matters less granularly.
 */
const BUCKET_EDGES: Array<[number, number | null]> = [
  [0, 1],
  [1, 2],
  [2, 4],
  [4, 8],
  [8, 24],
  [24, 48],
  [48, 72],
  [72, 168],
  [168, null],
];

function labelFor(min: number, max: number | null): string {
  if (max === null) return `${min}h+`;
  return `${min}-${max}h`;
}

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export interface TtrHistogramOptions {
  /** Restrict to tickets resolved on/after this date. Omit for all-time. */
  from?: Date;
  /** Restrict to tickets resolved on/before this date. Omit for "through now". */
  to?: Date;
}

export async function getResolutionHistogram(
  options: TtrHistogramOptions = {},
): Promise<TtrHistogramReport> {
  const match: Record<string, unknown> = {
    resolved_date: { $ne: null },
    tkt_status: { $in: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
  };

  if (options.from || options.to) {
    match.resolved_date = {
      $ne: null,
      ...(options.from ? { $gte: options.from } : {}),
      ...(options.to ? { $lte: options.to } : {}),
    };
  }

  const rows = await Ticket.aggregate<{ hours: number }>([
    { $match: match },
    {
      $project: {
        hours: {
          $divide: [
            { $subtract: ["$resolved_date", "$created_date"] },
            3_600_000,
          ],
        },
      },
    },
    { $match: { hours: { $gte: 0 } } },
    { $sort: { hours: 1 } },
  ]);

  const buckets: TtrBucket[] = BUCKET_EDGES.map(([minHours, maxHours]) => ({
    minHours,
    maxHours,
    label: labelFor(minHours, maxHours),
    count: 0,
  }));

  let sum = 0;

  for (const row of rows) {
    sum += row.hours;

    const bucket =
      buckets.find(
        (b) =>
          row.hours >= b.minHours &&
          (b.maxHours === null || row.hours < b.maxHours),
      ) ?? buckets[buckets.length - 1];

    bucket.count += 1;
  }

  const sampleSize = rows.length;
  const meanHours =
    sampleSize > 0 ? Math.round((sum / sampleSize) * 10) / 10 : null;

  let medianHours: number | null = null;
  if (sampleSize > 0) {
    const mid = Math.floor(sampleSize / 2);
    medianHours =
      sampleSize % 2 === 0
        ? Math.round(((rows[mid - 1].hours + rows[mid].hours) / 2) * 10) / 10
        : Math.round(rows[mid].hours * 10) / 10;
  }

  return { buckets, sampleSize, meanHours, medianHours };
}
