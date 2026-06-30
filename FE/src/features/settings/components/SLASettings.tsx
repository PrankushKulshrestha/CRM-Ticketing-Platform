
import { useEffect, useState } from "react";
import { useSLAPolicy, useUpdateSLAPolicy } from "../hooks/useSLAPolicy";
import type { PriorityLimits, SLAPolicy } from "../api/slaPolicyApi";

/* -------------------------------------------------------------------------- */
/* Priority display metadata                                                  */
/* -------------------------------------------------------------------------- */

// Keys match the string SLAPriority values the backend now uses
const PRIORITIES = [
  { code: "low",      label: "Low",    color: "text-slate-500" },
  { code: "medium",   label: "Medium", color: "text-blue-500"  },
  { code: "high",     label: "High",   color: "text-orange-500"},
  { code: "critical", label: "Critical / Urgent", color: "text-red-500" },
] as const;

const ESCALATION_LEVELS = [
  { level: "2", label: "Level 2", hint: "First escalation" },
  { level: "3", label: "Level 3", hint: "Second escalation" },
  { level: "4", label: "Level 4", hint: "Third escalation" },
  { level: "5", label: "Level 5 (Final)", hint: "Terminal — next breach = SLA Violated" },
] as const;

// Max realistic value: 10 000 h ≈ 416 days
const MAX_HOURS = 10_000;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function minsToHours(m: number) { return Math.round((m / 60) * 100) / 100; }
function hoursToMins(h: number) { return Math.round(h * 60); }

function parseHours(val: string): number | null {
  const n = parseFloat(val);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_HOURS) return null;
  return n;
}

function fieldError(val: string): string | null {
  const n = parseFloat(val);
  if (val === "" || !Number.isFinite(n)) return "Required";
  if (n <= 0) return "Must be > 0";
  if (n > MAX_HOURS) return `Max ${MAX_HOURS.toLocaleString()} h`;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Seed local state from the fetched policy                                  */
/* -------------------------------------------------------------------------- */

interface LocalPriorityLimits { responseHours: string; resolutionHours: string; }
type LocalByPriority = Record<string, LocalPriorityLimits>;
type LocalEscalation = Record<string, string>;

function policyToLocal(policy: SLAPolicy): { byPriority: LocalByPriority; escalation: LocalEscalation } {
  const byPriority: LocalByPriority = {};
  for (const p of PRIORITIES) {
    // Support both legacy numeric keys ("1".."4") and new string keys
    const limits =
      (policy.byPriority as Record<string, PriorityLimits>)[p.code] ??
      { responseMinutes: 60, resolutionMinutes: 480 };
    byPriority[p.code] = {
      responseHours:   String(minsToHours(limits.responseMinutes)),
      resolutionHours: String(minsToHours(limits.resolutionMinutes)),
    };
  }

  const escalation: LocalEscalation = {};
  for (const l of ESCALATION_LEVELS) {
    const mins = (policy.escalationMinutes as Record<string, number>)[l.level] ?? 60;
    escalation[l.level] = String(minsToHours(mins));
  }

  return { byPriority, escalation };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function SLASettings() {
  const { data: policy, isLoading } = useSLAPolicy();
  const { mutate, isPending } = useUpdateSLAPolicy();

  const [byPriority, setByPriority]   = useState<LocalByPriority>({});
  const [escalation, setEscalation]   = useState<LocalEscalation>({});
  const [dirty, setDirty]             = useState(false);
  const [saveStatus, setSaveStatus]   = useState<"idle" | "success" | "error">("idle");
  const [showErrors, setShowErrors]   = useState(false);

  useEffect(() => {
    if (!policy) return;
    const local = policyToLocal(policy);
    setByPriority(local.byPriority);
    setEscalation(local.escalation);
    setDirty(false);
    setShowErrors(false);
  }, [policy]);

  function setPriorityField(code: string, field: keyof LocalPriorityLimits, value: string) {
    setByPriority((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
    setDirty(true);
  }

  function setEscalationField(level: string, value: string) {
    setEscalation((prev) => ({ ...prev, [level]: value }));
    setDirty(true);
  }

  function handleSave() {
    setShowErrors(true);

    const byPriorityPayload: Record<string, PriorityLimits> = {};
    for (const p of PRIORITIES) {
      const local = byPriority[p.code];
      if (!local) { setSaveStatus("error"); return; }
      const rH = parseHours(local.responseHours);
      const resH = parseHours(local.resolutionHours);
      if (rH === null || resH === null) { setSaveStatus("error"); return; }
      byPriorityPayload[p.code] = {
        responseMinutes:   hoursToMins(rH),
        resolutionMinutes: hoursToMins(resH),
      };
    }

    const escalationPayload: Record<string, number> = {};
    for (const l of ESCALATION_LEVELS) {
      const h = parseHours(escalation[l.level]);
      if (h === null) { setSaveStatus("error"); return; }
      escalationPayload[l.level] = hoursToMins(h);
    }

    mutate(
      { byPriority: byPriorityPayload, escalationMinutes: escalationPayload },
      {
        onSuccess: () => { setDirty(false); setShowErrors(false); setSaveStatus("success"); setTimeout(() => setSaveStatus("idle"), 3000); },
        onError:   () => { setSaveStatus("error"); setTimeout(() => setSaveStatus("idle"), 4000); },
      },
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading SLA policy…</p>;

  return (
    <div className="space-y-8">
      {/* Level 1 — per-priority limits */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Level 1 — First Response &amp; Resolution Limits</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Applied when a ticket is first created. Enter any value in hours (e.g. <code>0.5</code> = 30 min, <code>48</code> = 2 days). Max {MAX_HOURS.toLocaleString()} h.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 text-left">Priority</th>
                <th className="py-2.5 px-4 text-left">First Response (h)</th>
                <th className="py-2.5 px-4 text-left">Resolution (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {PRIORITIES.map((p) => {
                const rErr  = showErrors ? fieldError(byPriority[p.code]?.responseHours ?? "") : null;
                const resErr = showErrors ? fieldError(byPriority[p.code]?.resolutionHours ?? "") : null;
                return (
                  <tr key={p.code} className="hover:bg-muted/20 transition-colors">
                    <td className={`py-2.5 px-4 font-medium ${p.color}`}>{p.label}</td>
                    <td className="py-2 px-4">
                      <div>
                        <input
                          type="number" min="0.01" max={MAX_HOURS} step="any"
                          value={byPriority[p.code]?.responseHours ?? ""}
                          onChange={(e) => setPriorityField(p.code, "responseHours", e.target.value)}
                          className={`w-28 rounded-lg border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${rErr ? "border-red-400" : "border-border/60"}`}
                        />
                        {rErr && <p className="text-[10px] text-red-500 mt-0.5">{rErr}</p>}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      <div>
                        <input
                          type="number" min="0.01" max={MAX_HOURS} step="any"
                          value={byPriority[p.code]?.resolutionHours ?? ""}
                          onChange={(e) => setPriorityField(p.code, "resolutionHours", e.target.value)}
                          className={`w-28 rounded-lg border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${resErr ? "border-red-400" : "border-border/60"}`}
                        />
                        {resErr && <p className="text-[10px] text-red-500 mt-0.5">{resErr}</p>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Levels 2-5 — escalation budgets */}
      <div>
        <h3 className="text-sm font-semibold mb-1">Levels 2–5 — Escalation Budgets</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Fresh time budget (hours) granted at each level after the previous level's resolution window elapses unresolved.
          Level 5 breach = SLA Violated.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 px-4 text-left">Level</th>
                <th className="py-2.5 px-4 text-left">Hint</th>
                <th className="py-2.5 px-4 text-left">Budget (h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ESCALATION_LEVELS.map((l) => {
                const err = showErrors ? fieldError(escalation[l.level] ?? "") : null;
                return (
                  <tr key={l.level} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-4 font-medium">{l.label}</td>
                    <td className="py-2.5 px-4 text-xs text-muted-foreground">{l.hint}</td>
                    <td className="py-2 px-4">
                      <div>
                        <input
                          type="number" min="0.01" max={MAX_HOURS} step="any"
                          value={escalation[l.level] ?? ""}
                          onChange={(e) => setEscalationField(l.level, e.target.value)}
                          className={`w-28 rounded-lg border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${err ? "border-red-400" : "border-border/60"}`}
                        />
                        {err && <p className="text-[10px] text-red-500 mt-0.5">{err}</p>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button" onClick={handleSave} disabled={!dirty || isPending}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
        >
          {isPending ? "Saving…" : "Save SLA Policy"}
        </button>
        {saveStatus === "success" && <span className="text-sm text-emerald-600">✓ Policy saved</span>}
        {saveStatus === "error"   && <span className="text-sm text-red-500">✗ Check highlighted fields</span>}
        {saveStatus === "idle" && dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  );
}


/* -------------------------------------------------------------------------- */
/* Priority display metadata                                                  */
/* -------------------------------------------------------------------------- */
