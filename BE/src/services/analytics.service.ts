
import { Ticket, TICKET_PRIORITY } from "../models/Ticket";
import { SLA_STATUSES } from "../models/SLA";
import { syncDueSLAEscalations } from "./sla.service";
import { TICKET_STATUS } from "../constants/constants";
import type {
  DashboardAnalyticsResponse,
  TicketsByPriority,
  TicketsByStatus,
  SLALevelHealthPoint,
} from "../types/analytics.types";

/* -------------------------------------------------------------------------- */
/* Aggregation Result Shape                                                  */
/* -------------------------------------------------------------------------- */

interface SLAByLevelRaw {
  _id: number;
  count: number;
  breached: number;
}

interface AggregationResult {
  totalTickets: { count: number }[];
  closedTicketsCount: { count: number }[];
  resolvedToday: { count: number }[];
  avgResolution: { avg: number }[];
  breachedSla: { count: number }[];
  slaByLevel: SLAByLevelRaw[];

  /* FIX: color_code is numeric (1=low..4=urgent) at the DB layer. */
  ticketsByPriority: {
    _id: 1 | 2 | 3 | 4;
    count: number;
  }[];

  ticketsByStatus: {
    _id: keyof typeof TICKET_STATUS extends never
      ? string
      : (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS];
    count: number;
  }[];

  customerSatisfaction: {
    avg: number;
  }[];
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatResolutionTime(ms: number): string {
  if (!ms || !Number.isFinite(ms)) return "0h 0m";

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}

function safeCount(arr: { count: number }[] | undefined): number {
  return arr?.[0]?.count ?? 0;
}

function safeAvg(arr: { avg: number }[] | undefined): number {
  return arr?.[0]?.avg ?? 0;
}

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export async function getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
  // FIX: local-midnight (setHours) drifts from MongoDB's UTC day boundary
  // on any server not running in UTC — see dashboard.service.ts's
  // startOfToday() for the full explanation. Use UTC midnight directly so
  // "today" agrees with how resolved_date is actually compared.
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  /*
   * FIX: this entire pipeline previously referenced $resolvedAt, $createdAt,
   * and $priority — none of which exist on the Ticket schema (the real
   * fields are resolved_date, created_date, color_code; confirmed against
   * be/src/models/Ticket.ts). Every duration/priority computation below
   * always evaluated against undefined and silently produced zeros —
   * Mongo doesn't error on a missing field reference, it just treats it
   * as null. Swapped to the real field names throughout.
   */
  // Bring any overdue SLA trackers up to date before reading breach counts —
  // mirrors dashboard.service.ts's getDashboardData(), so both surfaces read
  // the same up-to-date SLA collection instead of each inventing their own
  // hardcoded answer (which is exactly why they used to disagree).
  await syncDueSLAEscalations();

  const [result] = await Ticket.aggregate<AggregationResult>([
    /*
     * FIX: previously computed SLA breach inline with a flat SLA_HOURS=24
     * constant — completely disconnected from the real SLA collection
     * (per-priority, multi-level escalating limits via sla.service.ts).
     * Now joined against the actual SLA tracker per ticket.
     */
    {
      $lookup: {
        from: "slas",
        localField: "_id",
        foreignField: "ticketId",
        as: "slaDoc",
      },
    },
    {
      $addFields: {
        slaStatus: { $arrayElemAt: ["$slaDoc.status", 0] },
        slaLevel: { $arrayElemAt: ["$slaDoc.currentLevel", 0] },
      },
    },
    {
      $addFields: {
        /*
         * FIX: a ticket's "completion date" is resolved_date for resolved
         * tickets and closed_date for closed tickets — previously this
         * only ever looked at resolved_date, so closed tickets fell
         * through to the "still open" branch below and got their SLA
         * breach evaluated against new Date() (i.e. "has it been >24h
         * since it was CREATED, as of right now"), which is wrong for
         * any ticket that was actually closed — it should be measured
         * against when it was closed, not against the current moment.
         */
        completionDate: {
          $switch: {
            branches: [
              {
                case: { $eq: ["$tkt_status", TICKET_STATUS.RESOLVED] },
                then: "$resolved_date",
              },
              {
                case: { $eq: ["$tkt_status", TICKET_STATUS.CLOSED] },
                then: { $ifNull: ["$closed_date", "$resolved_date"] },
              },
            ],
            default: null,
          },
        },
      },
    },
    {
      $addFields: {
        resolutionTimeMs: {
          $cond: [
            { $ne: ["$completionDate", null] },
            { $subtract: ["$completionDate", "$created_date"] },
            null,
          ],
        },

        slaBreachedComputed: {
          $in: ["$slaStatus", [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED]],
        },
      },
    },

    {
      $facet: {
        totalTickets: [{ $count: "count" }],

        /*
         * FIX: SLA compliance must be measured against tickets that have
         * actually completed (resolved or closed) — they're the only
         * ones that could have breached. Dividing by totalTickets instead
         * (every ticket ever, including fresh still-open ones with no
         * chance to breach yet) understated compliance whenever there was
         * any backlog of new tickets.
         */
        closedTicketsCount: [
          { $match: { completionDate: { $ne: null } } },
          { $count: "count" },
        ],

        resolvedToday: [
          {
            $match: {
              tkt_status: TICKET_STATUS.RESOLVED,
              resolved_date: { $gte: startOfDay },
            },
          },
          { $count: "count" },
        ],

        avgResolution: [
          { $match: { resolutionTimeMs: { $ne: null } } },
          {
            $group: {
              _id: null,
              avg: { $avg: "$resolutionTimeMs" },
            },
          },
        ],

        breachedSla: [{ $match: { slaBreachedComputed: true } }, { $count: "count" }],

        /* Per-level (1-5) SLA health breakdown — mirrors dashboard.service.ts. */
        slaByLevel: [
          { $match: { slaLevel: { $ne: null } } },
          {
            $group: {
              _id: "$slaLevel",
              count: { $sum: 1 },
              breached: {
                $sum: {
                  $cond: [
                    { $in: ["$slaStatus", [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED]] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
          { $sort: { _id: 1 } },
        ],

        ticketsByPriority: [
          {
            $group: {
              _id: "$color_code",
              count: { $sum: 1 },
            },
          },
        ],

        ticketsByStatus: [
          {
            $group: {
              _id: "$tkt_status",
              count: { $sum: 1 },
            },
          },
        ],

        customerSatisfaction: [
          { $match: { customerSatisfaction: { $ne: null } } },
          {
            $group: {
              _id: null,
              avg: { $avg: "$customerSatisfaction" },
            },
          },
        ],
      },
    },
  ]);

  const data = result ?? ({} as AggregationResult);

  /* ---------------------------------------------------------------------- */
  /* Base Metrics                                                          */
  /* ---------------------------------------------------------------------- */

  const closedTicketsCount = safeCount(data.closedTicketsCount);
  const resolvedToday = safeCount(data.resolvedToday);
  const breachedSla = safeCount(data.breachedSla);

  const avgResolutionMs = safeAvg(data.avgResolution);
  const customerSatisfactionRaw = data.customerSatisfaction?.[0]?.avg ?? null;

  /* ---------------------------------------------------------------------- */
  /* Priority Normalization                                                */
  /* ---------------------------------------------------------------------- */

  /*
   * FIX: color_code is numeric (1-4) at the DB layer, but
   * TicketsByPriority's keys are the string union "low"|"medium"|"high"
   * |"urgent" (matching constants.ts's TicketPriority, used by
   * ticket.service.ts's PRIORITY_TO_COLOR_CODE map elsewhere). Map the
   * numeric grouping result back to those string buckets here.
   */
  const PRIORITY_NUMBER_TO_KEY: Record<number, keyof TicketsByPriority> = {
    [TICKET_PRIORITY.LOW]: "low",
    [TICKET_PRIORITY.MEDIUM]: "medium",
    [TICKET_PRIORITY.HIGH]: "high",
    [TICKET_PRIORITY.URGENT]: "urgent",
  };

  const ticketsByPriority: TicketsByPriority = {
    low: 0,
    medium: 0,
    high: 0,
    urgent: 0,
  };

  for (const item of data.ticketsByPriority ?? []) {
    const key = PRIORITY_NUMBER_TO_KEY[item._id];
    if (key) {
      ticketsByPriority[key] = item.count;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Status Normalization                                                  */
  /* ---------------------------------------------------------------------- */

  /*
   * FIX: previously only handled "open" | "in_progress" | "resolved" —
   * tickets in "pending" or "closed" (two of the four real statuses)
   * matched no case and were silently dropped from the response.
   */
  const ticketsByStatus: TicketsByStatus = {
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    new: 0,
    reopened: 0,
    request_clarification: 0
  };

  for (const item of data.ticketsByStatus ?? []) {
    if (item._id in ticketsByStatus) {
      ticketsByStatus[item._id as keyof TicketsByStatus] = item.count;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Final Response                                                        */
  /* ---------------------------------------------------------------------- */

  // All 5 levels always present (zero-filled), matching dashboard.service.ts.
  const slaByLevelMap = new Map((data.slaByLevel ?? []).map((p) => [p._id, p]));
  const slaByLevel: SLALevelHealthPoint[] = [1, 2, 3, 4, 5].map((level) => {
    const point = slaByLevelMap.get(level);
    const count = point?.count ?? 0;
    const breached = point?.breached ?? 0;
    return { level, count, breached, healthy: count - breached };
  });

  return {
    resolvedToday,

    avgResolutionTime: formatResolutionTime(avgResolutionMs),

    breachedSla,

    slaCompliance:
      closedTicketsCount === 0
        ? 100
        : Number((((closedTicketsCount - breachedSla) / closedTicketsCount) * 100).toFixed(1)),

    slaByLevel,

    customerSatisfaction:
      customerSatisfactionRaw !== null
        ? Number(customerSatisfactionRaw.toFixed(1))
        : null,

    ticketsByPriority,
    ticketsByStatus,
  };
}
