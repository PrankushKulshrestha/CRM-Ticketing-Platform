import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle, ShieldCheck, TrendingDown,
  Users, BarChart2, Activity, Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { slaAnalyticsApi, type TimeFrame } from "../api/slaAnalyticsApi";
import { useQuery as useTeamsQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/apiClient";

/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const FRAMES: { value: TimeFrame; label: string }[] = [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24h" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "all", label: "All Time" },
  { value: "custom", label: "Custom" },
];

const COLORS = {
  violated: "#ef4444",
  adhered: "#22c55e",
  primary: "#6366f1",
  warning: "#f59e0b",
  muted: "#94a3b8",
};

const PIE_COLORS = [
  "#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#84cc16",
];

/* -------------------------------------------------------------------------- */
/* Frame Selector                                                              */
/* -------------------------------------------------------------------------- */

interface FrameSelectorProps {
  frame: TimeFrame;
  onChange: (f: TimeFrame) => void;
  customStart: string;
  customEnd: string;
  onCustomStartChange: (v: string) => void;
  onCustomEndChange: (v: string) => void;
}

function FrameSelector({ frame, onChange, customStart, customEnd, onCustomStartChange, onCustomEndChange }: FrameSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 flex-wrap">
        {FRAMES.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={frame === f.value ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => onChange(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {frame === "custom" && (
        <div className="flex items-center gap-2">
          <Input type="datetime-local" value={customStart} onChange={(e) => onCustomStartChange(e.target.value)} className="h-7 text-xs w-40" />
          <span className="text-muted-foreground text-xs">to</span>
          <Input type="datetime-local" value={customEnd} onChange={(e) => onCustomEndChange(e.target.value)} className="h-7 text-xs w-40" />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat Card                                                                   */
/* -------------------------------------------------------------------------- */

function StatTile({ label, value, sub, color = "text-foreground", icon: Icon }: {
  label: string; value: string | number; sub?: string; color?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* SLA Analytics Page                                                          */
/* -------------------------------------------------------------------------- */

export default function SLAAnalyticsPage() {
  const [frame, setFrame] = useState<TimeFrame>("24h");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [violationsTab, setViolationsTab] = useState<"agents" | "sla">("agents");

  const qs = { frame, start: customStart || undefined, end: customEnd || undefined };

  // Fetch all data
  const { data: violationsData } = useQuery({
    queryKey: ["sla-analytics", "violations", frame, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getViolations(frame, customStart || undefined, customEnd || undefined),
  });

  const { data: adherenceData } = useQuery({
    queryKey: ["sla-analytics", "adherence", frame, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getAdherenceVsViolated(frame, customStart || undefined, customEnd || undefined),
  });

  const { data: byAgentData } = useQuery({
    queryKey: ["sla-analytics", "by-agent", frame, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getViolationsByAgent(frame, customStart || undefined, customEnd || undefined),
  });

  const { data: bySLAData } = useQuery({
    queryKey: ["sla-analytics", "by-sla", frame, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getViolationsBySLA(frame, customStart || undefined, customEnd || undefined),
  });

  const { data: complianceData } = useQuery({
    queryKey: ["sla-analytics", "compliance", frame, teamFilter, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getComplianceByTeam(frame, teamFilter !== "all" ? teamFilter : undefined, customStart || undefined, customEnd || undefined),
  });

  const { data: byStatusData } = useQuery({
    queryKey: ["sla-analytics", "by-status", frame, customStart, customEnd],
    queryFn: () => slaAnalyticsApi.getViolationsByStatus(frame, customStart || undefined, customEnd || undefined),
  });

  const { data: teamsRes } = useTeamsQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiClient.get<{ data: { teams: { _id: string; name: string }[] } }>("/teams"),
  });

  const violations = violationsData?.data;
  const adherence = adherenceData?.data;
  const byAgent = byAgentData?.data ?? [];
  const bySLA = bySLAData?.data ?? [];
  const compliance = complianceData?.data;
  const byStatus = byStatusData?.data ?? [];
  const teams = teamsRes?.data?.teams ?? [];

  const trendData = (violations?.trend ?? []).map((t) => ({
    time: t._id,
    violations: t.count,
  }));

  const adherenceBarData = adherence
    ? [
        { name: "Adhered", value: adherence.adhered, fill: COLORS.adhered },
        { name: "Violated", value: adherence.violated, fill: COLORS.violated },
      ]
    : [];

  const byStatusTop = byStatus.slice(0, 20);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />SLA Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          SLA violation trends, compliance breakdowns, and agent/status analysis
        </p>
      </div>

      {/* Frame selector */}
      <FrameSelector
        frame={frame} onChange={setFrame}
        customStart={customStart} customEnd={customEnd}
        onCustomStartChange={setCustomStart} onCustomEndChange={setCustomEnd}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Total SLAs" value={violations?.total ?? "—"}
          icon={Activity} sub="in selected period"
        />
        <StatTile
          label="Violations" value={violations?.violations ?? "—"}
          color="text-red-500" icon={AlertTriangle}
          sub="breached or SLA violated"
        />
        <StatTile
          label="Adherence Rate"
          value={violations?.adherence_rate != null ? `${violations.adherence_rate.toFixed(1)}%` : "—"}
          color="text-green-600" icon={ShieldCheck}
        />
        <StatTile
          label="Compliance (Period)"
          value={compliance?.compliance_rate != null ? `${compliance.compliance_rate}%` : "—"}
          icon={TrendingDown}
        />
      </div>

      {/* Graph 1: SLA Violation Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            SLA Violations Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No violation data for selected period</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="violations" stroke={COLORS.violated} strokeWidth={2} dot={false} name="Violations" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Graph 2: SLA Adherence vs Violated */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-indigo-500" />
            Adherence vs Violated Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={adherenceBarData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {adherenceBarData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total SLAs</span>
                <span className="font-bold">{adherence?.total ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Adhered
                </span>
                <span className="font-bold text-green-600">{adherence?.adhered ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Violated
                </span>
                <span className="font-bold text-red-500">{adherence?.violated ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Adherence Rate</span>
                <span className="font-bold text-green-600">{adherence?.adherence_rate ?? "—"}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Violation Rate</span>
                <span className="font-bold text-red-500">{adherence?.violation_rate ?? "—"}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph 3: Violations by Agents / SLA */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Violations By
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={violationsTab} onValueChange={(v) => setViolationsTab(v as "agents" | "sla")}>
            <TabsList className="mb-4">
              <TabsTrigger value="agents">AGENTS</TabsTrigger>
              <TabsTrigger value="sla">SLA</TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              {byAgent.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No agent violations in selected period</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(240, byAgent.length * 42)}>
                  <BarChart data={byAgent} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="agent_name" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v, "Violations"]} />
                    <Bar dataKey="count" fill={COLORS.violated} radius={[0, 4, 4, 0]} name="Violations" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>

            <TabsContent value="sla">
              {bySLA.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No SLA violations in selected period</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={bySLA}
                        dataKey="count"
                        nameKey="sla_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => {
                          const payload = entry.payload as
                            | { sla_name?: string }
                            | undefined;
                          const name = payload?.sla_name ?? entry.name ?? "";
                          const percent = entry.percent ?? 0;
                          return `${name} (${(percent * 100).toFixed(0)}%)`;
                        }}
                        labelLine={false}
                      >
                        {bySLA.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, _, p) => [v, p.payload.sla_name]} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-2">
                    {bySLA.map((s, i) => (
                      <div key={s.priority} className="flex items-center justify-between text-sm py-2 border-b">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <div>
                            <p className="font-medium">{s.sla_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{s.priority} priority</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-500">{s.count}</p>
                          <p className="text-xs text-muted-foreground">{s.violated} terminal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Graph 4: Compliance by Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Compliance by Team
            </CardTitle>
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-44 h-8 text-sm">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {compliance?.by_team && compliance.by_team.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={compliance.by_team}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="team_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => [`${v}%`, "Compliance Rate"]} />
                <Bar dataKey="compliance_rate" name="Compliance %" radius={[4, 4, 0, 0]}>
                  {(compliance.by_team ?? []).map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.compliance_rate >= 80 ? COLORS.adhered : entry.compliance_rate >= 60 ? COLORS.warning : COLORS.violated}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{compliance?.total ?? "—"}</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">{compliance?.compliance_rate ?? "—"}%</p>
              </div>
              <div className="p-4 rounded-lg border">
                <p className="text-xs text-muted-foreground">Violations</p>
                <p className="text-2xl font-bold text-red-500">{compliance?.violated ?? "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Graph 5: Violations by Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            Violations by Ticket Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byStatusTop.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No violations found</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={Math.max(280, byStatusTop.length * 36)}>
                <BarChart data={byStatusTop} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    width={170}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) =>
                      String(v).length > 22 ? String(v).slice(0, 22) + "…" : String(v)
                    }
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Violations" radius={[0, 4, 4, 0]}>
                    {byStatusTop.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="overflow-y-auto max-h-80">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left pb-1">Status</th>
                      <th className="text-right pb-1">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byStatusTop.map((s, i) => (
                      <tr key={s.status} className="border-b hover:bg-muted/30">
                        <td className="py-1.5 text-xs flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {s.status}
                        </td>
                        <td className="py-1.5 text-right font-medium">{s.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
