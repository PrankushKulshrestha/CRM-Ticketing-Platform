import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trophy, Star, Settings, Plus, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, ArrowUp, ArrowDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { agentScoringApi, type ScoringScheme, type MetricDefinition, type AgentScore } from "../api/agentScoringApi";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

/* -------------------------------------------------------------------------- */
/* Score Badge                                                                 */
/* -------------------------------------------------------------------------- */

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-100 text-green-700 border-green-200" :
    score >= 60 ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    score >= 40 ? "bg-orange-100 text-orange-700 border-orange-200" :
                  "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold border-2 ${color}`}>
      {score}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Scheme Editor Modal                                                         */
/* -------------------------------------------------------------------------- */

interface SchemeEditorProps {
  open: boolean;
  onClose: () => void;
  scheme: ScoringScheme;
}

function SchemeEditor({ open, onClose, scheme }: SchemeEditorProps) {
  const qc = useQueryClient();
  const [metrics, setMetrics] = useState<MetricDefinition[]>([...scheme.metrics]);
  const [name, setName] = useState(scheme.name);
  const [period, setPeriod] = useState(scheme.period);
  const [displayMode, setDisplayMode] = useState(scheme.display_mode);

  const updateMut = useMutation({
    mutationFn: agentScoringApi.updateScheme,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["agent-scoring"] }); onClose(); },
  });

  const setMetric = (idx: number, patch: Partial<MetricDefinition>) =>
    setMetrics((prev) => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));

  const addMetric = () =>
    setMetrics((prev) => [
      ...prev,
      {
        key: `custom_${Date.now()}`,
        label: "New Metric",
        weight: 10,
        higher_is_better: true,
        max_value: 100,
        enabled: true,
        is_builtin: false,
      },
    ]);

  const removeMetric = (idx: number) =>
    setMetrics((prev) => prev.filter((_, i) => i !== idx));

  const totalWeight = metrics.filter((m) => m.enabled).reduce((s, m) => s + m.weight, 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />Scoring Scheme Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Scheme Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Period</label>
              <Select value={period} onValueChange={(v) => setPeriod(v as ScoringScheme["period"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Display Mode</label>
            <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as ScoringScheme["display_mode"])}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage (0–100%)</SelectItem>
                <SelectItem value="points">Points</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">
                Metrics
                <span className={`ml-2 text-xs font-normal ${totalWeight === 100 ? "text-green-600" : "text-orange-500"}`}>
                  (Weights sum: {totalWeight}{totalWeight !== 100 ? " — should equal 100" : " ✓"})
                </span>
              </label>
              <Button size="sm" variant="outline" onClick={addMetric}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add Metric
              </Button>
            </div>

            <div className="space-y-3">
              {metrics.map((m, i) => (
                <div key={i} className={`border rounded-lg p-3 space-y-2 ${!m.enabled ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => setMetric(i, { enabled: !m.enabled })}
                        className="shrink-0"
                      >
                        {m.enabled
                          ? <ToggleRight className="h-5 w-5 text-green-500" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </button>
                      <Input
                        value={m.label}
                        onChange={(e) => setMetric(i, { label: e.target.value })}
                        className="h-7 text-sm"
                        placeholder="Metric label"
                      />
                    </div>
                    {!m.is_builtin && (
                      <button
                        type="button"
                        onClick={() => removeMetric(i)}
                        className="text-destructive hover:opacity-70"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {m.is_builtin && <Badge variant="secondary" className="text-xs">Built-in</Badge>}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Weight</label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={m.weight}
                        onChange={(e) => setMetric(i, { weight: Number(e.target.value) })}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max Value</label>
                      <Input
                        type="number"
                        min={1}
                        value={m.max_value}
                        onChange={(e) => setMetric(i, { max_value: Number(e.target.value) })}
                        className="h-7 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Direction</label>
                      <Select
                        value={m.higher_is_better ? "higher" : "lower"}
                        onValueChange={(v) => setMetric(i, { higher_is_better: v === "higher" })}
                      >
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="higher">Higher = Better</SelectItem>
                          <SelectItem value="lower">Lower = Better</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!m.is_builtin && (
                    <div>
                      <label className="text-xs text-muted-foreground">Metric Key (internal)</label>
                      <Input
                        value={m.key}
                        onChange={(e) => setMetric(i, { key: e.target.value })}
                        className="h-7 text-xs font-mono"
                        placeholder="e.g. custom_tickets_reopened"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => updateMut.mutate({ name, period, display_mode: displayMode, metrics })}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending ? "Saving…" : "Save Scheme"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Score Breakdown Popover                                                     */
/* -------------------------------------------------------------------------- */

function BreakdownRow({ label, value, normalized, contribution, weight, higherIsBetter }: {
  label: string; value: number; normalized: number;
  contribution: number; weight: number; higherIsBetter?: boolean;
}) {
  return (
    <tr className="border-b text-xs">
      <td className="py-1.5 pr-2">{label}</td>
      <td className="py-1.5 text-right text-muted-foreground">{value}</td>
      <td className="py-1.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${normalized}%` }} />
          </div>
          <span>{normalized}%</span>
        </div>
      </td>
      <td className="py-1.5 text-right font-medium">{contribution.toFixed(1)}pts</td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Agent Score Row                                                             */
/* -------------------------------------------------------------------------- */

function AgentScoreRow({ rank, score, scheme }: { rank: number; score: AgentScore; scheme: ScoringScheme }) {
  const [expanded, setExpanded] = useState(false);

  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
  const metricLabels = Object.fromEntries(
    scheme.metrics.map((m) => [m.key, m.label])
  );

  return (
    <>
      <tr
        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        <td className="py-3 pl-3 text-sm font-medium text-muted-foreground">{rankEmoji}</td>
        <td className="py-3">
          <div>
            <p className="font-medium text-sm">{score.agent.name}</p>
            <p className="text-xs text-muted-foreground">{score.agent.email}</p>
          </div>
        </td>
        <td className="py-3 text-center">
          <ScoreBadge score={score.score} />
        </td>
        <td className="py-3 text-right text-sm">{score.raw.tickets_solved}</td>
        <td className="py-3 text-right text-sm">{score.raw.sla_adherence}%</td>
        <td className="py-3 text-right text-sm">{score.raw.mttr_minutes}m</td>
        <td className="py-3 text-right text-sm pr-3">
          {score.raw.csat != null ? score.raw.csat : "—"}
        </td>
        <td className="py-3 pr-2 text-muted-foreground">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-muted/20">
          <td colSpan={8} className="px-6 py-3">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Score Breakdown</p>
            <table className="w-full max-w-lg">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left pb-1">Metric</th>
                  <th className="text-right pb-1">Raw</th>
                  <th className="text-right pb-1">Normalized</th>
                  <th className="text-right pb-1">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(score.breakdown).map(([key, data]) => (
                  <BreakdownRow
                    key={key}
                    label={metricLabels[key] ?? key}
                    value={data.value}
                    normalized={data.normalized}
                    contribution={data.contribution}
                    weight={data.weight}
                  />
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Main Page                                                                   */
/* -------------------------------------------------------------------------- */

export default function AgentScoringPage() {
  const [period, setPeriod] = useState<"monthly" | "weekly" | "all_time">("monthly");
  const [schemeEditorOpen, setSchemeEditorOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();
  const { can } = usePermissions(currentUser?.role ?? "agent");
  const canManageSettings = can(PERMISSIONS.SETTINGS_MANAGE);

  const { data: schemeData } = useQuery({
    queryKey: ["agent-scoring", "scheme"],
    queryFn: agentScoringApi.getScheme,
  });

  const { data: scoresData, isLoading } = useQuery({
    queryKey: ["agent-scoring", "scores", period],
    queryFn: () => agentScoringApi.getScores(period),
  });

  const scheme = schemeData?.data;
  const scores = scoresData?.data ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />Agent Performance Scores
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {scheme?.name ?? "Scoring scheme"} · {period.replace("_", " ")} period
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {(["monthly", "weekly", "all_time"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "default" : "outline"}
                className="h-7 text-xs capitalize"
                onClick={() => setPeriod(p)}
              >
                {p.replace("_", " ")}
              </Button>
            ))}
          </div>
          {canManageSettings && scheme && (
            <Button size="sm" variant="outline" onClick={() => setSchemeEditorOpen(true)}>
              <Settings className="h-3.5 w-3.5 mr-1" />Edit Scheme
            </Button>
          )}
        </div>
      </div>

      {/* Metric weights summary */}
      {scheme && (
        <div className="flex flex-wrap gap-2">
          {scheme.metrics.filter((m) => m.enabled).map((m) => (
            <div key={m.key} className="flex items-center gap-1.5 text-xs bg-muted px-2.5 py-1 rounded-full">
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{m.label}</span>
              <span className="font-bold">{m.weight}%</span>
              <span className="text-muted-foreground">
                {m.higher_is_better ? <ArrowUp className="h-2.5 w-2.5 text-green-500 inline" /> : <ArrowDown className="h-2.5 w-2.5 text-red-500 inline" />}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agent Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No agent data yet for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 pl-3 w-8">#</th>
                    <th className="text-left py-2">Agent</th>
                    <th className="text-center py-2">Score</th>
                    <th className="text-right py-2">Tickets</th>
                    <th className="text-right py-2">SLA %</th>
                    <th className="text-right py-2">MTTR</th>
                    <th className="text-right py-2 pr-3">CSAT</th>
                    <th className="w-6" />
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score, i) =>
                    scheme ? (
                      <AgentScoreRow key={score.agent.id} rank={i + 1} score={score} scheme={scheme} />
                    ) : null
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Highlight */}
      {scores.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {scores.slice(0, 3).map((s, i) => (
            <Card key={s.agent.id} className={i === 0 ? "border-yellow-300 shadow-yellow-100/50 shadow-md" : ""}>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl mb-1">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                <p className="font-semibold text-sm truncate">{s.agent.name}</p>
                <ScoreBadge score={s.score} />
                <p className="text-xs text-muted-foreground mt-2">{s.raw.tickets_solved} tickets · {s.raw.sla_adherence}% SLA</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scheme Editor */}
      {schemeEditorOpen && scheme && (
        <SchemeEditor
          open={schemeEditorOpen}
          onClose={() => setSchemeEditorOpen(false)}
          scheme={scheme}
        />
      )}
    </div>
  );
}
