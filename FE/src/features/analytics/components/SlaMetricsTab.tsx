
import { CheckCircle2, Clock } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type TicketSlaMilestone = {
  label: string;
  target: string;
  detail: string;
  status: "done" | "pending";
};

export type ResolutionVsResponsePoint = {
  month: string;
  firstResponse: number;
  firstResolution: number;
};

export type ChannelBreach = {
  name: string;
  violations: number;
};

export type ResolutionBucket = {
  bucket: string;
  count: number;
  outlier?: boolean;
};

export type SLACompliancePoint = {
  date: string;
  fulfilled: number;
  unfulfilled: number;
};

/* -------------------------------------------------------------------------- */

const safePercent = (value: number, total: number) =>
  total > 0 ? Number(((value / total) * 100).toFixed(4)) : 0;

/* -------------------------------------------------------------------------- */

export default function SlaMetricsTab() {
  const milestones: TicketSlaMilestone[] = [
    { label: "Close SLA", target: "24h", detail: "Scheduled", status: "pending" },
    { label: "First Response", target: "4h", detail: "1h 42m", status: "done" },
    { label: "Resolution", target: "8h", detail: "6h 18m", status: "done" },
  ];

  const completed = milestones.filter((m) => m.status === "done").length;
  const progress = safePercent(completed, milestones.length);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex justify-between mb-4">
          <div>
            <p className="font-semibold">Ticket SLA Status</p>
            <p className="text-xs text-muted-foreground">
              Ticket #TK-20481
            </p>
          </div>

          <span className="text-xs text-amber-600">In Progress</span>
        </div>

        <div className="space-y-3">
          {milestones.map((m) => {
            const done = m.status === "done";

            return (
              <div key={m.label} className="flex gap-3">
                <div
                  className={`w-6 h-6 flex items-center justify-center rounded-full ${
                    done ? "bg-emerald-500/20" : "bg-amber-500/20"
                  }`}
                >
                  {done ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                </div>

                <div className="flex-1">
                  <p className="text-xs font-medium">{m.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.target} · {m.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="h-2 bg-muted rounded">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        SLA charts will load when API is connected.
      </div>
    </div>
  );
}