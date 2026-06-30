
import mongoose from "mongoose";
import TeamModel from "../models/Team";
import TicketModel from "../models/Ticket";
import UserModel from "../models/User";
import { ApiError } from "../utils/ApiError";
import { getPagination } from "../utils/pagination";
import { TICKET_STATUS } from "../constants/constants";

import type {
  Team,
  TeamFilters,
  TeamsResult,
  CreateTeamPayload,
  UpdateTeamMembersPayload,
} from "../types/team.types";

/* -------------------------------------------------------------------------- */
/* Lean shapes                                                                */
/* -------------------------------------------------------------------------- */

type LeanMember = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
};

type LeanTeam = {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  members: LeanMember[];
  createdAt: Date;
  updatedAt: Date;
};

type AgentStats = Record<string, { assigned: number; resolved: number }>;

/* -------------------------------------------------------------------------- */
/* Stats helper — one aggregation covers every member on the page             */
/* -------------------------------------------------------------------------- */

async function getStatsForMembers(
  memberIds: mongoose.Types.ObjectId[],
): Promise<AgentStats> {
  if (memberIds.length === 0) return {};

  const rows = await TicketModel.aggregate([
    { $match: { tkt_assigned_to: { $in: memberIds } } },
    {
      $group: {
        _id: "$tkt_assigned_to",
        assigned: { $sum: 1 },
        resolved: {
          $sum: {
            $cond: [{ $eq: ["$tkt_status", TICKET_STATUS.RESOLVED] }, 1, 0],
          },
        },
      },
    },
  ]);

  const stats: AgentStats = {};
  for (const row of rows) {
    stats[row._id.toString()] = {
      assigned: row.assigned,
      resolved: row.resolved,
    };
  }
  return stats;
}

const toTeam = (doc: LeanTeam, stats: AgentStats): Team => ({
  id: doc._id.toString(),
  name: doc.name,
  description: doc.description,
  members: doc.members.map((m) => ({
    id: m._id.toString(),
    name: m.name,
    email: m.email,
    role: (m.role as Team["members"][number]["role"]) ?? "agent",
    assignedTickets: stats[m._id.toString()]?.assigned ?? 0,
    resolvedTickets: stats[m._id.toString()]?.resolved ?? 0,
    avatarUrl: m.avatar ?? undefined,
  })),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

/* -------------------------------------------------------------------------- */
/* Service                                                                    */
/* -------------------------------------------------------------------------- */

export class TeamService {
  static async getTeams(filters: TeamFilters): Promise<TeamsResult> {
    const { page, limit, skip } = getPagination(
      { page: filters.page, limit: filters.limit },
      { defaultLimit: 20, maxLimit: Number.MAX_SAFE_INTEGER },
    );

    const query: Record<string, unknown> = {};
    if (filters.search) {
      query.name = new RegExp(filters.search.trim(), "i");
    }

    const [docs, total] = await Promise.all([
      TeamModel.find(query)
        .populate("members", "name email role avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanTeam[]>(),
      TeamModel.countDocuments(query),
    ]);

    const allMemberIds = docs.flatMap((d) => d.members.map((m) => m._id));
    const stats = await getStatsForMembers(allMemberIds);

    return {
      data: docs.map((d) => toTeam(d, stats)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  static async getTeamById(id: string): Promise<Team> {
    const doc = await TeamModel.findById(id)
      .populate("members", "name email role avatar")
      .lean<LeanTeam>();

    if (!doc) throw new ApiError(404, "Team not found");

    const stats = await getStatsForMembers(doc.members.map((m) => m._id));
    return toTeam(doc, stats);
  }

  static async createTeam(payload: CreateTeamPayload): Promise<Team> {
    const created = await TeamModel.create({
      name: payload.name,
      description: payload.description,
      members: payload.memberIds ?? [],
    });

    return this.getTeamById(created._id.toString());
  }

  /**
   * Full replace of a team's members. Previously the only way to change a
   * team's roster was direct MongoDB access — no endpoint existed at all.
   * Validates every incoming ID is both a well-formed ObjectId and an
   * actual existing user before writing, so a typo'd ID can't silently
   * leave the team referencing a ghost member.
   */
  static async updateTeamMembers(
    teamId: string,
    payload: UpdateTeamMembersPayload,
  ): Promise<Team> {
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      throw new ApiError(400, "Invalid team id");
    }

    const memberIds = Array.from(new Set(payload.memberIds ?? []));

    for (const id of memberIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `Invalid member id: ${id}`);
      }
    }

    if (memberIds.length > 0) {
      const existingCount = await UserModel.countDocuments({
        _id: { $in: memberIds },
      });
      if (existingCount !== memberIds.length) {
        throw new ApiError(400, "One or more member ids do not exist");
      }
    }

    const updated = await TeamModel.findByIdAndUpdate(
      teamId,
      { $set: { members: memberIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { new: true },
    );

    if (!updated) throw new ApiError(404, "Team not found");

    return this.getTeamById(teamId);
  }
}