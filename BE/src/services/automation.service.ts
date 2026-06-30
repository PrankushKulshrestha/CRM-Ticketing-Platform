
import type { Types } from "mongoose";
import mongoose from "mongoose";
import AutomationRuleModel from "../models/AutomationRule";
import TicketModel from "../models/Ticket";
import { ApiError } from "../utils/ApiError";
import { getPagination } from "../utils/pagination";
import logger from "../config/logger";

import type {
  AutomationRule,
  AutomationFilters,
  AutomationResult,
  CreateAutomationRulePayload,
} from "../types/automation.types";

/* -------------------------------------------------------------------------- */
/* Lean shape                                                                 */
/* -------------------------------------------------------------------------- */

type LeanRule = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  trigger: AutomationRule["trigger"];
  conditions: Record<string, string>;
  actions: AutomationRule["actions"];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const toRule = (doc: LeanRule): AutomationRule => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  trigger: doc.trigger,
  conditions: doc.conditions ?? {},
  actions: doc.actions ?? [],
  enabled: doc.enabled,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

/* -------------------------------------------------------------------------- */
/* AUTOMATION EXECUTOR                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Evaluate and apply all enabled automation rules for a given trigger.
 * Called after ticket creation ("ticket_created") and after status changes
 * ("status_changed"). Best-effort: errors are logged, never thrown.
 *
 * Conditions are matched as simple key/value equality against the lean ticket
 * document (e.g. { cat_id: "billing", color_code: "3" }).
 */
export async function applyAutomationRules(
  trigger: AutomationRule["trigger"],
  ticketId: string | Types.ObjectId,
): Promise<void> {
  try {
    const rules = await AutomationRuleModel.find({
      trigger,
      enabled: true,
    }).lean<LeanRule[]>();

    if (!rules.length) return;

    const ticket = await TicketModel.findById(ticketId).lean();
    if (!ticket) return;

    const updates: Record<string, unknown> = {};

    for (const rule of rules) {
      // Check all conditions match (simple equality; cast both sides to string)
      const conditionsMet = Object.entries(rule.conditions ?? {}).every(
        ([key, val]) => String((ticket as Record<string, unknown>)[key] ?? "") === String(val),
      );
      if (!conditionsMet) continue;

      for (const action of rule.actions) {
        switch (action.type) {
          case "assign_agent":
            if (mongoose.isValidObjectId(action.value)) {
              updates.tkt_assigned_to = new mongoose.Types.ObjectId(action.value);
            }
            break;

          case "assign_team":
            if (mongoose.isValidObjectId(action.value)) {
              updates.tkt_team = new mongoose.Types.ObjectId(action.value);

              // Also assign the least-loaded active agent from the team
              // so the ticket gets a real assignee and SLA starts immediately.
              if (!updates.tkt_assigned_to) {
                try {
                  const { Team } = await import("../models/Team");
                  const team = await Team.findById(action.value)
                    .select({ members: 1 })
                    .lean<{ members: mongoose.Types.ObjectId[] } | null>();

                  if (team?.members?.length) {
                    // Pick the member with the fewest open tickets (round-robin light)
                    const openCounts = await TicketModel.aggregate([
                      {
                        $match: {
                          tkt_assigned_to: { $in: team.members },
                          tkt_status: { $nin: ["resolved", "closed"] },
                          merged_into: null,
                        },
                      },
                      { $group: { _id: "$tkt_assigned_to", count: { $sum: 1 } } },
                    ]);
                    const countMap = new Map(openCounts.map((r: any) => [r._id.toString(), r.count]));
                    const sorted = [...team.members].sort(
                      (a, b) => (countMap.get(a.toString()) ?? 0) - (countMap.get(b.toString()) ?? 0),
                    );
                    updates.tkt_assigned_to = sorted[0];
                    updates.assigned_date = new Date();
                  }
                } catch (err) {
                  logger.warn("[AUTOMATION_TEAM_ASSIGN_AGENT_FAILED]", { err });
                }
              }
            }
            break;

          case "set_priority": {
            const p = Number(action.value);
            if (p >= 1 && p <= 4) updates.color_code = p;
            break;
          }

          case "change_status":
            updates.tkt_status = action.value;
            break;

          // send_notification and add_tag are logged but not yet implemented
          default:
            logger.info("[AUTOMATION_ACTION_UNIMPLEMENTED]", {
              type: action.type,
              ruleId: rule._id,
              ticketId,
            });
        }
      }

      logger.info("[AUTOMATION_RULE_APPLIED]", { ruleId: rule._id, name: rule.name, ticketId });
    }

    if (Object.keys(updates).length) {
      await TicketModel.updateOne(
        { _id: ticketId },
        { $set: { ...updates, update_date: new Date() } },
      );

      // If a new agent was assigned, ensure an SLA tracker exists
      if (updates.tkt_assigned_to) {
        try {
          const { createSLAForTicket } = await import("./sla.service");
          const { default: SLA } = await import("../models/SLA");
          const { TICKET_PRIORITY } = await import("../models/Ticket");
          const existing = await SLA.findOne({ ticketId, status: { $in: ["active", "breached"] } }).lean();
          if (!existing) {
            const t = await TicketModel.findById(ticketId).select({ color_code: 1, created_date: 1 }).lean();
            const colorCode = (t?.color_code ?? TICKET_PRIORITY.MEDIUM) as import("../models/Ticket").TicketPriority;
            await createSLAForTicket(new mongoose.Types.ObjectId(ticketId.toString()), colorCode, t?.created_date ?? new Date());
          }
        } catch (slaErr) {
          logger.warn("[AUTOMATION_SLA_CREATE_FAILED]", { ticketId, slaErr });
        }
      }
    }
  } catch (err) {
    logger.error("[AUTOMATION_APPLY_FAILED]", { trigger, ticketId, err });
  }
}

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export class AutomationService {
  static async getRules(
    filters: AutomationFilters,
  ): Promise<AutomationResult> {
    const { page, limit, skip } = getPagination(
      { page: filters.page, limit: filters.limit },
      { defaultLimit: 20, maxLimit: Number.MAX_SAFE_INTEGER },
    );

    const query: Record<string, unknown> = {};
    if (typeof filters.enabled === "boolean") {
      query.enabled = filters.enabled;
    }

    const [docs, total] = await Promise.all([
      AutomationRuleModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanRule[]>(),
      AutomationRuleModel.countDocuments(query),
    ]);

    return {
      data: docs.map(toRule),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  static async toggleRule(
    id: string,
    enabled: boolean,
  ): Promise<AutomationRule> {
    const updated = await AutomationRuleModel.findByIdAndUpdate(
      id,
      { $set: { enabled } },
      { new: true },
    ).lean<LeanRule>();

    if (!updated) throw new ApiError(404, "Automation rule not found");

    return toRule(updated);
  }

  static async createRule(
    payload: CreateAutomationRulePayload,
  ): Promise<AutomationRule> {
    const created = await AutomationRuleModel.create({
      name: payload.name,
      description: payload.description,
      trigger: payload.trigger,
      conditions: payload.conditions ?? {},
      actions: payload.actions,
      enabled: payload.enabled ?? true,
    });

    return toRule(created.toObject() as LeanRule);
  }
}