
import mongoose from "mongoose";
import SLAModel, { SLA_STATUSES, type SLADocument, type SLAPriority, type SLAStatus } from "../models/SLA";
import SLAPolicyModel, {
  DEFAULT_SLA_POLICY,
  type ISLAPolicy,
  type PriorityLimits,
  type SLALevel,
} from "../models/SLAPolicy";
import { TICKET_PRIORITY, type TicketPriority, Ticket as TicketModel } from "../models/Ticket";
import { TICKET_STATUS, type TicketStatus } from "../constants/constants";
import { AuditLog } from "../models/AuditLog";
import logger from "../config/logger";

/* -------------------------------------------------------------------------- */
/* Priority <-> SLAPriority mapping                                          */
/* SLA.ts uses string priorities (low/medium/high/critical), Ticket.ts uses  */
/* numeric color_code (1-4). "critical" is SLA's name for "urgent".          */
/* -------------------------------------------------------------------------- */

const COLOR_CODE_TO_SLA_PRIORITY: Record<TicketPriority, SLAPriority> = {
  [TICKET_PRIORITY.LOW]: "low",
  [TICKET_PRIORITY.MEDIUM]: "medium",
  [TICKET_PRIORITY.HIGH]: "high",
  [TICKET_PRIORITY.URGENT]: "critical",
};

const SLA_PRIORITY_TO_COLOR_CODE: Record<SLAPriority, TicketPriority> = {
  low: TICKET_PRIORITY.LOW,
  medium: TICKET_PRIORITY.MEDIUM,
  high: TICKET_PRIORITY.HIGH,
  critical: TICKET_PRIORITY.URGENT,
};

/** One step up the priority ladder, capped at urgent (used on escalation). */
function nextPriority(p: TicketPriority): TicketPriority {
  return Math.min(p + 1, TICKET_PRIORITY.URGENT) as TicketPriority;
}

/* -------------------------------------------------------------------------- */
/* Policy access — cached briefly in-process since it's read on every ticket  */
/* fetch/list and rarely changes; avoids a DB round trip per ticket row.      */
/* -------------------------------------------------------------------------- */

let cachedPolicy: ISLAPolicy | null = null;
let cachedAt = 0;
const POLICY_CACHE_MS = 30_000;

export async function getActiveSLAPolicy(): Promise<ISLAPolicy> {
  if (cachedPolicy && Date.now() - cachedAt < POLICY_CACHE_MS) {
    return cachedPolicy;
  }

  let doc = await SLAPolicyModel.findOne({ isActive: true })
    .sort({ updatedAt: -1 })
    .lean<ISLAPolicy | null>();

  if (!doc) {
    doc = (
      await SLAPolicyModel.create({
        isActive: true,
        ...DEFAULT_SLA_POLICY,
      })
    ).toObject();
  }

  cachedPolicy = doc;
  cachedAt = Date.now();
  return doc;
}

export function invalidatePolicyCache(): void {
  cachedPolicy = null;
}

function getPriorityLimits(
  policy: ISLAPolicy,
  priority: SLAPriority,
): PriorityLimits {
  const map = policy.byPriority as unknown as Map<string, PriorityLimits> | Record<string, PriorityLimits>;
  const limits =
    map instanceof Map ? map.get(priority) : (map as Record<string, PriorityLimits>)[priority];
  // Fallback: try direct lookup in DEFAULT_SLA_POLICY using string key
  const defaultLimits = (DEFAULT_SLA_POLICY.byPriority as unknown as Record<string, PriorityLimits>)[priority];
  return limits ?? defaultLimits ?? { responseMinutes: 240, resolutionMinutes: 1440 };
}

function getEscalationMinutes(policy: ISLAPolicy, level: Exclude<SLALevel, 1>): number {
  const map = policy.escalationMinutes as unknown as Map<number, number> | Record<number, number>;
  const minutes = map instanceof Map ? map.get(level) : (map as Record<number, number>)[level];
  return minutes ?? (DEFAULT_SLA_POLICY.escalationMinutes as Record<number, number>)[level] ?? 240;
}

/* -------------------------------------------------------------------------- */
/* CREATE — called once when a ticket is created                             */
/* -------------------------------------------------------------------------- */

export async function createSLAForTicket(
  ticketId: mongoose.Types.ObjectId,
  colorCode: TicketPriority,
  startedAt: Date = new Date(),
): Promise<SLADocument> {
  const policy = await getActiveSLAPolicy();
  const priority = COLOR_CODE_TO_SLA_PRIORITY[colorCode] ?? "medium";
  const limits = getPriorityLimits(policy, priority);

  const responseDueAt = new Date(startedAt.getTime() + limits.responseMinutes * 60_000);
  const resolutionDueAt = new Date(startedAt.getTime() + limits.resolutionMinutes * 60_000);

  return SLAModel.create({
    ticketId,
    priority,
    currentLevel: 1,
    levelStartedAt: startedAt,
    responseTimeLimit: limits.responseMinutes,
    resolutionTimeLimit: limits.resolutionMinutes,
    startedAt,
    responseDueAt,
    resolutionDueAt,
    status: SLA_STATUSES.ACTIVE,
  });
}

/* -------------------------------------------------------------------------- */
/* LAZY RESOLUTION — walk the SLA forward through levels on read              */
/*                                                                            */
/* No scheduler exists in this codebase, so escalation is computed whenever  */
/* a ticket's SLA state is needed (ticket fetch, dashboard, analytics). If   */
/* the computed state differs from what's stored, we persist the catch-up    */
/* (self-healing on read) so subsequent reads/aggregations don't redo the    */
/* walk. A ticket already resolved/closed/cancelled is left untouched.       */
/* -------------------------------------------------------------------------- */

export interface ResolvedSLAState {
  currentLevel: SLALevel;
  status: string;
  resolutionDueAt: Date;
  responseDueAt: Date;
  remainingMs: number; // resolution clock; negative once past resolutionDueAt at the FINAL level
  isResolutionBreached: boolean;
  escalatedPriority: TicketPriority;
  priorityEscalated: boolean;
}

export function computeSLAState(
  sla: Pick<
    ISLADoc,
    "currentLevel" | "levelStartedAt" | "priority" | "status" | "resolutionDueAt" | "responseDueAt"
  >,
  policy: ISLAPolicy,
  now: Date = new Date(),
): ResolvedSLAState {
  let level = sla.currentLevel as SLALevel;
  let levelStartedAt = sla.levelStartedAt;
  let resolutionDueAt = sla.resolutionDueAt;
  let escalated = false;

  // Walk forward: while the current level's resolution window has elapsed
  // and we're not already at the terminal level, escalate.
  while (resolutionDueAt.getTime() <= now.getTime() && level < 5) {
    const nextLevel = (level + 1) as SLALevel;
    const budgetMinutes = getEscalationMinutes(policy, nextLevel as Exclude<SLALevel, 1>);
    levelStartedAt = resolutionDueAt;
    resolutionDueAt = new Date(levelStartedAt.getTime() + budgetMinutes * 60_000);
    level = nextLevel;
    escalated = true;
  }

  const isResolutionBreached = resolutionDueAt.getTime() <= now.getTime();
  const status =
    isResolutionBreached && level === 5
      ? SLA_STATUSES.SLA_VIOLATED
      : isResolutionBreached
        ? SLA_STATUSES.BREACHED
        : SLA_STATUSES.ACTIVE;

  const basePriority = SLA_PRIORITY_TO_COLOR_CODE[sla.priority];
  let escalatedPriority = basePriority;
  for (let i = 1; i < level; i++) escalatedPriority = nextPriority(escalatedPriority);

  return {
    currentLevel: level,
    status,
    resolutionDueAt,
    responseDueAt: sla.responseDueAt,
    remainingMs: resolutionDueAt.getTime() - now.getTime(),
    isResolutionBreached,
    escalatedPriority,
    priorityEscalated: escalated || level > 1,
  };
}

/** Minimal shape computeSLAState needs — kept separate so callers can pass leans or docs. */
interface ISLADoc {
  currentLevel: number;
  levelStartedAt: Date;
  priority: SLAPriority;
  status: string;
  resolutionDueAt: Date;
  responseDueAt: Date;
}

/**
 * Fetch + lazily resolve a single ticket's SLA, persisting any catch-up
 * escalation. Returns null if no SLA tracker exists (e.g. legacy tickets
 * created before this feature).
 */
export async function getResolvedSLAForTicket(
  ticketId: string | mongoose.Types.ObjectId,
): Promise<(ResolvedSLAState & { slaId: string }) | null> {
  let sla = await SLAModel.findOne({ ticketId }).lean<
    (ISLADoc & { _id: mongoose.Types.ObjectId }) | null
  >();

  // FIX #5: If no SLA tracker exists but the ticket is assigned, auto-create one
  // so assigned tickets always show a live SLA countdown.
  if (!sla) {
    try {
      const ticket = await TicketModel
        .findById(ticketId)
        .select({ tkt_assigned_to: 1, color_code: 1, tkt_status: 1, created_date: 1 })
        .lean<{ tkt_assigned_to?: unknown; color_code?: number; tkt_status?: string; created_date?: Date } | null>();

      const isActive = ticket && ticket.tkt_status !== "resolved" && ticket.tkt_status !== "closed";
      const isAssigned = Boolean(ticket?.tkt_assigned_to);
      if (ticket && isActive && isAssigned) {
        const colorCode = (ticket.color_code ?? TICKET_PRIORITY.MEDIUM) as TicketPriority;
        const startedAt = ticket.created_date ?? new Date();
        const created = await createSLAForTicket(new mongoose.Types.ObjectId(ticketId.toString()), colorCode, startedAt);
        sla = created.toObject() as ISLADoc & { _id: mongoose.Types.ObjectId };
      }
    } catch (err) {
      logger.warn("[SLA_AUTO_CREATE_ON_READ_FAILED]", { ticketId, err });
    }
  }

  if (!sla) return null;

  // Terminal states don't keep escalating.
  if (
    sla.status === SLA_STATUSES.RESOLVED ||
    sla.status === SLA_STATUSES.CANCELLED ||
    sla.status === SLA_STATUSES.PAUSED
  ) {
    const basePriority = SLA_PRIORITY_TO_COLOR_CODE[sla.priority];
    let escalatedPriority = basePriority;
    for (let i = 1; i < sla.currentLevel; i++) escalatedPriority = nextPriority(escalatedPriority);

    return {
      slaId: sla._id.toString(),
      currentLevel: sla.currentLevel as SLALevel,
      status: sla.status,
      resolutionDueAt: sla.resolutionDueAt,
      responseDueAt: sla.responseDueAt,
      remainingMs: sla.resolutionDueAt.getTime() - Date.now(),
      isResolutionBreached: (sla.status as string) === SLA_STATUSES.BREACHED || (sla.status as string) === SLA_STATUSES.SLA_VIOLATED,
      escalatedPriority,
      priorityEscalated: sla.currentLevel > 1,
    };
  }

  const policy = await getActiveSLAPolicy();
  const resolved = computeSLAState(sla, policy);

  // Self-heal: persist the catch-up if anything changed.
  if (
    resolved.currentLevel !== sla.currentLevel ||
    resolved.status !== sla.status ||
    resolved.resolutionDueAt.getTime() !== sla.resolutionDueAt.getTime()
  ) {
    await SLAModel.updateOne(
      { _id: sla._id },
      {
        $set: {
          currentLevel: resolved.currentLevel,
          levelStartedAt:
            resolved.currentLevel !== sla.currentLevel ? new Date() : sla.levelStartedAt,
          resolutionDueAt: resolved.resolutionDueAt,
          status: resolved.status,
          isResolutionBreached: resolved.isResolutionBreached,
        },
      },
    ).catch((err) => logger.error("[SLA_SELF_HEAL_WRITE_FAILED]", { ticketId, err }));

    if (resolved.currentLevel !== sla.currentLevel) {
      AuditLog.create({
        action: "STATUS_CHANGE",
        entity: "SLA",
        entityId: sla._id,
        message: `SLA escalated to level ${resolved.currentLevel} for ticket ${ticketId}`,
        metadata: { fromLevel: sla.currentLevel, toLevel: resolved.currentLevel },
      }).catch(() => undefined);
    }
  }

  return { slaId: sla._id.toString(), ...resolved };
}

/* -------------------------------------------------------------------------- */
/* RESOLVE / CANCEL — called when a ticket moves to resolved/closed/reopened  */
/* -------------------------------------------------------------------------- */

export async function markSLAResolved(ticketId: string | mongoose.Types.ObjectId): Promise<void> {
  await SLAModel.updateOne(
    { ticketId, status: { $nin: [SLA_STATUSES.RESOLVED, SLA_STATUSES.CANCELLED] } },
    { $set: { status: SLA_STATUSES.RESOLVED, resolvedAt: new Date() } },
  );
}

export async function reopenSLA(ticketId: string | mongoose.Types.ObjectId): Promise<void> {
  // Reopening resumes the clock from "now" at the same level it left off,
  // rather than resetting to level 1 — a ticket that already escalated
  // shouldn't get a clean slate just because it bounced back open.
  const sla = await SLAModel.findOne({ ticketId });
  if (!sla) return;

  const policy = await getActiveSLAPolicy();
  const budgetMinutes =
    sla.currentLevel === 1
      ? getPriorityLimits(policy, sla.priority).resolutionMinutes
      : getEscalationMinutes(policy, sla.currentLevel as Exclude<SLALevel, 1>);

  sla.status = SLA_STATUSES.ACTIVE;
  sla.levelStartedAt = new Date();
  sla.resolutionDueAt = new Date(Date.now() + budgetMinutes * 60_000);
  sla.resolvedAt = null;
  await sla.save();
}

/* -------------------------------------------------------------------------- */
/* PRIORITY GUARD — agents may only escalate, not demote                      */
/* -------------------------------------------------------------------------- */

export function canChangePriority(
  fromColorCode: TicketPriority,
  toColorCode: TicketPriority,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  return toColorCode >= fromColorCode;
}

export { COLOR_CODE_TO_SLA_PRIORITY, SLA_PRIORITY_TO_COLOR_CODE };

/* -------------------------------------------------------------------------- */
/* BATCH SWEEP — for aggregation-based consumers (dashboard, analytics)       */
/*                                                                            */
/* Those run a single Mongo aggregation directly against the SLA collection  */
/* via $lookup rather than going through getResolvedSLAForTicket() per       */
/* ticket. To keep that data accurate without a scheduler, this does one     */
/* bulk pass immediately before such aggregations: any ACTIVE SLA whose      */
/* resolutionDueAt has already passed gets walked forward and persisted, the */
/* same logic as the single-ticket lazy path, just batched.                  */
/* -------------------------------------------------------------------------- */

export async function syncDueSLAEscalations(): Promise<void> {
  const policy = await getActiveSLAPolicy();
  const now = new Date();

  const due = await SLAModel.find({
    status: { $in: [SLA_STATUSES.ACTIVE, SLA_STATUSES.BREACHED] },
    resolutionDueAt: { $lte: now },
  }).lean<(ISLADoc & { _id: mongoose.Types.ObjectId })[]>();

  if (!due.length) return;

  const bulkOps = due.map((sla) => {
    const resolved = computeSLAState(sla, policy, now);
    const $set: Record<string, unknown> = {
      currentLevel: resolved.currentLevel,
      resolutionDueAt: resolved.resolutionDueAt,
      status: resolved.status as SLAStatus,
      isResolutionBreached: resolved.isResolutionBreached,
    };
    if (resolved.currentLevel !== sla.currentLevel) {
      $set.levelStartedAt = now;
    }
    return {
      updateOne: {
        filter: { _id: sla._id } as Record<string, unknown>,
        update: { $set } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    };
  });

  try {
    await SLAModel.bulkWrite(bulkOps, { ordered: false });
  } catch (err) {
    logger.error("[SLA_BATCH_SWEEP_FAILED]", { err, count: bulkOps.length });
  }
}
