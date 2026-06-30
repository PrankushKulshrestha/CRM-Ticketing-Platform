
import mongoose from "mongoose";
import TicketModel, { TICKET_PRIORITY, type TicketPriority } from "../models/Ticket";
import TeamModel from "../models/Team";
import { ApiError } from "../utils/ApiError";
import { AuditLog } from "../models/AuditLog";
import {
  createSLAForTicket,
  getResolvedSLAForTicket,
  markSLAResolved,
  reopenSLA,
  canChangePriority,
} from "./sla.service";
import { applyAutomationRules } from "./automation.service";
import { requestFeedback } from "./feedback.service";
import { isWithinNewTicketWindow } from "./systemSettings.service";

import {
  TICKET_STATUS,
  TICKET_NUMBER_PREFIX,
  AUDIT_ACTIONS,
  type TicketStatus,
  type TicketClassification,
} from "../constants/constants";

import type {
  TicketFilters,
  Ticket,
  CreateTicketPayload,
  UpdateTicketPayload,
} from "../types/ticket.types";

import logger from "../config/logger";

/* -------------------------------------------------------------------------- */
/* MONGOOSE LEAN TYPE                                                         */
/* -------------------------------------------------------------------------- */

type LeanAgent = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role?: string;
};

type LeanTicket = {
  _id: mongoose.Types.ObjectId;

  tkt_number: string;
  email_subject?: string;

  tkt_status: TicketStatus;
  tkt_type?: TicketClassification;

  created_date: Date;
  update_date?: Date | null;

  color_code?: number;

  /* FIX: these existed on the schema/type but were never selected or mapped */
  description?: string;
  tkt_customer_name?: string;
  tkt_customer_mobile?: string;
  eml_ticket_created_for?: string;
  cat_id?: string;
  sub_cat_id?: string;
  sub_sub_cat_id?: string;
  remarks_n?: string;
  tkt_user?: string;
  source?: string;

  /* FIX: agent assignment never existed before */
  tkt_assigned_to?: LeanAgent | mongoose.Types.ObjectId | null;

  /* Lifecycle dates — already on the schema, now actually populated below */
  resolved_date?: Date | null;
  closed_date?: Date | null;
  first_response_at?: Date | null;
  was_reopened?: boolean;

  /* FIX: were missing from LeanTicket — fields exist in schema and SAFE_FIELDS */
  customer_satisfaction?: number | null;
  feedback_requested_at?: Date | null;
  /* Merge fields */
  merged_into?: mongoose.Types.ObjectId | null;
  merged_at?: Date | null;

  tkt_team?: mongoose.Types.ObjectId | null;
};

/* -------------------------------------------------------------------------- */
/* SAFE PROJECTION                                                           */
/* -------------------------------------------------------------------------- */

const SAFE_FIELDS = {
  tkt_number: 1,
  email_subject: 1,
  tkt_status: 1,
  tkt_type: 1,
  created_date: 1,
  update_date: 1,
  color_code: 1,

  /* FIX: these were stored but never returned to the frontend */
  description: 1,
  tkt_customer_name: 1,
  tkt_customer_mobile: 1,
  eml_ticket_created_for: 1,
  cat_id: 1,
  sub_cat_id: 1,
  sub_sub_cat_id: 1,
  remarks_n: 1,
  tkt_user: 1,
  source: 1,
  tkt_assigned_to: 1,

  resolved_date: 1,
  closed_date: 1,
  first_response_at: 1,
  was_reopened: 1,

  /* FIX: previously missing from projection — stored but silently dropped */
  customer_satisfaction: 1,
  feedback_requested_at: 1,
  tkt_team: 1,
  merged_into: 1,
  merged_at: 1,
} as const;

/* -------------------------------------------------------------------------- */
/* DB → DOMAIN MAPPER                                                        */
/* -------------------------------------------------------------------------- */

const toAssignee = (
  agent: LeanTicket["tkt_assigned_to"],
): Ticket["assignee"] => {
  if (!agent || agent instanceof mongoose.Types.ObjectId) return null;
  return {
    id: agent._id.toString(),
    name: agent.name,
    email: agent.email,
    role: agent.role,
  };
};

const toTicket = (
  doc: LeanTicket,
  extras?: { team?: Ticket["team"]; sla?: Ticket["sla"] },
): Ticket => ({
  id: doc._id.toString(),
  tkt_number: doc.tkt_number,

  email_subject: doc.email_subject ?? "",

  tkt_status: doc.tkt_status,
  tkt_type: doc.tkt_type ?? "General",

  created_date: doc.created_date,
  update_date: doc.update_date ?? undefined,

  color_code: doc.color_code ?? TICKET_PRIORITY.MEDIUM,

  /* FIX: previously dropped on the floor — never reached the frontend */
  description: doc.description ?? "",
  tkt_customer_name: doc.tkt_customer_name ?? "",
  tkt_customer_mobile: doc.tkt_customer_mobile ?? "",
  eml_ticket_created_for: doc.eml_ticket_created_for ?? "",
  cat_id: doc.cat_id ?? "",
  sub_cat_id: doc.sub_cat_id ?? "",
  sub_sub_cat_id: doc.sub_sub_cat_id ?? "",
  remarks_n: doc.remarks_n ?? "",
  tkt_user: doc.tkt_user ?? "",

  /* FIX: agent assignment now populated and shaped for the frontend */
  tkt_assigned_to:
    doc.tkt_assigned_to instanceof mongoose.Types.ObjectId
      ? doc.tkt_assigned_to.toString()
      : (doc.tkt_assigned_to?._id?.toString() ?? null),
  assignee: toAssignee(doc.tkt_assigned_to),

  /** Assigned team — derived from the assignee's Team.members membership. */
  team: extras?.team ?? null,

  /** Multi-level SLA state, lazily resolved by the caller. */
  sla: extras?.sla ?? null,

  customer_satisfaction: doc.customer_satisfaction ?? null,
  feedback_requested_at: doc.feedback_requested_at ?? null,

  /*
   * FIX: ticket.types.ts's Ticket interface already declares these two
   * fields (resolved_date?, closed_date?) and SAFE_FIELDS already selects
   * them, but toTicket() never copied them onto the output object — they
   * were stored correctly in Mongo but silently dropped before reaching
   * the API response. Needed for any ticket-detail UI that wants to show
   * "Resolved on: <date>".
   */
  resolved_date: doc.resolved_date ?? undefined,
  closed_date: doc.closed_date ?? undefined,
  first_response_at: doc.first_response_at ?? undefined,
  was_reopened: doc.was_reopened ?? false,
  merged_into: doc.merged_into?.toString() ?? null,
  merged_at: doc.merged_at ?? undefined,
});

/* -------------------------------------------------------------------------- */
/* TEAM LOOKUP — batched, since "team" isn't stored on Ticket directly        */
/* -------------------------------------------------------------------------- */

/**
 * Resolves "which team is this agent on" for a batch of agent ids in one
 * query, rather than N+1 lookups per ticket row. An agent is assumed to
 * belong to at most one team (Team.members is checked with $in).
 */
async function batchResolveTeams(
  agentIds: (mongoose.Types.ObjectId | undefined | null)[],
): Promise<Map<string, { id: string; name: string }>> {
  const ids = [...new Set(agentIds.filter((id): id is mongoose.Types.ObjectId => !!id).map((id) => id.toString()))];
  if (!ids.length) return new Map();

  const teams = await TeamModel.find({
    members: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select({ name: 1, members: 1 })
    .lean<{ _id: mongoose.Types.ObjectId; name: string; members: mongoose.Types.ObjectId[] }[]>();

  const map = new Map<string, { id: string; name: string }>();
  for (const team of teams) {
    for (const memberId of team.members) {
      const key = memberId.toString();
      // First team found wins if an agent is (incorrectly) on multiple teams.
      if (!map.has(key)) map.set(key, { id: team._id.toString(), name: team.name });
    }
  }
  return map;
}

/* -------------------------------------------------------------------------- */
/* SLA BATCH ATTACH                                                          */
/* -------------------------------------------------------------------------- */

async function batchResolveSLA(
  ticketIds: mongoose.Types.ObjectId[],
): Promise<Map<string, Ticket["sla"]>> {
  const map = new Map<string, Ticket["sla"]>();
  await Promise.all(
    ticketIds.map(async (id) => {
      const resolved = await getResolvedSLAForTicket(id);
      if (!resolved) return;
      map.set(id.toString(), {
        currentLevel: resolved.currentLevel,
        status: resolved.status,
        resolutionDueAt: resolved.resolutionDueAt.toISOString(),
        responseDueAt: resolved.responseDueAt.toISOString(),
        remainingMs: resolved.remainingMs,
        isResolutionBreached: resolved.isResolutionBreached,
        escalatedPriority: resolved.escalatedPriority,
        priorityEscalated: resolved.priorityEscalated,
      });
    }),
  );
  return map;
}

/* -------------------------------------------------------------------------- */
/* QUERY BUILDER                                                             */
/* -------------------------------------------------------------------------- */

const buildQuery = (filters: TicketFilters): Record<string, unknown> => {
  const query: Record<string, unknown> = {};

  if (filters.tkt_status) query.tkt_status = filters.tkt_status;
  if (filters.tkt_type) query.tkt_type = filters.tkt_type;

  if (filters.cat_id) query.cat_id = filters.cat_id;
  if (filters.sub_cat_id) query.sub_cat_id = filters.sub_cat_id;
  if (filters.sub_sub_cat_id) query.sub_sub_cat_id = filters.sub_sub_cat_id;

  if (filters.tkt_user) query.tkt_user = filters.tkt_user;

  if (filters.search?.trim()) {
    const s = filters.search.trim();

    query.$or = [
      { tkt_number: { $regex: s, $options: "i" } },
      { email_subject: { $regex: s, $options: "i" } },
      { tkt_customer_name: { $regex: s, $options: "i" } },
      { eml_ticket_created_for: { $regex: s, $options: "i" } },
    ];
  }

  // Exclude merged tickets from default listing
  query.merged_into = null;

  return query;
};

/* -------------------------------------------------------------------------- */
/* SERVICE                                                                   */
/* -------------------------------------------------------------------------- */

export class TicketService {
  /* ---------------------------------------------------------------------- */
  /* LIST                                                                  */
  /* ---------------------------------------------------------------------- */

  static async getTickets(filters: TicketFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const skip = (page - 1) * limit;

    const query = buildQuery(filters);

    const [docs, total] = await Promise.all([
      TicketModel.find(query)
        .select(SAFE_FIELDS)
        .populate("tkt_assigned_to", "name email role")
        .sort({ created_date: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanTicket[]>(),

      TicketModel.countDocuments(query),
    ]);

    // Batch-resolve team + SLA for this page only — avoids N+1 queries.
    const [teamMap, slaMap] = await Promise.all([
      batchResolveTeams(
        docs.map((d) =>
          d.tkt_assigned_to instanceof mongoose.Types.ObjectId
            ? d.tkt_assigned_to
            : d.tkt_assigned_to?._id,
        ),
      ),
      batchResolveSLA(docs.map((d) => d._id)),
    ]);

    // Also batch-resolve tkt_team names for the fallback case
    const tktTeamIds = docs.map((d) => d.tkt_team).filter((id): id is mongoose.Types.ObjectId => !!id);
    const directTeams = tktTeamIds.length
      ? await TeamModel
          .find({ _id: { $in: tktTeamIds } })
          .select({ name: 1 })
          .lean<{ _id: mongoose.Types.ObjectId; name: string }[]>()
      : [];
    const directTeamMap = new Map(
      directTeams.map((t: { _id: mongoose.Types.ObjectId; name: string }) => [
        t._id.toString(),
        { id: t._id.toString(), name: t.name },
      ]),
    );

    return {
      data: docs.map((doc) => {
        const agentId =
          doc.tkt_assigned_to instanceof mongoose.Types.ObjectId
            ? doc.tkt_assigned_to.toString()
            : doc.tkt_assigned_to?._id?.toString();
        const teamFromAgent = agentId ? (teamMap.get(agentId) ?? null) : null;
        const teamFromDirect: { id: string; name: string } | null =
          doc.tkt_team ? (directTeamMap.get(doc.tkt_team.toString()) ?? null) : null;
        return toTicket(doc, {
          team: teamFromAgent ?? teamFromDirect,
          sla: slaMap.get(doc._id.toString()) ?? null,
        });
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------------------------------------------------------------------- */
  /* SINGLE                                                                */
  /* ---------------------------------------------------------------------- */

  static async getTicketById(id: string): Promise<Ticket> {
    const doc = await TicketModel.findById(id)
      .select(SAFE_FIELDS)
      .populate("tkt_assigned_to", "name email role")
      .lean<LeanTicket>();

    if (!doc) throw new ApiError(404, "Ticket not found");

    const agentId =
      doc.tkt_assigned_to instanceof mongoose.Types.ObjectId
        ? doc.tkt_assigned_to.toString()
        : doc.tkt_assigned_to?._id?.toString();

    const [teamMap, resolvedSla] = await Promise.all([
      agentId
        ? batchResolveTeams([new mongoose.Types.ObjectId(agentId)])
        : Promise.resolve(new Map<string, { id: string; name: string }>()),
      getResolvedSLAForTicket(doc._id),
    ]);

    return toTicket(doc, {
      team: agentId ? (teamMap.get(agentId) ?? null) : null,
      sla: resolvedSla
        ? {
            currentLevel: resolvedSla.currentLevel,
            status: resolvedSla.status,
            resolutionDueAt: resolvedSla.resolutionDueAt.toISOString(),
            responseDueAt: resolvedSla.responseDueAt.toISOString(),
            remainingMs: resolvedSla.remainingMs,
            isResolutionBreached: resolvedSla.isResolutionBreached,
            escalatedPriority: resolvedSla.escalatedPriority,
            priorityEscalated: resolvedSla.priorityEscalated,
          }
        : null,
    });
  }

  /* ---------------------------------------------------------------------- */
  /* CREATE                                                                */
  /* ---------------------------------------------------------------------- */

  static async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const now = new Date();
    const _id = new mongoose.Types.ObjectId();

    const tkt_number =
      `${TICKET_NUMBER_PREFIX}-${_id.toHexString().slice(-8).toUpperCase()}`;

    const colorCode = payload.color_code ?? TICKET_PRIORITY.MEDIUM;

    // Tickets created within the admin-configured window default to "new".
    // If the caller explicitly passes a status, honour that instead.
    const defaultStatus = payload.tkt_status
      ? payload.tkt_status
      : (await isWithinNewTicketWindow(now))
        ? TICKET_STATUS.NEW
        : TICKET_STATUS.OPEN;

    const created = await TicketModel.create({
      _id,

      ...payload,

      tkt_number,
      email_fingerprint: `manual:${_id.toHexString()}`,

      tkt_status: defaultStatus,
      color_code: colorCode,

      created_date: now,
      update_date: now,
    });

    // Every ticket gets an SLA tracker at creation time.
    try {
      await createSLAForTicket(_id, colorCode as TicketPriority, now);
    } catch (err) {
      logger.error("[SLA_CREATE_FAILED]", { ticketId: _id, err });
    }

    // Apply automation rules for ticket_created trigger (best-effort, non-blocking).
    applyAutomationRules("ticket_created", _id).catch((err) =>
      logger.error("[AUTOMATION_CREATE_TRIGGER_FAILED]", { ticketId: _id, err }),
    );

    const lean = await TicketModel.findById(created._id)
      .select(SAFE_FIELDS)
      .populate("tkt_assigned_to", "name email role")
      .lean<LeanTicket>();

    if (!lean) throw new ApiError(500, "Ticket creation failed");

    return toTicket(lean);
  }

  /* ---------------------------------------------------------------------- */
  /* UPDATE                                                                */
  /* ---------------------------------------------------------------------- */

  static async updateTicket(
    id: string,
    payload: UpdateTicketPayload,
    actingUserId?: string,
    actingUserRole?: string,
  ): Promise<Ticket> {
    /* FIX: "" from a cleared dropdown is not a valid ObjectId — treat as unassign */
    const normalizedPayload: UpdateTicketPayload & {
      resolved_date?: Date | null;
      closed_date?: Date | null;
      was_reopened?: boolean;
    } = {
      ...payload,
      ...(payload.tkt_assigned_to === ""
        ? { tkt_assigned_to: null }
        : {}),
    };

    /*
     * FIX: this is the core gap — updateTicket previously $set'd whatever
     * came in on `payload` with no awareness of status transitions, so
     * resolved_date/closed_date stayed null forever no matter how many
     * times a ticket moved to "resolved" or "closed". We need the
     * *previous* status to know whether this call is actually a
     * transition (and to log it), so fetch it first. This adds one cheap
     * indexed read before the update — acceptable for a low-frequency,
     * user-initiated action like a status change.
     */
    let previousStatus: TicketStatus | undefined;
    let previousAssigned: mongoose.Types.ObjectId | null | undefined;

    const needsExisting = !!normalizedPayload.tkt_status || normalizedPayload.color_code !== undefined || normalizedPayload.tkt_assigned_to !== undefined;

    if (needsExisting) {
      const existing = await TicketModel.findById(id)
        .select({ tkt_status: 1, color_code: 1, tkt_assigned_to: 1 })
        .lean<{ tkt_status: TicketStatus; color_code?: TicketPriority; tkt_assigned_to?: mongoose.Types.ObjectId | null } | null>();

      if (!existing) throw new ApiError(404, "Ticket not found");

      previousAssigned = existing.tkt_assigned_to ?? null;

      /*
       * Multi-level SLA rule: agents may only ESCALATE priority (raise it),
       * never demote it. Only admins can lower a ticket's priority — e.g.
       * walking back an over-escalated urgent ticket. This guards against
       * an agent quietly dodging SLA pressure by downgrading urgency.
       */
      if (normalizedPayload.color_code !== undefined) {
        const fromColorCode = (existing.color_code ?? TICKET_PRIORITY.MEDIUM) as TicketPriority;
        const toColorCode = normalizedPayload.color_code as TicketPriority;
        const isAdmin = actingUserRole === "admin";

        if (!canChangePriority(fromColorCode, toColorCode, isAdmin)) {
          throw new ApiError(
            403,
            "Only admins can lower a ticket's priority — agents may only escalate it.",
          );
        }
      }

      previousStatus = existing.tkt_status;
    }

    if (normalizedPayload.tkt_status) {
      const newStatus = normalizedPayload.tkt_status;

      if (newStatus !== previousStatus) {
        if (newStatus === TICKET_STATUS.RESOLVED) {
          normalizedPayload.resolved_date = new Date();
        }
        if (newStatus === TICKET_STATUS.CLOSED) {
          normalizedPayload.closed_date = new Date();
        }
        // Reopening (back to open/pending) clears stale lifecycle dates so
        // a ticket that goes resolved -> open -> resolved again gets a
        // fresh resolved_date instead of keeping the first one, and isn't
        // double-counted as already resolved in dashboard trend queries.
        if (
          newStatus === TICKET_STATUS.OPEN ||
          newStatus === TICKET_STATUS.PENDING
        ) {
          normalizedPayload.resolved_date = null;
          normalizedPayload.closed_date = null;

          // FRT/FCR: if this ticket had already been resolved or closed
          // once before, mark it permanently as reopened. This is set-once
          // (never cleared back to false) and is independent of the
          // resolved_date/closed_date reset above, so First Contact
          // Resolution reporting can still tell "resolved cleanly the
          // first time" apart from "took multiple rounds" even after the
          // lifecycle dates get wiped for the trend dashboard's sake.
          if (
            previousStatus === TICKET_STATUS.RESOLVED ||
            previousStatus === TICKET_STATUS.CLOSED
          ) {
            normalizedPayload.was_reopened = true;
          }
        }
      }
    }

    const updated = await TicketModel.findByIdAndUpdate(
      id,
      {
        $set: {
          ...normalizedPayload,
          update_date: new Date(),
        },
      },
      { new: true }
    )
      .select(SAFE_FIELDS)
      .populate("tkt_assigned_to", "name email role")
      .lean<LeanTicket>();

    if (!updated) throw new ApiError(404, "Ticket not found");

    /*
     * FIX: no audit trail existed for status transitions. Best-effort —
     * wrapped so a logging failure never blocks the status update that
     * already succeeded above.
     */
    if (previousStatus && previousStatus !== normalizedPayload.tkt_status) {
      try {
        await AuditLog.create({
          userId: actingUserId
            ? new mongoose.Types.ObjectId(actingUserId)
            : undefined,
          action: AUDIT_ACTIONS.STATUS_CHANGE,
          entity: "Ticket",
          entityId: updated._id,
          message: `Status changed from ${previousStatus} to ${normalizedPayload.tkt_status}`,
          metadata: {
            fromStatus: previousStatus,
            toStatus: normalizedPayload.tkt_status,
          },
        });
      } catch (err) {
        logger.error("[TICKET_STATUS_AUDIT_LOG_FAILED]", {
          ticketId: id,
          err,
        });
      }

      // Keep the SLA tracker's lifecycle in sync with the ticket's status.
      const newStatus = normalizedPayload.tkt_status;
      try {
        if (newStatus === TICKET_STATUS.RESOLVED || newStatus === TICKET_STATUS.CLOSED) {
          await markSLAResolved(updated._id);
        } else if (
          newStatus === TICKET_STATUS.OPEN ||
          newStatus === TICKET_STATUS.PENDING ||
          newStatus === TICKET_STATUS.REOPENED ||
          newStatus === TICKET_STATUS.REQUEST_CLARIFICATION ||
          newStatus === TICKET_STATUS.NEW
        ) {
          if (previousStatus === TICKET_STATUS.RESOLVED || previousStatus === TICKET_STATUS.CLOSED) {
            await reopenSLA(updated._id);
          }
        }
      } catch (err) {
        logger.error("[SLA_LIFECYCLE_SYNC_FAILED]", { ticketId: id, err });
      }

      // Apply status_changed automation rules.
      applyAutomationRules("status_changed", updated._id).catch((err) =>
        logger.error("[AUTOMATION_STATUS_TRIGGER_FAILED]", { ticketId: id, err }),
      );

      // First time a ticket is resolved, kick off the feedback request email.
      if (newStatus === TICKET_STATUS.RESOLVED) {
        try {
          await requestFeedback(updated);
        } catch (err) {
          logger.error("[FEEDBACK_REQUEST_TRIGGER_FAILED]", { ticketId: id, err });
        }
      }
    }

    // FIX #5: Auto-create SLA when a ticket is assigned for the first time.
    if (normalizedPayload.tkt_assigned_to !== undefined) {
      await TicketService.ensureSLAOnAssignment(updated, previousAssigned);
    }

    return toTicket(updated);
  }

  /* ---------------------------------------------------------------------- */
  /* SLA AUTO-SET ON ASSIGNMENT                                             */
  /* ---------------------------------------------------------------------- */
  /*
   * FIX #5: When a ticket is assigned (tkt_assigned_to changes from null/unset
   * to a real agent), auto-create or reset the SLA tracker so every assigned
   * ticket always has an active SLA. Previously, SLA was only created at
   * ticket creation time via createTicket(); tickets assigned later never
   * got an SLA. This method is called inside updateTicket() when
   * tkt_assigned_to changes.
   */
  private static async ensureSLAOnAssignment(
    updated: LeanTicket,
    previousAssigned: mongoose.Types.ObjectId | null | undefined,
  ): Promise<void> {
    const nowAssigned = updated.tkt_assigned_to instanceof mongoose.Types.ObjectId
      ? updated.tkt_assigned_to
      : (updated.tkt_assigned_to as LeanAgent | null)?._id ?? null;

    // Only trigger if assignment just happened (was unset before)
    const wasUnassigned = !previousAssigned;
    const isNowAssigned = !!nowAssigned;

    if (wasUnassigned && isNowAssigned) {
      try {
        const { SLA } = await import("../models/SLA");
        const existing = await SLA.findOne({ ticketId: updated._id, status: { $in: ["active", "breached"] } }).lean();
        if (!existing) {
          const colorCode = (updated.color_code ?? TICKET_PRIORITY.MEDIUM) as TicketPriority;
          await createSLAForTicket(updated._id, colorCode, new Date());
          logger.info("[SLA_AUTO_CREATED_ON_ASSIGN]", { ticketId: updated._id });
        }
      } catch (err) {
        logger.error("[SLA_AUTO_ASSIGN_FAILED]", { ticketId: updated._id, err });
      }
    }
  }

  /* ---------------------------------------------------------------------- */
  /* MERGE TICKETS                                                           */
  /* ---------------------------------------------------------------------- */
  /*
   * FIX #3: Merges sourceId INTO targetId. All comments from the source
   * ticket are re-parented to the target. The source ticket is then marked
   * as merged_into=targetId and archived (excluded from normal listings).
   * The target gets the source's remarks_n appended for full history.
   */
  static async mergeTickets(
    sourceId: string,
    targetId: string,
    actingUserId?: string,
  ): Promise<Ticket> {
    if (sourceId === targetId) throw new ApiError(400, "Cannot merge a ticket with itself");

    const [source, target] = await Promise.all([
      TicketModel.findById(sourceId).lean(),
      TicketModel.findById(targetId).lean(),
    ]);

    if (!source) throw new ApiError(404, `Source ticket ${sourceId} not found`);
    if (!target) throw new ApiError(404, `Target ticket ${targetId} not found`);
    if (source.merged_into) throw new ApiError(400, "Source ticket is already merged");

    // Re-parent comments
    const { TicketComment } = await import("../models/TicketComment");
    await TicketComment.updateMany(
      { ticket: new mongoose.Types.ObjectId(sourceId) },
      { $set: { ticket: new mongoose.Types.ObjectId(targetId) } },
    );

    // Append source remarks to target
    const mergeNote = `\n\n--- Merged from #${source.tkt_number} (${new Date().toISOString()}) ---\n${source.remarks_n ?? ""}`;
    await TicketModel.findByIdAndUpdate(targetId, {
      $set: { remarks_n: (target.remarks_n ?? "") + mergeNote, update_date: new Date() },
    });

    // Mark source as merged
    await TicketModel.findByIdAndUpdate(sourceId, {
      $set: { merged_into: new mongoose.Types.ObjectId(targetId), merged_at: new Date(), update_date: new Date() },
    });

    // Audit
    try {
      await AuditLog.create({
        userId: actingUserId ? new mongoose.Types.ObjectId(actingUserId) : undefined,
        action: AUDIT_ACTIONS.MERGE,
        entity: "Ticket",
        entityId: new mongoose.Types.ObjectId(targetId),
        message: `Ticket #${source.tkt_number} merged into #${target.tkt_number}`,
        metadata: { sourceId, targetId, sourceNumber: source.tkt_number, targetNumber: target.tkt_number },
      });
    } catch (err) {
      logger.error("[MERGE_AUDIT_FAILED]", { err });
    }

    return TicketService.getTicketById(targetId);
  }

  /* ---------------------------------------------------------------------- */
  /* GET TICKET HISTORY (audit log)                                         */
  /* ---------------------------------------------------------------------- */
  /*
   * FIX #3: Returns the audit log for a given ticket, giving agents the
   * full status-change, comment, and assignment history in one call.
   */
  static async getTicketHistory(ticketId: string): Promise<unknown[]> {
    const ticket = await TicketModel.findById(ticketId).select({ _id: 1 }).lean();
    if (!ticket) throw new ApiError(404, "Ticket not found");

    const logs = await AuditLog.find({ entity: "Ticket", entityId: ticket._id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("userId", "name email")
      .lean();

    return logs;
  }

  /* ---------------------------------------------------------------------- */
  /* PRINT DATA — FIX #6                                                   */
  /* ---------------------------------------------------------------------- */
  /*
   * Returns a complete, denormalized snapshot of a ticket: its details,
   * ALL comments (not paginated), SLA state, audit history and assignee.
   * The print view consumes this single endpoint so it never has to make
   * multiple API calls that might time out or return partial data — which
   * was the root cause of the 1-page / truncated print bug.
   */
  static async getPrintData(ticketId: string): Promise<unknown> {
    const { TicketComment } = await import("../models/TicketComment");

    const [ticket, comments, history] = await Promise.all([
      TicketService.getTicketById(ticketId),
      TicketComment.find({ ticketId: new mongoose.Types.ObjectId(ticketId) })
        .sort({ createdAt: 1 })
        .populate("authorId", "name email role")
        .lean(),
      AuditLog.find({ entity: "Ticket", entityId: new mongoose.Types.ObjectId(ticketId) })
        .sort({ createdAt: 1 })
        .populate("userId", "name email")
        .lean(),
    ]);

    return {
      ticket,
      comments,
      history,
      printedAt: new Date().toISOString(),
    };
  }

  /* ---------------------------------------------------------------------- */
  /* BACKLOG SUMMARY                                                        */
  /* ---------------------------------------------------------------------- */
  /*
   * FIX #8: Returns a backlog summary grouped by status and priority so
   * agents can see at a glance what needs attention. Admins/managers get
   * the full picture; agents see only tickets assigned to them.
   */
  static async getBacklog(
    actingUserId?: string,
    actingUserRole?: string,
  ): Promise<unknown> {
    const matchStage: Record<string, unknown> = {
      tkt_status: { $nin: [TICKET_STATUS.RESOLVED, TICKET_STATUS.CLOSED] },
      merged_into: null,
    };

    // Agents only see their own backlog
    if (actingUserRole === "agent" && actingUserId) {
      matchStage.tkt_assigned_to = new mongoose.Types.ObjectId(actingUserId);
    }

    const [byStatus, byPriority, unassigned, oldestOpen] = await Promise.all([
      TicketModel.aggregate([
        { $match: matchStage },
        { $group: { _id: "$tkt_status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      TicketModel.aggregate([
        { $match: matchStage },
        { $group: { _id: "$color_code", count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      TicketModel.countDocuments({ ...matchStage, tkt_assigned_to: null }),
      TicketModel.find(matchStage)
        .select({ tkt_number: 1, email_subject: 1, tkt_status: 1, color_code: 1, created_date: 1 })
        .sort({ created_date: 1 })
        .limit(5)
        .lean(),
    ]);

    return {
      byStatus,
      byPriority,
      unassignedCount: unassigned,
      oldestOpenTickets: oldestOpen,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* DELETE                                                                */
  /* ---------------------------------------------------------------------- */

  static async deleteTicket(id: string): Promise<boolean> {
    const deleted = await TicketModel.findByIdAndDelete(id);

    if (!deleted) throw new ApiError(404, "Ticket not found");

    return true;
  }
}