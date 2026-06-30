
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  TrendingUp,
  AlertCircle,
  Users,
  Clock,
  Star,
  Headphones,
  BarChart2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type Agent = {
  id: string;
  name: string;
  avatar?: string;
  color?: string;

  open?: number;
  solved7d?: number;
  solved30d?: number;
  fcr?: number;
  highBacklog?: boolean;
};

export type AgentUpdate = {
  name: string;
  High?: number;
  Low?: number;
  Normal?: number;
  Urgent?: number;
};

export type Heatmap = {
  agents: string[];
  drivers: string[];
  values: number[][];
};

type AgentLeaderboardProps = {
  agents: Agent[] | null;
  updates: AgentUpdate[] | null;
};

type AgentDataMatrixProps = {
  heatmap: Heatmap | null;
};

/* -------------------------------------------------------------------------- */

const UPDATE_COLORS: Record<string, string> = {
  High: "#ef4444",
  Low: "#94a3b8",
  Normal: "#6366f1",
  Urgent: "#f97316",
};

const clampPercent = (value: number) =>
  Math.min(Math.max(Number(value) || 0, 0), 100);

/* -------------------------------------------------------------------------- */
/* Widget 1                                                                  */
/* -------------------------------------------------------------------------- */

export function AgentLeaderboard({
  agents,
  updates,
}: AgentLeaderboardProps) {
  const agentList = Array.isArray(agents) ? agents : [];
  const updateList = Array.isArray(updates) ? updates : [];

const barKeys = Object.keys(UPDATE_COLORS).filter(
  (k) => k && typeof k === "string"
);
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/50 bg-card p-5 overflow-hidden">
        <p className="text-sm font-semibold">Agent Update Weight</p>
        <p className="text-xs text-muted-foreground mb-4">
          Priority-weighted ticket updates per agent
        </p>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={updateList}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              {barKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={UPDATE_COLORS[key]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {agentList.map((agent) => {
          const open = Number(agent.open ?? 0);
          const fcr = clampPercent(agent.fcr ?? 0);

          return (
            <div
              key={agent.id}
              className="rounded-2xl border border-border/50 bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Support Agent
                  </p>
                </div>

                <span className="text-xs text-muted-foreground">
                  {open} Open
                </span>
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">FCR</span>
                  <span className="font-semibold">{fcr}%</span>
                </div>

                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${fcr}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Widget 2                                                                  */
/* -------------------------------------------------------------------------- */

export function HelpDeskMetrics() {
  const stats = [
    { icon: <BarChart2 size={16} />, label: "Ticket Volume", value: "3,354" },
    { icon: <Headphones size={16} />, label: "Channel Volume", value: "372" },
    { icon: <TrendingUp size={16} />, label: "Completed", value: "2,347" },
    { icon: <Users size={16} />, label: "Active Agents", value: "1,354" },
    { icon: <Clock size={16} />, label: "Avg Response Time", value: "00:08:11" },
    { icon: <Star size={16} />, label: "FCR Rate", value: "70%" },
    { icon: <AlertCircle size={16} />, label: "Backlog", value: "1,007" },
    { icon: <Star size={16} />, label: "CSAT", value: "87%" },
    { icon: <TrendingUp size={16} />, label: "Employee CSAT", value: "82%" },
  ];

  return (
    <div className="grid grid-cols-3 lg:grid-cols-9 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-border/50 bg-card p-4"
        >
          <div className="text-muted-foreground mb-2">{s.icon}</div>
          <p className="text-lg font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Widget 3                                                                  */
/* -------------------------------------------------------------------------- */

export default function AgentDataMatrix({
  heatmap,
}: AgentDataMatrixProps) {
  if (!heatmap?.agents?.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No heatmap data available
      </div>
    );
  }

  const getColor = (v: number) => {
    const val = Number(v) || 0;

    if (val >= 80) return "bg-blue-600 text-white";
    if (val >= 70) return "bg-blue-400 text-white";
    if (val >= 60) return "bg-blue-200 text-blue-900";
    if (val >= 50) return "bg-blue-100 text-blue-800";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card p-5">
      <table className="w-full text-xs min-w-150">
        <thead>
          <tr>
            <th className="text-left py-2">Driver</th>
            {heatmap.agents.map((a) => (
              <th key={a} className="text-center py-2">
                {a}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {heatmap.drivers.map((driver, i) => (
            <tr key={driver} className="border-t border-border/20">
              <td className="py-2 font-medium">{driver}</td>

              {(heatmap.values[i] ?? []).map((v, j) => {
                const value = Number(v) || 0;

                return (
                  <td key={j} className="text-center py-2">
                    <span className={`px-2 py-1 rounded ${getColor(value)}`}>
                      {value}%
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}