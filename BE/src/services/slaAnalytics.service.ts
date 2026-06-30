import SLAModel, { SLA_STATUSES } from "../models/SLA";
import { Ticket } from "../models/Ticket";
import { User } from "../models/User";
import { Team } from "../models/Team";
import mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* SLA Analytics Service                                                       */
/* -------------------------------------------------------------------------- */

export type TimeFrame =
  | "1h"
  | "24h"
  | "7d"
  | "30d"
  | "all"
  | "custom";

function buildDateRange(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
): { $gte?: Date; $lte?: Date } | Record<string, never> {
  const now = new Date();
  const custom = frame === "custom";
  if (custom && customStart) {
    return {
      $gte: new Date(customStart),
      $lte: customEnd ? new Date(customEnd) : now,
    };
  }

  const msMap: Record<string, number> = {
    "1h": 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  if (frame === "all") return {};
  const ms = msMap[frame] ?? msMap["24h"];
  return { $gte: new Date(now.getTime() - ms) };
}

/** 1. SLA Violation counts over time (hourly/daily/weekly/monthly/all/custom) */
export async function getSLAViolations(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const matchDate = Object.keys(dateRange).length
    ? { createdAt: dateRange }
    : {};

  const violations = await SLAModel.countDocuments({
    status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
    ...matchDate,
  });

  const total = await SLAModel.countDocuments(matchDate);

  // Trend buckets
  const groupByFormat =
    frame === "1h"
      ? "%Y-%m-%dT%H:%M"
      : frame === "24h"
      ? "%Y-%m-%dT%H:00"
      : frame === "7d"
      ? "%Y-%m-%d"
      : frame === "30d"
      ? "%Y-%m-%d"
      : "%Y-%m";

  const trend = await SLAModel.aggregate([
    {
      $match: {
        status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
        ...(Object.keys(dateRange).length ? { createdAt: dateRange } : {}),
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return { violations, total, adherence_rate: total > 0 ? ((total - violations) / total) * 100 : 100, trend };
}

/** 2. SLA Adherence vs Violated — time series */
export async function getSLAAdherenceVsViolated(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const dateMatch = Object.keys(dateRange).length
    ? { createdAt: dateRange }
    : {};

  const [violated, total] = await Promise.all([
    SLAModel.countDocuments({
      status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
      ...dateMatch,
    }),
    SLAModel.countDocuments(dateMatch),
  ]);

  const adhered = total - violated;

  return {
    total,
    adhered,
    violated,
    adherence_rate: total > 0 ? Math.round((adhered / total) * 1000) / 10 : 100,
    violation_rate: total > 0 ? Math.round((violated / total) * 1000) / 10 : 0,
  };
}

/** 3a. Violations by Agent */
export async function getViolationsByAgent(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const dateMatch = Object.keys(dateRange).length
    ? { createdAt: dateRange }
    : {};

  const raw = await SLAModel.aggregate([
    {
      $match: {
        status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
        ...dateMatch,
      },
    },
    {
      $lookup: {
        from: "tickets",
        localField: "ticketId",
        foreignField: "_id",
        as: "ticket",
      },
    },
    { $unwind: { path: "$ticket", preserveNullAndEmpty: false } },
    {
      $group: {
        _id: "$ticket.tkt_assigned_to",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ]);

  // Hydrate agent names
  const agentIds = raw.map((r) => r._id).filter(Boolean);
  const agents = await (User as mongoose.Model<{ _id: mongoose.Types.ObjectId; name: string; email: string }>)
    .find({ _id: { $in: agentIds } })
    .select("name email")
    .lean();

  const agentMap = Object.fromEntries(agents.map((a) => [String(a._id), a]));

  return raw.map((r) => ({
    agent_id: r._id,
    agent_name: r._id ? agentMap[String(r._id)]?.name ?? "Unknown" : "Unassigned",
    agent_email: r._id ? agentMap[String(r._id)]?.email ?? "" : "",
    count: r.count,
  }));
}

/** 3b. Violations by SLA Policy (priority tiers) */
export async function getViolationsBySLA(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const dateMatch = Object.keys(dateRange).length
    ? { createdAt: dateRange }
    : {};

  const SLA_NAMES: Record<string, string> = {
    low: "Classic SLA 8 Hours",
    medium: "Basic SLA 24 Hours",
    high: "Standard SLA",
    critical: "Presales SLA-24 Hours",
  };

  const raw = await SLAModel.aggregate([
    {
      $match: {
        status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
        ...dateMatch,
      },
    },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
        violated: {
          $sum: { $cond: [{ $eq: ["$status", "sla_violated"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return raw.map((r) => ({
    priority: r._id,
    sla_name: SLA_NAMES[r._id] ?? r._id,
    count: r.count,
    violated: r.violated,
  }));
}

/** 4. Compliance by Team/Department */
export async function getComplianceByTeam(
  frame: TimeFrame,
  teamId?: string,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const ticketDateMatch = Object.keys(dateRange).length
    ? { created_date: dateRange }
    : {};

  const ticketFilter: Record<string, unknown> = { ...ticketDateMatch };
  if (teamId && teamId !== "all") {
    ticketFilter.tkt_team = new mongoose.Types.ObjectId(teamId);
  }

  const ticketIds = await Ticket.distinct("_id", ticketFilter);

  const [total, violated] = await Promise.all([
    SLAModel.countDocuments({ ticketId: { $in: ticketIds } }),
    SLAModel.countDocuments({
      ticketId: { $in: ticketIds },
      status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
    }),
  ]);

  const adhered = total - violated;

  // Per-team breakdown if "all" requested
  let byTeam: unknown[] = [];
  if (!teamId || teamId === "all") {
    const teams = await (Team as mongoose.Model<{ _id: mongoose.Types.ObjectId; name: string }>)
      .find()
      .select("name")
      .lean();

    byTeam = await Promise.all(
      teams.map(async (team) => {
        const tIds = await Ticket.distinct("_id", {
          ...ticketDateMatch,
          tkt_team: team._id,
        });
        const [t, v] = await Promise.all([
          SLAModel.countDocuments({ ticketId: { $in: tIds } }),
          SLAModel.countDocuments({
            ticketId: { $in: tIds },
            status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
          }),
        ]);
        return {
          team_id: team._id,
          team_name: team.name,
          total: t,
          adhered: t - v,
          violated: v,
          compliance_rate: t > 0 ? Math.round(((t - v) / t) * 1000) / 10 : 100,
        };
      })
    );
  }

  return {
    total,
    adhered,
    violated,
    compliance_rate: total > 0 ? Math.round((adhered / total) * 1000) / 10 : 100,
    by_team: byTeam,
  };
}

/** 5. Violations by Ticket Status */
export async function getViolationsByStatus(
  frame: TimeFrame,
  customStart?: string,
  customEnd?: string
) {
  const dateRange = buildDateRange(frame, customStart, customEnd);
  const dateMatch = Object.keys(dateRange).length
    ? { createdAt: dateRange }
    : {};

  const raw = await SLAModel.aggregate([
    {
      $match: {
        status: { $in: [SLA_STATUSES.BREACHED, SLA_STATUSES.SLA_VIOLATED] },
        ...dateMatch,
      },
    },
    {
      $lookup: {
        from: "tickets",
        localField: "ticketId",
        foreignField: "_id",
        as: "ticket",
      },
    },
    { $unwind: { path: "$ticket", preserveNullAndEmpty: false } },
    {
      $group: {
        _id: "$ticket.tkt_status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return raw.map((r) => ({ status: r._id ?? "unknown", count: r.count }));
}
