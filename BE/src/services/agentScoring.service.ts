import AgentScoringSchemeModel, {
  DEFAULT_SCORING_SCHEME,
  type IAgentScoringScheme,
  type MetricDefinition,
} from "../models/AgentScoringScheme";
import { Ticket } from "../models/Ticket";
import SLAModel from "../models/SLA";
import { User } from "../models/User";
import type mongoose from "mongoose";

/* -------------------------------------------------------------------------- */
/* Agent Scoring Service                                                       */
/* -------------------------------------------------------------------------- */

export async function getActiveScheme(): Promise<IAgentScoringScheme> {
  let scheme = await AgentScoringSchemeModel.findOne({ is_active: true })
    .sort({ updatedAt: -1 })
    .lean<IAgentScoringScheme | null>();

  if (!scheme) {
    scheme = (await AgentScoringSchemeModel.create(DEFAULT_SCORING_SCHEME)).toObject();
  }

  return scheme;
}

export async function updateScheme(
  input: Partial<IAgentScoringScheme>,
  userId?: mongoose.Types.ObjectId
) {
  // Deactivate any existing active scheme first
  const existing = await AgentScoringSchemeModel.findOne({ is_active: true });
  if (existing) {
    return AgentScoringSchemeModel.findByIdAndUpdate(
      existing._id,
      { ...input, updated_by: userId },
      { new: true, runValidators: true }
    ).lean();
  }
  return AgentScoringSchemeModel.create({ ...input, updated_by: userId });
}

/** Compute scores for all agents based on active scheme */
export async function computeAgentScores(period?: "monthly" | "weekly" | "all_time") {
  const scheme = await getActiveScheme();
  const effectivePeriod = period ?? scheme.period;

  const now = new Date();
  let since: Date;
  if (effectivePeriod === "weekly") {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (effectivePeriod === "monthly") {
    since = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    since = new Date(0);
  }

  const agents = await (User as mongoose.Model<{ _id: mongoose.Types.ObjectId; name: string; email: string; role: string }>)
    .find({ role: "agent", isActive: true })
    .lean();

  const results = await Promise.all(
    agents.map(async (agent) => {
      const agentId = agent._id;

      // Tickets resolved in period
      const resolvedTickets = await Ticket.countDocuments({
        tkt_assigned_to: agentId,
        resolved_date: { $gte: since, $ne: null },
      });

      // MTTR in minutes
      const mttrAgg = await Ticket.aggregate([
        {
          $match: {
            tkt_assigned_to: agentId,
            resolved_date: { $gte: since, $ne: null },
            assigned_date: { $ne: null },
          },
        },
        {
          $project: {
            diff: {
              $divide: [
                { $subtract: ["$resolved_date", "$assigned_date"] },
                60000,
              ],
            },
          },
        },
        { $group: { _id: null, avg: { $avg: "$diff" } } },
      ]);
      const mttr = mttrAgg[0]?.avg ?? 0;

      // SLA adherence
      const [totalSLA, adheredSLA] = await Promise.all([
        SLAModel.countDocuments({
          ticketId: {
            $in: await Ticket.distinct("_id", {
              tkt_assigned_to: agentId,
              resolved_date: { $gte: since, $ne: null },
            }),
          },
        }),
        SLAModel.countDocuments({
          ticketId: {
            $in: await Ticket.distinct("_id", {
              tkt_assigned_to: agentId,
              resolved_date: { $gte: since, $ne: null },
            }),
          },
          status: { $nin: ["breached", "sla_violated"] },
        }),
      ]);
      const slaAdherence = totalSLA > 0 ? (adheredSLA / totalSLA) * 100 : 100;

      // CSAT
      const csatAgg = await Ticket.aggregate([
        {
          $match: {
            tkt_assigned_to: agentId,
            resolved_date: { $gte: since, $ne: null },
            customer_satisfaction: { $ne: null },
          },
        },
        { $group: { _id: null, avg: { $avg: "$customer_satisfaction" } } },
      ]);
      const csat = csatAgg[0]?.avg ?? null;

      // Raw metric values
      const rawMetrics: Record<string, number> = {
        tickets_solved_month: resolvedTickets,
        sla_adherence: slaAdherence,
        mttr: mttr,
        csat: csat ?? 0,
      };

      // Compute score using scheme weights
      const enabledMetrics = scheme.metrics.filter((m) => m.enabled);
      const totalWeight = enabledMetrics.reduce((s, m) => s + m.weight, 0);

      let score = 0;
      const breakdown: Record<
        string,
        { value: number; normalized: number; contribution: number; weight: number }
      > = {};

      for (const metric of enabledMetrics) {
        const raw = rawMetrics[metric.key] ?? 0;
        let normalized: number;

        if (metric.higher_is_better) {
          normalized = Math.min(raw / metric.max_value, 1) * 100;
        } else {
          // Lower is better (e.g. MTTR) — invert
          normalized = Math.max(0, 1 - raw / metric.max_value) * 100;
        }

        const contribution =
          totalWeight > 0 ? (normalized * metric.weight) / totalWeight : 0;
        score += contribution;

        breakdown[metric.key] = {
          value: raw,
          normalized: Math.round(normalized * 10) / 10,
          contribution: Math.round(contribution * 10) / 10,
          weight: metric.weight,
        };
      }

      return {
        agent: {
          id: agentId,
          name: agent.name,
          email: agent.email,
        },
        score: Math.round(score * 10) / 10,
        breakdown,
        raw: {
          tickets_solved: resolvedTickets,
          sla_adherence: Math.round(slaAdherence * 10) / 10,
          mttr_minutes: Math.round(mttr),
          csat: csat != null ? Math.round(csat * 10) / 10 : null,
        },
        period: effectivePeriod,
        since,
      };
    })
  );

  return results.sort((a, b) => b.score - a.score);
}
